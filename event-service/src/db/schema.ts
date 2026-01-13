import {
  sqliteTable,
  text,
  integer,
  real,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const events = sqliteTable("events", {
  id: text("id").primaryKey(),

  // Basic Info
  title: text("title").notNull(),
  description: text("description").notNull(),
  body: text("body").notNull(),
  location: text("location").notNull(),

  // Date & Time (stored as ISO 8601 TEXT)
  start_date: text("start_date").notNull(),
  end_date: text("end_date").notNull(),
  start_time: text("start_time").notNull(),
  end_time: text("end_time").notNull(),

  // Pricing
  price: real("price").notNull(),
  currency: text("currency").notNull(),

  // Categorization
  category: text("category").notNull(),
  event_type: text("event_type").notNull(),

  // Organization
  organizer_id: text("organizer_id").notNull(),

  // Capacity
  max_attendees: integer("max_attendees"),
  current_attendees: integer("current_attendees").notNull().default(0),

  // Optional Fields
  tags: text("tags"),
  event_url: text("event_url"),
  contact_email: text("contact_email"),
  contact_phone: text("contact_phone"),
  requirements: text("requirements"),
  refund_policy: text("refund_policy"),
  age_restriction: integer("age_restriction"),
  registration_deadline: text("registration_deadline"),

  // Settings (SQLite doesn't have boolean, use integer: 0=false, 1=true)
  allow_waitlist: integer("allow_waitlist", { mode: "boolean" })
    .notNull()
    .default(false),
  send_reminders: integer("send_reminders", { mode: "boolean" })
    .notNull()
    .default(true),
  allow_guest_registration: integer("allow_guest_registration", {
    mode: "boolean",
  })
    .notNull()
    .default(false),
  is_published: integer("is_published", { mode: "boolean" })
    .notNull()
    .default(true),

  // Media
  image_url: text("image_url"),
  video_url: text("video_url"),

  // Timestamps
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updated_at: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// TypeScript Types
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

export const eventRegistrations = sqliteTable(
  "event_registrations",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id),
    userId: text("user_id").notNull(),
    registeredAt: text("registered_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    status: text("status", { enum: ["confirmed", "cancelled", "waitlist"] })
      .notNull()
      .default("confirmed"),
  },
  (table) => ({
    userEventIdx: uniqueIndex("user_event_idx").on(table.userId, table.eventId),
  })
);

export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type NewEventRegistration = typeof eventRegistrations.$inferInsert;

export const tickets = sqliteTable("tickets", {
  id: text("id").primaryKey(),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id),
  userId: text("user_id").notNull(),
  registrationId: text("registration_id")
    .notNull()
    .references(() => eventRegistrations.id),
  ticketCode: text("ticket_code").notNull().unique(),
  ticketImageUrl: text("ticket_image_url"),
  status: text("status", { enum: ["valid", "used", "cancelled"] })
    .notNull()
    .default("valid"),

  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  username: text("username").notNull(),
  name: text("name").notNull(),
  gender: text("gender").notNull(),
  image: text("image"),
  role: text("role").notNull().default("USER"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
