import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      startTime?: [number, number];
      id?: string;
    }
  }
}
