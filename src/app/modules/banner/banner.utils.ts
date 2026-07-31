import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import AppError from "../../errors/AppError";

/**
 * Deliberately iterative (explicit stack), not recursive: this runs
 * BEFORE the recursive Zod z.lazy() descent that validates the tree's
 * shape, specifically so an adversarial deeply-nested JSON body gets
 * rejected here first, on a cheap iterative walk, rather than risking a
 * stack overflow inside the recursive parser itself.
 */
export const assertTreeDepth = (root: unknown): void => {
  const stack: { node: unknown; depth: number }[] = [{ node: root, depth: 1 }];

  while (stack.length) {
    const { node, depth } = stack.pop()!;

    if (depth > 8) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Layout tree exceeds max depth of 8"
      );
    }

    const n = node as { type?: string; children?: unknown[] };
    if (n && n.type === "split" && Array.isArray(n.children)) {
      for (const child of n.children) {
        stack.push({ node: child, depth: depth + 1 });
      }
    }
  }
};

/**
 * Express middleware wrapping `assertTreeDepth`. Must be wired into the
 * `/create` and `/update/:id` route chains BEFORE `validateRequest` (the
 * Zod parse), not after it — the whole point of the iterative depth guard
 * is to reject pathologically deep payloads cheaply, on the raw req.body,
 * before the recursive z.lazy() descent ever gets to run on them. Putting
 * this after validateRequest (e.g. inside the controller) defeats that:
 * Zod's recursive parser would still walk the entire adversarial tree
 * first on every request, risking a stack overflow, and only reject the
 * payload afterwards.
 */
export const checkBreakpointsDepth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const breakpoints = req.body?.breakpoints as
      | Record<string, unknown>
      | undefined;
    if (breakpoints) {
      assertTreeDepth(breakpoints.laptop);
      assertTreeDepth(breakpoints.tablet);
      assertTreeDepth(breakpoints.mobile);
    }
    next();
  } catch (err) {
    next(err);
  }
};
