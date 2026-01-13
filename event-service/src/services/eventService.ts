import { cuid, z } from "zod";
import { createLogger, format, transports } from "winston";
import { eventRepository } from "../repositories/event.repository";
import { registrationRepository } from "../repositories/registration.repository";
import { rabbitMQService } from "./rabbitmq.service";
import { v4 as uuidv4 } from "uuid";
import { ticketRepository } from "../repositories/ticket.repository";
import { ticketGenerator } from "./ticketGenerator";
import { generateTicketCode } from "../utils/ticketCode";
import { userRepository } from "../repositories/user.repository";

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
    price: z.coerce.number().min(0),
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
    maxAttendees: z.coerce.number().int().min(1).max(50).default(10).optional(),
    tags: z.string().max(200).optional(),
    eventUrl: z.string().url().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    requirements: z.string().max(500).optional(),
    refundPolicy: z.string().max(500).optional(),
    ageRestriction: z.coerce.number().int().min(0).max(99).optional(),
    registrationDeadline: z.string().datetime().optional(),
    allowWaitlist: z
      .preprocess((val) => val === "true" || val === true, z.boolean())
      .optional(),
    sendReminders: z
      .preprocess((val) => val === "true" || val === true, z.boolean())
      .optional(),
    allowGuestRegistration: z
      .preprocess((val) => val === "true" || val === true, z.boolean())
      .optional(),
    isPublished: z
      .preprocess((val) => val === "true" || val === true, z.boolean())
      .optional(),
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
      return endDate >= startDate;
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
  data.id = uuidv4();
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

    const newEvent = await eventRepository.create({
      id: data.id,
      title: validatedData.title,
      description: validatedData.description,
      body: validatedData.body,
      location: validatedData.location,
      start_date: validatedData.startDate,
      end_date: validatedData.endDate,
      start_time: validatedData.startTime,
      end_time: validatedData.endTime,
      price: validatedData.price,
      currency: validatedData.currency,
      category: validatedData.category,
      event_type: eventTypeMap[validatedData.eventType],
      image_url: validatedData.imageUrl,
      video_url: validatedData.videoUrl,
      organizer_id: userId,
      max_attendees: validatedData.maxAttendees,
      tags: validatedData.tags,
      event_url: validatedData.eventUrl,
      contact_email: validatedData.contactEmail,
      contact_phone: validatedData.contactPhone,
      requirements: validatedData.requirements,
      refund_policy: validatedData.refundPolicy,
      age_restriction: validatedData.ageRestriction,
      registration_deadline: validatedData.registrationDeadline,
      allow_waitlist: validatedData.allowWaitlist || false,
      send_reminders: validatedData.sendReminders !== false,
      allow_guest_registration: validatedData.allowGuestRegistration || false,
      is_published: validatedData.isPublished !== false,
    });

    await rabbitMQService.publish("event-creation", {
      eventType: "EVENT_CREATED",
      eventId: newEvent.id,
      userId: userId,
    });

    logger.info("Event created successfully", {
      requestId,
      eventId: newEvent.id,
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
    const count = await eventRepository.countByOrganizer(organizerId);

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
 * Get event counts grouped by user (organizer)
 */
export const getEventsGroupedByUser = async (
  requestId: string,
  headers?: Record<string, any>
): Promise<any> => {
  try {
    const stats = await eventRepository.getStatsGroupedByUser();

    logger.info("Events grouped by user fetched successfully", { requestId });
    return {
      status: 200,
      message: "Events grouped by user fetched successfully",
      data: stats,
    };
  } catch (error) {
    logger.error("Error fetching events grouped by user", { requestId, error });
    return {
      status: 500,
      message: "Failed to fetch events grouped by user",
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
    const events = await eventRepository.findByOrganizer(userId);

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

    const filters: any = {};
    if (search) filters.search = search;
    if (status) filters.status = status;

    const { events, total } = await eventRepository.findAll(filters, {
      page: pageNum,
      limit: limitNum,
    });

    logger.info("All events fetched successfully", { requestId });
    return {
      status: 200,
      message: "All events fetched successfully",
      data: {
        events,
        pagination: {
          totalItems: total,
          totalPages: Math.ceil(total / limitNum),
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
    const event = await eventRepository.findById(id);

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

export const getRegistrationByUserAndEvent = async (
  requestId: string,
  data: any,
  headers?: Record<string, any>
): Promise<any> => {
  const { id } = data || {};
  const userId = headers?.["x-user-id"];

  if (!userId) {
    return {
      status: 401,
      message: "User not authenticated",
      data: null,
    };
  }

  if (!id) {
    return {
      status: 400,
      message: "Event ID is required",
      data: null,
    };
  }

  try {
    const registration = await registrationRepository.findByUserAndEvent(
      userId,
      id
    );

    if (!registration) {
      logger.warn("Registration not found", { requestId, eventId: id });
      return {
        status: 200,
        message: "Registration not found",
        data: {
          registered: false,
          eventId: id,
        },
      };
    }

    logger.info("Registration fetched successfully", {
      requestId,
      eventId: id,
    });
    return {
      status: 200,
      message: "Registration fetched successfully",
      data: registration,
    };
  } catch (error) {
    logger.error("Failed to fetch registration", { requestId, error });
    return {
      status: 500,
      message: "Failed to fetch registration",
      data: null,
    };
  }
};

export const joinEvent = async (
  requestId: string,
  data: any,
  headers?: Record<string, any>
): Promise<any> => {
  const { id } = data || {};
  const userId = headers?.["x-user-id"];

  if (!userId) {
    return {
      status: 401,
      message: "User not authenticated",
      data: null,
    };
  }

  if (!id) {
    return {
      status: 400,
      message: "Event ID is required",
      data: null,
    };
  }

  try {
    const eventId = id;
    const event = await eventRepository.findById(eventId);

    if (!event) {
      return {
        status: 404,
        message: "Event not found",
        data: null,
      };
    }

    // Check if user is organizer
    if (event.organizer_id === userId) {
      return {
        status: 400,
        message: "Organizer cannot join their own event",
        data: null,
      };
    }

    // Check if event is paid - paid events require payment processing
    if (event.price > 0) {
      return {
        status: 402, // Payment Required
        message: "This is a paid event. Please complete payment to register.",
        data: {
          eventId: event.id,
          price: event.price,
          currency: event.currency,
          requiresPayment: true,
        },
      };
    }

    // Check if already registered
    const existingRegistration =
      await registrationRepository.findByUserAndEvent(userId, eventId);

    if (existingRegistration) {
      return {
        status: 409, // Conflict
        message: "User already joined this event",
        data: null,
      };
    }

    // Check capacity
    if (event.max_attendees && event.current_attendees >= event.max_attendees) {
      return {
        status: 400,
        message: "Event is full",
        data: null,
      };
    }

    // Register user
    const registrationId = uuidv4();
    const registration = await registrationRepository.create({
      id: registrationId,
      eventId,
      userId,
      status: "confirmed",
    });

    // Create ticket for the user
    console.log("Creating ticket for user", userId, "event", eventId);
    let ticket = await ticketRepository.create({
      id: uuidv4(),
      eventId,
      userId,
      registrationId: registration.id,
      ticketCode: generateTicketCode({
        eventId,
        userId,
        registrationId,
        name: data.name,
      }),
      status: "valid", // Ticket is valid, but content is pending generation
    });

    // Publish Ticket Generation Request (Async)
    await rabbitMQService.publish("ticket-generation", {
      eventType: "TICKET_REQUESTED",
      ticketId: ticket.id,
      eventId: eventId,
      userId: userId,
      // Pass other necessary data if needed to avoid worker fetching too much
      ticketCode: ticket.ticketCode,
      userName: data.username,
      name: data.name,
    });

    // Also publish event-registration for other services (analytics, emails, etc.)
    await rabbitMQService.publish("event-registration", {
      registrationId: registration.id,
      eventId: eventId,
      userId: userId,
      ticketId: ticket.id,
      eventTitle: event.title,
      eventDate: [event.start_date, event.end_date],
      eventTime: [event.start_time, event.end_time],
      eventLocation: event.location,
      registeredAt: registration.registeredAt,
      ticketCode: ticket.ticketCode,
    });

    logger.info("User joined event, ticket generation queued", {
      requestId,
      userId,
      eventId,
      ticketId: ticket.id,
    });

    return {
      status: 200,
      message: "Joined event successfully. Ticket is being generated.",
      data: {
        registration,
        ticket: ticket, // Ticket will have ticketImageUrl as null/undefined initially
      },
    };
  } catch (error) {
    logger.error("Failed to join event", { requestId, error });
    return {
      status: 500,
      message: "Failed to join event",
      data: null,
    };
  }
};

/**
 * Get all attendees for an event
 */
export const getEventAttendees = async (
  requestId: string,
  data: any,
  headers?: Record<string, any>
): Promise<any> => {
  const { id, search, page = "1", limit = "10" } = data || {};
  logger.info("getEventAttendees called", {
    requestId,
    id,
    search,
    page,
    limit,
  });

  if (!id) {
    return {
      status: 400,
      message: "Event ID is required",
      data: null,
    };
  }

  try {
    const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit as string, 10) || 10, 1);

    // const registrations = await registrationRepository.findByEventId(id);
    // const organizer_id = await eventRepository.findById(id);
    // if (!organizer_id) {
    //   return {
    //     status: 404,
    //     message: "Event not found",
    //     data: null,
    //   };
    // }

    // // Extract only user IDs
    // const userIds = registrations.map((reg) => reg.userId);
    // userIds.push(organizer_id.organizer_id);

    // Fetch all users matching search criteria (always including organizer)
    const allUsers = await userRepository.findByUserIds(
      // userIds,
      id,
      search
      // organizer_id.organizer_id
    );

    logger.info("Event attendees fetched successfully", {
      requestId,
      eventId: id,
      // count: userIds.length,
    });

    const organizer = allUsers.find(
      (user: any) => user.eventRole === "ORGANIZER"
    );
    const allAttendees = allUsers.filter(
      (user: any) => user.eventRole === "ATTENDEE"
    );

    // Apply pagination to attendees only
    const totalAttendees = allAttendees.length;
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedAttendees = allAttendees.slice(startIndex, endIndex);

    return {
      status: 200,
      message: "Event attendees fetched successfully",
      data: {
        organizer: organizer || null,
        attendees: paginatedAttendees,
        pagination: {
          totalItems: totalAttendees,
          totalPages: Math.ceil(totalAttendees / limitNum),
          currentPage: pageNum,
          pageSize: limitNum,
        },
      },
    };
  } catch (error) {
    logger.error("Failed to fetch event attendees", { requestId, error });
    return {
      status: 500,
      message: "Failed to fetch event attendees",
      data: null,
    };
  }
};
