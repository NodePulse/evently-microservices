import { getD1Client } from "../config/d1.config";
import { EventRegistration, NewEventRegistration } from "../db/schema";
import { createLogger, format, transports } from "winston";

const logger = createLogger({
  level: "info",
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

// Helper to map D1 result to EventRegistration type
function mapRegistrationRow(row: any): EventRegistration {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    registeredAt: row.registered_at,
    status: row.status as any,
  };
}

export const registrationRepository = {
  /**
   * Create a new registration
   */
  async create(data: NewEventRegistration): Promise<EventRegistration> {
    const client = getD1Client();

    try {
      const sql = `
        INSERT INTO event_registrations (id, event_id, user_id, status)
        VALUES (?, ?, ?, ?)
        RETURNING *
      `;

      const result = await client.query(sql, [
        data.id,
        data.eventId,
        data.userId,
        data.status || "confirmed",
      ]);

      const registration = result.results[0];
      logger.info("Registration created", { id: registration.id });
      return mapRegistrationRow(registration);
    } catch (error) {
      logger.error("Failed to create registration", {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        eventId: data.eventId,
        userId: data.userId,
      });
      throw error;
    }
  },

  /**
   * Find registrations by event ID
   */
  async findByEventId(eventId: string): Promise<EventRegistration[]> {
    const client = getD1Client();

    try {
      const result = await client.query(
        "SELECT * FROM event_registrations WHERE event_id = ? AND status = 'confirmed'",
        [eventId]
      );
      if (!result.results) return [];
      return result.results.map((row: any) => mapRegistrationRow(row));
    } catch (error) {
      logger.error("Failed to find registrations by event", {
        error: error instanceof Error ? error.message : String(error),
        eventId,
      });
      throw error;
    }
  },

  /**
   * Find registration by user and event
   */
  async findByUserAndEvent(
    userId: string,
    eventId: string
  ): Promise<EventRegistration | null> {
    const client = getD1Client();

    try {
      const result = await client.query(
        "SELECT * FROM event_registrations WHERE user_id = ? AND event_id = ?",
        [userId, eventId]
      );
      if (!result.results?.[0]) return null;
      return mapRegistrationRow(result.results[0]);
    } catch (error) {
      logger.error("Failed to find registration", {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        userId,
        eventId,
      });
      throw error;
    }
  },
};
