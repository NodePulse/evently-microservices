export const eventPublisher = {
  publishUserCreated: async (data: any) => {
    console.log('Event published: UserCreated', data);
    // Placeholder for actual event publishing logic (e.g., RabbitMQ, Kafka)
  },
};
