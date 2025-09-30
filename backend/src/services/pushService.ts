import webpush from 'web-push';
import env from '../config/env.js';
import featureFlagService from './featureFlagService.js';
import prisma from './prisma.js';

class PushService {
  private configured = false;

  private configure() {
    if (this.configured) return;
    if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(env.VAPID_SUBJECT ?? 'mailto:admin@example.com', env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
      this.configured = true;
    }
  }

  async send(userId: number, payload: Record<string, unknown>) {
    const isEnabled = await featureFlagService.isWebPushEnabled();
    if (!isEnabled) {
      return;
    }

    this.configure();
    if (!this.configured) {
      console.warn('Web push etkin değil, VAPID anahtarları eksik');
      return;
    }

    const subscriptions = await prisma.webPushSubscription.findMany({ where: { userId } });
    const body = JSON.stringify(payload);

    await Promise.allSettled(
      subscriptions.map((subscription) =>
        webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              auth: subscription.auth,
              p256dh: subscription.p256dh
            }
          },
          body
        )
      )
    );
  }
}

const pushService = new PushService();

export default pushService;
