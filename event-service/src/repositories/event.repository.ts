import { getD1Client } from "../config/d1.config";
import { Event, NewEvent } from "../db/schema";
import { createLogger, format, transports } from "winston";

const logger = createLogger({
  level: "info",
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

// Helper to map D1 result to Event type
function mapEventRow(row: any): Event {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    body: row.body,
    location: row.location,
    start_date: row.start_date,
    end_date: row.end_date,
    start_time: row.start_time,
    end_time: row.end_time,
    price: row.price,
    currency: row.currency,
    category: row.category,
    event_type: row.event_type as any,
    organizer_id: row.organizer_id,
    max_attendees: row.max_attendees,
    current_attendees: row.current_attendees,
    tags: row.tags,
    event_url: row.event_url,
    contact_email: row.contact_email,
    contact_phone: row.contact_phone,
    requirements: row.requirements,
    refund_policy: row.refund_policy,
    age_restriction: row.age_restriction,
    registration_deadline: row.registration_deadline,
    allow_waitlist: !!row.allow_waitlist,
    send_reminders: !!row.send_reminders,
    allow_guest_registration: !!row.allow_guest_registration,
    is_published: !!row.is_published,
    image_url: row.image_url,
    video_url: row.video_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface EventFilters {
  search?: string;
  status?: "upcoming" | "ongoing" | "completed";
  category?: string;
}

export interface UserStats {
  userId: string;
  organized_events: number;
  attended_events: number;
  total_attendees: number;
}

export const eventRepository = {
  /**
   * Create a new event
   */
  async create(
    data: Omit<NewEvent, "createdAt" | "updatedAt" | "currentAttendees">
  ): Promise<Event> {
    const client = getD1Client();

    try {
      const sql = `
        INSERT INTO events (
          id, title, description, body, location, start_date, end_date, start_time, end_time,
          price, currency, category, event_type, organizer_id, max_attendees, tags,
          event_url, contact_email, contact_phone, requirements, refund_policy,
          age_restriction, registration_deadline, allow_waitlist, send_reminders,
          allow_guest_registration, is_published, image_url, video_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `;

      const result = await client.query(sql, [
        data.id,
        data.title,
        data.description,
        data.body,
        data.location,
        data.start_date,
        data.end_date,
        data.start_time,
        data.end_time,
        data.price,
        data.currency,
        data.category,
        data.event_type,
        data.organizer_id,
        data.max_attendees,
        data.tags,
        data.event_url,
        data.contact_email,
        data.contact_phone,
        data.requirements,
        data.refund_policy,
        data.age_restriction,
        data.registration_deadline,
        data.allow_waitlist ? 1 : 0,
        data.send_reminders ? 1 : 0,
        data.allow_guest_registration ? 1 : 0,
        data.is_published ? 1 : 0,
        data.image_url,
        data.video_url,
      ]);

      const event = result.results[0];
      logger.info("Event created", { id: event.id });
      return mapEventRow(event);
    } catch (error) {
      logger.error("Failed to create event", { error });
      throw error;
    }
  },

  /**
   * Find event by ID
   */
  async findById(id: string): Promise<Event | null> {
    const client = getD1Client();

    try {
      const result = await client.query("SELECT * FROM events WHERE id = ?", [
        id,
      ]);
      if (!result.results?.[0]) return null;
      return mapEventRow(result.results[0]);
    } catch (error) {
      logger.error("Failed to find event by ID", { error, id });
      throw error;
    }
  },

  /**
   * Find events by organizer
   */
  async findByOrganizer(
    organizerId: string,
    options?: PaginationOptions
  ): Promise<Event[]> {
    const client = getD1Client();

    try {
      let sql =
        "SELECT * FROM events WHERE organizer_id = ? ORDER BY created_at DESC";
      const params: any[] = [organizerId];

      if (options) {
        const { page, limit } = options;
        const offset = (page - 1) * limit;
        sql += " LIMIT ? OFFSET ?";
        params.push(limit, offset);
      }

      const result = await client.query(sql, params);
      return (result.results || []).map(mapEventRow);
    } catch (error) {
      logger.error("Failed to find events by organizer", {
        error,
        organizerId,
      });
      throw error;
    }
  },

  /**
   * Find all events with filters and pagination
   */
  async findAll(
    filters: EventFilters,
    pagination: PaginationOptions
  ): Promise<{ events: Event[]; total: number }> {
    const client = getD1Client();

    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;
      const conditions: string[] = [];
      const params: any[] = [];

      // Date filters based on status
      if (filters.status) {
        const now = new Date().toISOString();

        if (filters.status === "upcoming") {
          conditions.push("start_date > ?");
          params.push(now);
        } else if (filters.status === "ongoing") {
          conditions.push("start_date <= ? AND end_date >= ?");
          params.push(now, now);
        } else if (filters.status === "completed") {
          conditions.push("end_date < ?");
          params.push(now);
        }
      }

      // Search filter (title or description)
      if (filters.search) {
        conditions.push("(title LIKE ? OR description LIKE ?)");
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm);
      }

      // Category filter
      if (filters.category) {
        conditions.push("category = ?");
        params.push(filters.category);
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      // Get total count
      const countSql = `SELECT COUNT(*) as count FROM events ${whereClause}`;
      const countResult = await client.query(countSql, params);
      const total = countResult.results[0].count;

      // Get paginated results
      const eventsSql = `SELECT * FROM events ${whereClause} ORDER BY start_date LIMIT ? OFFSET ?`;
      const eventsResult = await client.query(eventsSql, [
        ...params,
        limit,
        offset,
      ]);

      return {
        events: (eventsResult.results || []).map(mapEventRow),
        total: total || 0,
      };
    } catch (error) {
      logger.error("Failed to find all events", { error, filters });
      throw error;
    }
  },

  /**
   * Count events by organizer
   */
  async countByOrganizer(organizerId: string): Promise<number> {
    const client = getD1Client();

    try {
      const result = await client.query(
        "SELECT COUNT(*) as count FROM events WHERE organizer_id = ?",
        [organizerId]
      );

      return result.results[0].count || 0;
    } catch (error) {
      logger.error("Failed to count events by organizer", {
        error,
        organizerId,
      });
      throw error;
    }
  },

  /**
   * Get statistics grouped by user
   */
  async getStatsGroupedByUser(): Promise<UserStats[]> {
    const client = getD1Client();

    try {
      const sql = `
        SELECT 
          organizer_id as userId,
          COUNT(id) as organized_events,
          COALESCE(SUM(max_attendees), 0) as total_attendees
        FROM events
        GROUP BY organizer_id
      `;

      const result = await client.query(sql, []);

      return (result.results || []).map((r: any) => ({
        userId: r.userId,
        organized_events: r.organized_events,
        attended_events: 0, // Placeholder - not tracking attendance yet
        total_attendees: r.total_attendees,
      }));
    } catch (error) {
      logger.error("Failed to get stats grouped by user", { error });
      throw error;
    }
  },

  /**
   * Update an event
   */
  async update(id: string, data: Partial<NewEvent>): Promise<Event> {
    const client = getD1Client();

    try {
      // Build dynamic UPDATE query based on provided fields
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

      const sql = `UPDATE events SET ${fields.join(
        ", "
      )} WHERE id = ? RETURNING *`;
      const result = await client.query(sql, params);

      if (!result.results || result.results.length === 0) {
        throw new Error("Event not found");
      }

      logger.info("Event updated", { id });
      return mapEventRow(result.results[0]);
    } catch (error) {
      logger.error("Failed to update event", { error, id });
      throw error;
    }
  },

  /**
   * Delete an event
   */
  async delete(id: string): Promise<void> {
    const client = getD1Client();

    try {
      await client.query("DELETE FROM events WHERE id = ?", [id]);
      logger.info("Event deleted", { id });
    } catch (error) {
      logger.error("Failed to delete event", { error, id });
      throw error;
    }
  },

  /**
   * Increment current attendees count
   */
  async incrementAttendees(id: string): Promise<void> {
    const client = getD1Client();
    try {
      await client.query(
        "UPDATE events SET current_attendees = current_attendees + 1 WHERE id = ?",
        [id]
      );
    } catch (error) {
      logger.error("Failed to increment attendees", { error, id });
      throw error;
    }
  },
};
