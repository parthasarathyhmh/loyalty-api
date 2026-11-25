import { Injectable, OnModuleInit } from '@nestjs/common';
import { QueueClient, QueueServiceClient } from '@azure/storage-queue';
export enum MessageQueue {
  Invoice = 'invoice',
}

@Injectable()
export class QueueService implements OnModuleInit {
  private queueServiceClient: QueueServiceClient;

  async onModuleInit() {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!connectionString) {
      throw new Error('Azure Storage connection string is missing');
    }

    this.queueServiceClient =
      QueueServiceClient.fromConnectionString(connectionString);
    console.log('Azure Queue Service initialized');
  }

  getQueueClient(queueName: string): QueueClient {
    if (!queueName) {
      throw new Error('Queue name is required');
    }

    return this.queueServiceClient.getQueueClient(queueName);
  }

  async createQueue(queueName: string): Promise<void> {
    const queueClient = this.getQueueClient(queueName);
    await queueClient.createIfNotExists();
    console.log(`Queue "${queueName}" is ready`);
  }

  async addMessage(queueName: string, message: object): Promise<void> {
    await this.createQueue(queueName);
    const queueClient = this.getQueueClient(queueName);
    await queueClient.sendMessage(JSON.stringify(message));
    console.log(`Message added to queue "${queueName}":`, message);
  }

  async processMessages<T>(
    queueName: string,
    handler: (message: T) => Promise<void>,
  ): Promise<void> {
    const queueClient = this.getQueueClient(queueName);
    const response = await queueClient.receiveMessages();

    for (const message of response.receivedMessageItems) {
      const decodedMessage: T = JSON.parse(
        Buffer.from(message.messageText, 'base64').toString('utf-8'),
      );
      try {
        await handler(decodedMessage);
        console.log(
          `Processed message from queue "${queueName}":`,
          decodedMessage,
        );
      } catch (error) {
        console.error(
          `Failed to process message from queue "${queueName}":`,
          error.message,
        );
      } finally {
        console.log(`Deleted message from queue : ${message}`);
        await queueClient.deleteMessage(message.messageId, message.popReceipt);
      }
    }
  }
}
