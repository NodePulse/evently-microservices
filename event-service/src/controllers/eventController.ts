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

export const getEventsGroupedByUser = async (req: Request, res: Response) => {
  const requestId = uuidv4();

  const result = await eventService.getEventsGroupedByUser(
    requestId,
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

  // Handle file uploads
  if (req.files) {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (files.image && files.image[0]) {
      const key = (files.image[0] as any).key;
      req.body.imageUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    }

    if (files.video && files.video[0]) {
      const key = (files.video[0] as any).key;
      req.body.videoUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    }
  }

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

export const uploadImage = async (req: Request, res: Response) => {
  const requestId = uuidv4();

  if (!req.file) {
    return res.status(400).json({
      success: false,
      status: { code: 400, description: "Bad Request" },
      message: "No image file provided",
      requestContext: { path: req.path, method: req.method },
    });
  }

  // The file is already uploaded to R2 by the multer middleware
  // req.file.location contains the public URL of the uploaded file
  const fileUrl = (req.file as any).location;

  res.status(200).json({
    success: true,
    status: { code: 200, description: "OK" },
    message: "Image uploaded successfully",
    data: {
      imageUrl: fileUrl,
    },
    meta: { apiVersion: "v1" },
    requestContext: { path: req.path, method: req.method },
  });
};

export const joinEvent = async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const { id } = req.params;
  const { name } = req.body;

  const result = await eventService.joinEvent(
    requestId,
    { id, name },
    req.headers as any
  );

  res.status(result.status || 500).json(result);
};

export const getRegistrationByUserAndEvent = async (
  req: Request,
  res: Response
) => {
  const requestId = uuidv4();
  const { id } = req.params;

  const result = await eventService.getRegistrationByUserAndEvent(
    requestId,
    { id },
    req.headers as any
  );

  res.status(result.status || 500).json(result);
};

export const getEventAttendees = async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const { id } = req.params;
  const { search, page, limit } = req.query;

  const result = await eventService.getEventAttendees(
    requestId,
    { id, search, page, limit },
    req.headers as any
  );

  res.status(result.status || 500).json(result);
};
