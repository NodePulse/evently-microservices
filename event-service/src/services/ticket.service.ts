import { eventRepository } from "../repositories/event.repository";
import { ticketRepository } from "../repositories/ticket.repository";

export const getAllTickets = async (
  requestId: string,
  data: any,
  headers?: Record<string, any>
) => {
  try {
    const userId = headers?.["x-user-id"];
    const { page, limit, search, status, type } = data;
    const tickets = await ticketRepository.findByUserIdWithEventDetails(
      userId,
      page,
      limit,
      search,
      status,
      type
    );
    // Repository now returns [] if no tickets found, which is valid.
    return {
      status: 200,
      message: "Tickets found",
      data: tickets,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
};
