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
