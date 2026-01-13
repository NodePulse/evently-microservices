import { v4 as uuidv4 } from "uuid";
import { Request, Response } from "express";
import * as ticketService from "../services/ticket.service";

export const getAllTickets = async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const { page, limit, search, status, type } = req.query;

  const result = await ticketService.getAllTickets(
    requestId,
    { page, limit, search, status, type },
    req.headers as any
  );

  if (!result) {
    return res.status(404).json({
      status: 404,
      message: "Tickets not found",
      data: null,
    });
  }

  res.status(result.status || 500).json(result);
};
