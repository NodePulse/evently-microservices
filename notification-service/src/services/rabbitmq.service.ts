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

  async publish(queue: string, message: any): Promise<boolean> {
    if (!this.channel) {
      logger.error('❌ Cannot publish: RabbitMQ channel not initialized');
      return false;
    }

    try {
      await this.channel.assertQueue(queue, { durable: true });
      const sent = this.channel.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(message)),
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
    callback: (message: any) => void,
  ): Promise<void> {
    if (!this.channel) {
      logger.error('❌ Cannot consume: RabbitMQ channel not initialized');
      return;
    }

    try {
      await this.channel.assertQueue(queue, { durable: true });
      this.channel.consume(queue, (msg: any) => {
        if (msg !== null) {
          const message = JSON.parse(msg.content.toString());
          // logger.info('Message consumed from queue', { queue });
          callback(message);
          this.channel.ack(msg);
        }
      });
    } catch (error) {
      logger.error(`❌ Error consuming from queue '${queue}'`, error);
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
