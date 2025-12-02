import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import * as eventService from "../services/eventService";

export const getHealth = (req: Request, res: Response) => {
  res.json({
    status: 200,
    message: "Event Service is running",
    data: {
      service: "event-service",
      timestamp: new Date().toISOString(),
    },
  });
};

export const getEventsCount = async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const { organizerId } = req.query;

  const result = await eventService.getEventsCount(
    requestId,
    { organizerId },
    req.headers as any
  );

  res.status(result.status || 500).json(result);
};

export const getAllEvents = async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const { page, limit, search, status } = req.query;

  const result = await eventService.getAllEvents(
    requestId,
    { page, limit, search, status },
    req.headers as any
  );

  res.status(result.status || 500).json(result);
};

export const getEventById = async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const { id } = req.params;

  const result = await eventService.getEventById(
    requestId,
    { id },
    req.headers as any
  );

  res.status(result.status || 500).json(result);
};

export const createEvent = async (req: Request, res: Response) => {
  const requestId = uuidv4();

  const result = await eventService.createEvent(
    requestId,
    req.body,
    req.headers as any
  );

  console.log("createEvent result:", JSON.stringify(result, null, 2));
  res.status(result.status || 500).json(result);
};

export const getMyEvents = async (req: Request, res: Response) => {
  const requestId = uuidv4();

  const result = await eventService.getMyEvents(
    requestId,
    {},
    req.headers as any
  );

  res.status(result.status || 500).json(result);
};
