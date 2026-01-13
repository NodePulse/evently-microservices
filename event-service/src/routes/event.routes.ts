import { Router } from "express";
import * as eventController from "../controllers/eventController";
import { upload } from "../config/r2.config";
import { requireAuth, optionalAuth } from "../middleware/auth.middleware";

const router = Router();

// Public routes (no auth required, but gateway validation still applies)
router.get("/health", eventController.getHealth);
router.get("/count", eventController.getEventsCount);
router.get("/all-events", optionalAuth, eventController.getAllEvents); // Optional auth for personalized results
router.get("/stats/by-user", eventController.getEventsGroupedByUser);
router.get("/:id", optionalAuth, eventController.getEventById);
router.get("/:id/attendees", optionalAuth, eventController.getEventAttendees);

router.post("/:id/join", requireAuth, eventController.joinEvent);
router.get(
  "/:id/registration",
  requireAuth,
  eventController.getRegistrationByUserAndEvent
);

router.post(
  "/",
  requireAuth,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  eventController.createEvent
);

router.post(
  "/create",
  requireAuth,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  eventController.createEvent
);

router.get("/my-events", requireAuth, eventController.getMyEvents);
router.post(
  "/upload",
  requireAuth,
  upload.single("image"),
  eventController.uploadImage
);

export default router;
