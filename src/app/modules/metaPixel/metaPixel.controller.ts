import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { MetaPixelService } from "./metaPixel.service";

const getPublicConfig = catchAsync(async (req: Request, res: Response) => {
  const result = await MetaPixelService.getPublicConfig(req.ip);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Meta pixel public config retrived successfully",
    data: result,
  });
});

const getConfig = catchAsync(async (req: Request, res: Response) => {
  const result = await MetaPixelService.getAdminConfig();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Meta pixel config retrived successfully",
    data: result,
  });
});

const updateConfig = catchAsync(async (req: Request, res: Response) => {
  const result = await MetaPixelService.updateConfig(req.user.id, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Meta pixel config updated successfully",
    data: result,
  });
});

const previewPayload = catchAsync(async (req: Request, res: Response) => {
  const result = await MetaPixelService.previewPayload(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payload preview generated successfully",
    data: result,
  });
});

const testConnection = catchAsync(async (req: Request, res: Response) => {
  const result = await MetaPixelService.testConnection();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.ok
      ? "Test event accepted by Meta"
      : "Meta rejected the test event",
    data: result,
  });
});

const ingestEvent = catchAsync(async (req: Request, res: Response) => {
  const result = await MetaPixelService.ingestBrowserEvent(req.body, {
    clientIp: req.ip,
    userAgent: req.headers["user-agent"],
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Event processed",
    data: result,
  });
});

const getLogs = catchAsync(async (req: Request, res: Response) => {
  const result = await MetaPixelService.getLogs(
    req.query as Record<string, string>,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Meta pixel event logs retrived successfully",
    data: result.data,
    pagination: {
      currentPage: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
      totalPage: result.pagination.totalPage,
    },
  });
});

const retryLog = catchAsync(async (req: Request, res: Response) => {
  const result = await MetaPixelService.retryLog(req.params.id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Event re-queued",
    data: result,
  });
});

export const MetaPixelController = {
  getPublicConfig,
  getConfig,
  updateConfig,
  previewPayload,
  testConnection,
  ingestEvent,
  getLogs,
  retryLog,
};
