import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { chatValidationSchema } from "./chat.validations";
import { ChatControllers } from "./chat.controller";

const router = Router();

router.post(
  "/create",
  validateRequest(chatValidationSchema.createChatValidationSchema),
  ChatControllers.createChat
);

export const chatRoutes = router;
