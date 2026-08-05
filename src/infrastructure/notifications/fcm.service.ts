import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private initialized = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const projectId   = this.configService.get<string>('firebase.projectId');
    const clientEmail = this.configService.get<string>('firebase.clientEmail');
    const privateKey  = this.configService.get<string>('firebase.privateKey');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn(
        'Firebase credentials not configured — push notifications disabled. ' +
        'Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY to enable.',
      );
      return;
    }

    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        });
      }
      this.initialized = true;
      this.logger.log('Firebase Admin initialized');
    } catch (err) {
      this.logger.error('Firebase Admin initialization failed — push notifications disabled', err);
    }
  }

  async sendToDevice(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
    imageUrl?: string,
  ): Promise<boolean> {
    if (!this.initialized) return false;
    try {
      await admin.messaging().send({
        token:        fcmToken,
        notification: { title, body, imageUrl },
        data,
        android: { priority: 'high', notification: { channelId: 'newsly_default', sound: 'default' } },
        apns:    { payload: { aps: { sound: 'default', badge: 1 } } },
      });
      return true;
    } catch (error) {
      this.logger.error(`FCM send failed for token ${fcmToken}`, error);
      return false;
    }
  }

  async sendToMultipleDevices(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
    imageUrl?: string,
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!this.initialized || !tokens.length) return { successCount: 0, failureCount: 0 };

    const batchSize = 500;
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch    = tokens.slice(i, i + batchSize);
      const response = await admin.messaging().sendEachForMulticast({
        tokens: batch, notification: { title, body, imageUrl }, data,
        android: { priority: 'high' },
        apns:    { payload: { aps: { sound: 'default' } } },
      });
      successCount += response.successCount;
      failureCount += response.failureCount;
    }

    return { successCount, failureCount };
  }

  async sendToTopic(topic: string, title: string, body: string, data?: Record<string, string>): Promise<boolean> {
    if (!this.initialized) return false;
    try {
      await admin.messaging().send({ topic, notification: { title, body }, data });
      return true;
    } catch (error) {
      this.logger.error(`FCM topic send failed for topic ${topic}`, error);
      return false;
    }
  }

  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.initialized) return;
    await admin.messaging().subscribeToTopic(tokens, topic);
  }

  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.initialized) return;
    await admin.messaging().unsubscribeFromTopic(tokens, topic);
  }
}
