import prisma from '../prisma';
import { rabbitMQService } from '../services/rabbitmq.service';

export const startEventWorker = {
  async eventCreationWorker() {
    rabbitMQService.consume('event-creation', async (msg) => {
      const { eventType, eventId, userId } = msg;
      console.log(eventType, eventId, userId);
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          total_events: {
            increment: 1,
          },
        },
      });
    });
  },
};
