import * as amqp from 'amqplib';
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

class RabbitMQService {
  private connection: any = null;
  private channel: any = null;
  private url: string;

  constructor() {
    this.url = process.env.AMQP_URL || 'amqp://localhost';
  }

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.url);

      if (!this.connection) {
        throw new Error('Connection failed');
      }

      this.channel = await this.connection.createChannel();

      logger.info('✅ Connected to RabbitMQ');

      this.connection.on('close', () => {
        logger.error('❌ RabbitMQ connection closed');
        this.connection = null;
        this.channel = null;
      });

      this.connection.on('error', (err: any) => {
        logger.error('❌ RabbitMQ connection error', err);
      });
    } catch (error) {
      logger.error('❌ Failed to connect to RabbitMQ', error);
      throw error;
    }
  }

  async publish(queue: string, message: any, data?: any): Promise<boolean> {
    if (!this.channel) {
      logger.error('❌ Cannot publish: RabbitMQ channel not initialized');
      return false;
    }

    try {
      await this.channel.assertQueue(queue, { durable: true });

      const payload = data ? { message, ...data } : message;
      console.log(payload);

      const sent = this.channel.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(payload)),
        { persistent: true },
      );

      if (sent) {
        logger.info(`Message published to queue '${queue}'`);
      } else {
        logger.warn(`Message failed to publish to queue '${queue}'`);
      }

      return sent;
    } catch (error) {
      logger.error(`❌ Error publishing to queue '${queue}'`, error);
      return false;
    }
  }

  async consume(
    queue: string,
    callback: (msg: any) => Promise<void>,
  ): Promise<void> {
    if (!this.channel) {
      await this.connect();
    }

    try {
      await this.channel.assertQueue(queue, { durable: true });
      this.channel.consume(
        queue,
        async (msg: any) => {
          if (msg !== null) {
            try {
              const content = JSON.parse(msg.content.toString());
              await callback(content);
              this.channel.ack(msg);
            } catch (error) {
              logger.error(`Error processing message from ${queue}`, error);
            }
          }
        },
        { noAck: false },
      );
      logger.info(`Started consuming from queue '${queue}'`);
    } catch (error) {
      logger.error(`Failed to consume from queue '${queue}'`, error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      logger.info('RabbitMQ connection closed gracefully');
    }
  }
}

export const rabbitMQService = new RabbitMQService();
