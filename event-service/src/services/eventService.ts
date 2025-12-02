import { z } from "zod";
import { createLogger, format, transports } from "winston";
import { Event } from "../models/Event";
import { ERROR_CODES } from "../constants/errorCodes";

const logger = createLogger({
  level: "info",
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

// Validation schema for creating events
const CreateEventSchema = z
  .object({
    title: z.string().min(5).max(100),
    description: z.string().min(20).max(500),
    body: z.string().min(50),
    location: z.string().min(3).max(200),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    price: z.number().min(0),
    currency: z.enum([
      "USD",
      "EUR",
      "INR",
      "GBP",
      "AUD",
      "CAD",
      "JPY",
      "CNY",
      "CHF",
      "SGD",
    ]),
    category: z.enum([
      "Music",
      "Sports",
      "Technology",
      "Art",
      "Fashion",
      "Food",
      "Travel",
      "Health",
      "Education",
      "Business",
      "Photography",
      "Cultural",
      "Gaming",
      "Entertainment",
      "Environment",
      "Networking",
    ]),
    eventType: z.enum(["offline", "online", "hybrid"]),
    maxAttendees: z.number().int().min(1).max(50).optional(),
    tags: z.string().max(200).optional(),
    eventUrl: z.string().url().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    requirements: z.string().max(500).optional(),
    refundPolicy: z.string().max(500).optional(),
    ageRestriction: z.number().int().min(0).max(99).optional(),
    registrationDeadline: z.string().datetime().optional(),
    allowWaitlist: z.boolean().optional(),
    sendReminders: z.boolean().optional(),
    allowGuestRegistration: z.boolean().optional(),
    isPublished: z.boolean().optional(),
    imageUrl: z.string().url().optional(),
    videoUrl: z.string().url().optional(),
  })
  .refine(
    (data) => {
      const startDate = new Date(data.startDate);
      const now = new Date();
      return startDate > now;
    },
    {
      message: "Event cannot be in the past",
      path: ["startDate"],
    }
  )
  .refine(
    (data) => {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      return endDate > startDate;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

/**
 * Create a new event
 */
export const createEvent = async (
  requestId: string,
  data: any,
  headers?: Record<string, any>
): Promise<any> => {
  const userId = headers?.["x-user-id"];

  if (!userId) {
    logger.warn("Create event attempted without authentication", { requestId });
    return {
      status: 401,
      message: "User not authenticated",
      data: null,
    };
  }

  // Validate input
  const result = CreateEventSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      issue: issue.message,
    }));
    logger.warn("Invalid event creation input", { requestId, errors, userId });
    return {
      status: 400,
      message: "Invalid input provided",
      data: errors,
    };
  }

  const validatedData = result.data;

  try {
    // Map eventType from lowercase to uppercase
    const eventTypeMap: Record<string, "OFFLINE" | "ONLINE" | "HYBRID"> = {
      offline: "OFFLINE",
      online: "ONLINE",
      hybrid: "HYBRID",
    };

    const newEvent = await Event.create({
      title: validatedData.title,
      description: validatedData.description,
      body: validatedData.body,
      location: validatedData.location,
      startDate: new Date(validatedData.startDate),
      endDate: new Date(validatedData.endDate),
      startTime: validatedData.startTime,
      endTime: validatedData.endTime,
      price: validatedData.price,
      currency: validatedData.currency,
      category: validatedData.category,
      eventType: eventTypeMap[validatedData.eventType],
      imageUrl: validatedData.imageUrl,
      videoUrl: validatedData.videoUrl,
      organizerId: userId,
      maxAttendees: validatedData.maxAttendees,
      tags: validatedData.tags,
      eventUrl: validatedData.eventUrl,
      contactEmail: validatedData.contactEmail,
      contactPhone: validatedData.contactPhone,
      requirements: validatedData.requirements,
      refundPolicy: validatedData.refundPolicy,
      ageRestriction: validatedData.ageRestriction,
      registrationDeadline: validatedData.registrationDeadline
        ? new Date(validatedData.registrationDeadline)
        : undefined,
      allowWaitlist: validatedData.allowWaitlist || false,
      sendReminders: validatedData.sendReminders !== false,
      allowGuestRegistration: validatedData.allowGuestRegistration || false,
      isPublished: validatedData.isPublished !== false,
    });

    logger.info("Event created successfully", {
      requestId,
      eventId: newEvent._id,
      userId,
    });

    return {
      status: 201,
      message: "Event created successfully",
      data: newEvent,
    };
  } catch (error) {
    logger.error("Error creating event", { requestId, error });
    return {
      status: 500,
      message: "Failed to create event",
      data: null,
    };
  }
};

