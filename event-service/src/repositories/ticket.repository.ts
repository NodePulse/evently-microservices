import { getD1Client } from "../config/d1.config";
import { NewTicket, Ticket } from "../db/schema";
import { createLogger, format, transports } from "winston";
import { eventRepository } from "./event.repository";

const logger = createLogger({
  level: "info",
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

// Helper to map D1 result to Ticket type
function mapTicketRow(row: any): Ticket {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    registrationId: row.registration_id,
    ticketCode: row.ticket_code,
    ticketImageUrl: row.ticket_image_url,
    status: row.status as any,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const ticketRepository = {
  /**
   * Create a new ticket
   */
  async create(data: NewTicket): Promise<Ticket> {
    const client = getD1Client();

    try {
      const sql = `
        INSERT INTO tickets (id, event_id, user_id, registration_id, ticket_code, status)
        VALUES (?, ?, ?, ?, ?, ?)
        RETURNING *
      `;

      const result = await client.query(sql, [
        data.id,
        data.eventId,
        data.userId,
        data.registrationId,
        data.ticketCode,
        data.status || "valid",
      ]);

      const ticket = result.results[0];
      logger.info("Ticket created", { id: ticket.id });
      return mapTicketRow(ticket);
    } catch (error) {
      logger.error("Failed to create ticket", {
        error: error instanceof Error ? error.message : String(error),
        eventId: data.eventId,
        userId: data.userId,
      });
      throw error;
    }
  },

  /**
   * Find ticket by registration ID
   */
  async findByUserId(userId: string): Promise<Ticket | null> {
    const client = getD1Client();

    try {
      const result = await client.query(
        "SELECT * FROM tickets WHERE user_id = ?",
        [userId]
      );
      if (!result.results?.[0]) return null;
      return mapTicketRow(result.results[0]);
    } catch (error) {
      logger.error("Failed to find ticket", { error, userId });
      throw error;
    }
  },

  /**
   * Find all ticket and some event details by user ID
   */
  async findByUserIdWithEventDetails(
    userId: string,
    page: number,
    limit: number,
    search: string,
    status: string,
    type: string
  ): Promise<any[]> {
    const client = getD1Client();

    try {
      const result = await client.query(
        "SELECT * FROM tickets WHERE user_id = ?",
        [userId]
      );

      if (!result.results || result.results.length === 0) {
        return [];
      }

      const tickets: any[] = result.results.map(mapTicketRow);

      // Fetch event details for each ticket
      for (const ticket of tickets) {
        if (ticket.eventId) {
          const event = await client.query(
            "SELECT title, start_date, end_date, start_time, end_time, location FROM events WHERE id = ?",
            [ticket.eventId]
          );
          const eventDetails = event.results[0];
          const today = new Date();
          const startDate = new Date(eventDetails.start_date);
          const endDate = new Date(eventDetails.end_date);
          if (today >= startDate && today <= endDate) {
            ticket.status = "valid";
            ticket.type = "ongoing";
          } else {
            if (today < startDate) {
              ticket.type = "upcoming";
              ticket.status = "valid";
            }
            if (today > endDate) {
              ticket.type = "expired";
              ticket.status = "expired";
            }
          }
          ticket.event = eventDetails;
        }
      }

      return tickets;
    } catch (error) {
      logger.error("Failed to find tickets", { error, userId });
      throw error;
    }
  },
  /**
   * Update a ticket
   */
  async update(id: string, data: Partial<NewTicket>): Promise<Ticket> {
    const client = getD1Client();
    try {
      const fields: string[] = [];
      const params: any[] = [];

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          // Convert camelCase to snake_case for SQL
          const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
          fields.push(`${snakeKey} = ?`);
          params.push(value);
        }
      });

      fields.push('updated_at = datetime("now")');
      params.push(id);

      const sql = `UPDATE tickets SET ${fields.join(
        ", "
      )} WHERE id = ? RETURNING *`;
      const result = await client.query(sql, params);

      if (!result.results || result.results.length === 0) {
        throw new Error("Ticket not found");
      }
      return mapTicketRow(result.results[0]);
    } catch (error) {
      logger.error("Failed to update ticket", { error, id });
      throw error;
    }
  },
};
