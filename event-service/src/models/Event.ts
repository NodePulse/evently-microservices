import mongoose, { Schema, Document } from "mongoose";

export interface IEvent extends Document {
  title: string;
  description: string;
  body: string;
  location: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  price: number;
  currency: string;
  category: string;
  eventType: "OFFLINE" | "ONLINE" | "HYBRID";
  organizerId: string;
  maxAttendees?: number;
  currentAttendees: number;
  tags?: string;
  eventUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  requirements?: string;
  refundPolicy?: string;
  ageRestriction?: number;
  registrationDeadline?: Date;
  allowWaitlist: boolean;
  sendReminders: boolean;
  allowGuestRegistration: boolean;
  isPublished: boolean;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, minlength: 5, maxlength: 100 },
    description: {
      type: String,
      required: true,
      minlength: 20,
      maxlength: 500,
    },
    body: { type: String, required: true, minlength: 50 },
    location: { type: String, required: true, minlength: 3, maxlength: 200 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    currency: {
      type: String,
      required: true,
      enum: [
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
      ],
    },
    category: {
      type: String,
      required: true,
      enum: [
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
      ],
    },
    eventType: {
      type: String,
      required: true,
      enum: ["OFFLINE", "ONLINE", "HYBRID"],
    },
    organizerId: { type: String, required: true, index: true },
    maxAttendees: { type: Number, min: 1 },
    currentAttendees: { type: Number, default: 0 },
    tags: { type: String, maxlength: 200 },
    eventUrl: { type: String },
    contactEmail: { type: String },
    contactPhone: { type: String },
    requirements: { type: String, maxlength: 500 },
    refundPolicy: { type: String, maxlength: 500 },
    ageRestriction: { type: Number, min: 0, max: 99 },
    registrationDeadline: { type: Date },
    allowWaitlist: { type: Boolean, default: false },
    sendReminders: { type: Boolean, default: true },
    allowGuestRegistration: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    imageUrl: { type: String },
    videoUrl: { type: String },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
EventSchema.index({ organizerId: 1, createdAt: -1 });
EventSchema.index({ startDate: 1 });
EventSchema.index({ category: 1 });
EventSchema.index({ title: "text", description: "text" });

export const Event = mongoose.model<IEvent>("Event", EventSchema);