/**
 * Get events count by organizer
 */
export const getEventsCount = async (
  requestId: string,
  data: any,
  headers?: Record<string, any>
): Promise<any> => {
  const { organizerId } = data || {};

  if (!organizerId) {
    return {
      status: 400,
      message: "organizerId is required",
      data: null,
    };
  }

  try {
    const count = await Event.countDocuments({ organizerId });

    logger.info("Event count fetched successfully", {
      requestId,
      organizerId,
      count,
    });
    return {
      status: 200,
      message: "Event count fetched successfully",
      data: { count },
    };
  } catch (error) {
    logger.error("Error fetching event count", { requestId, error });
    return {
      status: 500,
      message: "Error fetching event count",
      data: null,
    };
  }
};

/**
 * Get events created by the user
 */
export const getMyEvents = async (
  requestId: string,
  data: any,
  headers?: Record<string, any>
): Promise<any> => {
  const userId = headers?.["x-user-id"];

  if (!userId) {
    return {
      status: 401,
      message: "User not authenticated",
      data: null,
    };
  }

  try {
    const events = await Event.find({ organizerId: userId }).sort({
      createdAt: -1,
    });

    logger.info("User events fetched successfully", { requestId, userId });
    return {
      status: 200,
      message: "User events fetched successfully",
      data: { events },
    };
  } catch (error) {
    logger.error("Error fetching user events", { requestId, error });
    return {
      status: 500,
      message: "Failed to fetch events",
      data: null,
    };
  }
};

/**
 * Get all events with pagination and filters
 */
export const getAllEvents = async (
  requestId: string,
  data: any,
  headers?: Record<string, any>
): Promise<any> => {
  try {
    const { page = "1", limit = "10", search, status } = data || {};

    const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit as string, 10) || 10, 1);
    const skip = (pageNum - 1) * limitNum;

    const now = new Date();
    const filter: any = {};

    if (search) {
      filter.$text = { $search: search };
    }

    if (status) {
      if (status === "upcoming") {
        filter.startDate = { $gt: now };
      } else if (status === "ongoing") {
        filter.startDate = { $lte: now };
        filter.endDate = { $gte: now };
      } else if (status === "completed") {
        filter.endDate = { $lt: now };
      }
    }

    const [events, totalItems] = await Promise.all([
      Event.find(filter).sort({ startDate: 1 }).skip(skip).limit(limitNum),
      Event.countDocuments(filter),
    ]);

    logger.info("All events fetched successfully", { requestId });
    return {
      status: 200,
      message: "All events fetched successfully",
      data: {
        events,
        pagination: {
          totalItems,
          totalPages: Math.ceil(totalItems / limitNum),
          currentPage: pageNum,
          pageSize: limitNum,
        },
      },
    };
  } catch (error) {
    logger.error("Failed to fetch all events", { requestId, error });
    return {
      status: 500,
      message: "Failed to fetch events",
      data: null,
    };
  }
};

/**
 * Get event by ID
 */
export const getEventById = async (
  requestId: string,
  data: any,
  headers?: Record<string, any>
): Promise<any> => {
  const { id } = data || {};

  if (!id) {
    return {
      status: 400,
      message: "Event ID is required",
      data: null,
    };
  }

  try {
    const event = await Event.findById(id);

    if (!event) {
      logger.warn("Event not found", { requestId, eventId: id });
      return {
        status: 404,
        message: "Event not found",
        data: null,
      };
    }

    logger.info("Event fetched successfully", { requestId, eventId: id });
    return {
      status: 200,
      message: "Event fetched successfully",
      data: event,
    };
  } catch (error) {
    logger.error("Failed to fetch event", { requestId, error });
    return {
      status: 500,
      message: "Failed to fetch event",
      data: null,
    };
  }
};
