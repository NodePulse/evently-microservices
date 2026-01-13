import { Router } from "express";
import * as ticketController from "../controllers/ticketController";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/get-all", requireAuth, ticketController.getAllTickets);

export default router;
