import { rabbitMQService } from "./rabbitmq.service";
import { ticketGenerator } from "./ticketGenerator";
import { ticketRepository } from "../repositories/ticket.repository";
import { eventRepository } from "../repositories/event.repository";
import { createLogger, format, transports } from "winston";

const logger = createLogger({
  level: "info",
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

export const startTicketWorker = async () => {
  logger.info("Starting ticket worker...");

  // Consume from dedicated ticket-generation queue
  await rabbitMQService.consume("ticket-generation", async (msg: any) => {
    logger.info("Processing ticket generation message", { msg });

    const { eventType, ticketId, eventId, userId, ticketCode, name } = msg;

    if (eventType !== "TICKET_REQUESTED") {
      logger.warn("Unknown event type received", { eventType });
      return; // Ignore unknown events
    }

    if (!ticketId || !eventId) {
      logger.warn("Message missing required fields", { ticketId, eventId });
      return;
    }

    // Check if image already exists (Idempotency)
    // Skipped for now as we rely on ticketId and re-generation is acceptable

    try {
      // Fetch Event Details
      const event = await eventRepository.findById(eventId);
      if (!event) {
        logger.error(`Event not found for ID ${eventId}`);
        return;
      }

      // Use userName from message or fallback to userId (or "Guest")
      const attendeeName = name || userId || "Guest";

      // Generate and Upload
      const publicUrl = await ticketGenerator.generateAndUpload(
        {
          id: ticketId,
          ticketCode: ticketCode || "UNKNOWN",
          userName: name,
        } as any, // ID and Code are needed
        event.title,
        event.start_date,
        event.end_date,
        event.location,
        event.event_type,
        event.start_time,
        event.end_time,
        attendeeName
      );

      if (publicUrl) {
        // Update DB
        await ticketRepository.update(ticketId, { ticketImageUrl: publicUrl });
        await eventRepository.update(eventId, {
          current_attendees: event.current_attendees + 1,
        });

        logger.info("Ticket image generated and updated successfully", {
          ticketId,
          publicUrl,
        });

        // Publish Ticket Generated Event (Optional)
        await rabbitMQService.publish("ticket-generated", {
          eventType: "TICKET_GENERATED",
          ticketId,
          ticketImageUrl: publicUrl,
          userId,
          eventId,
        });
      } else {
        logger.error("Generated URL was empty", { ticketId });
      }
    } catch (error) {
      logger.error("Failed to process ticket generation", { ticketId, error });
      // In a real production app, we would NACK here or send to DLQ.
      // RabbitMQService currently ACKs on error catch block (or rather, callback is awaited inside try/catch in consume).
    }
  });
};
