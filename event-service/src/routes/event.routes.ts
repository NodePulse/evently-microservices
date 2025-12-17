import { Router } from "express";
import * as eventController from "../controllers/eventController";
import { upload } from "../config/r2.config";

const router = Router();

router.get("/health", eventController.getHealth);
router.get("/count", eventController.getEventsCount);
router.get("/", eventController.getAllEvents);
router.get("/stats/by-user", eventController.getEventsGroupedByUser);
router.get("/:id", eventController.getEventById);

router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  eventController.createEvent
);

// Alias for /events to match API Gateway routing (if needed, but gateway strips prefix now)
// Keeping it for backward compatibility or direct access
router.post(
  "/create",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  eventController.createEvent
);

router.get("/my-events", eventController.getMyEvents);
router.post("/upload", upload.single("image"), eventController.uploadImage);

export default router;
