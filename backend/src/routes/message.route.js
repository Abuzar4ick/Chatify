import { Router } from "express";
const router = Router();
import { getAllContacts, getMessagesByUserId, sendMessage, getChatPartners } from '../controllers/message.controller.js';
import { protectRouter } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

router.use(arcjetProtection, protectRouter);

router.get("/contacts", getAllContacts);
router.get("/chats", getChatPartners);
router.get("/:id", getMessagesByUserId);
router.post("/send/:id", sendMessage);

export default router;
