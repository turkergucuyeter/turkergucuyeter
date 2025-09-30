import prisma from './prisma.js';
import env from '../config/env.js';

type FlagKey =
  | 'only_unexcused_counts'
  | 'grace_period_minutes'
  | 'student_email_notifications'
  | 'web_push_enabled';

class FeatureFlagService {
  private cache = new Map<string, { value: unknown; expiresAt: number }>();
  private ttlMs: number;

  constructor(ttlMinutes = 5) {
    const ttlFromEnv = env.FEATURE_FLAGS_CACHE_TTL ? Number(env.FEATURE_FLAGS_CACHE_TTL) : ttlMinutes;
    this.ttlMs = ttlFromEnv * 60 * 1000;
  }

  private getCache(key: FlagKey) {
    const item = this.cache.get(key);
    if (!item) return undefined;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    return item.value;
  }

  private setCache(key: FlagKey, value: unknown) {
    this.cache.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  async getFlag<T>(key: FlagKey, defaultValue: T): Promise<T> {
    const cached = this.getCache(key) as T | undefined;
    if (cached !== undefined) {
      return cached;
    }

    const flag = await prisma.featureFlag.findUnique({ where: { key } });
    if (!flag) {
      this.setCache(key, defaultValue);
      return defaultValue;
    }

    const value = JSON.parse(flag.valueJson) as T;
    this.setCache(key, value);
    return value;
  }

  async isOnlyUnexcusedCounted() {
    return this.getFlag<boolean>('only_unexcused_counts', false);
  }

  async getGracePeriod() {
    return this.getFlag<number>('grace_period_minutes', 0);
  }

  async isStudentEmailEnabled() {
    return this.getFlag<boolean>('student_email_notifications', false);
  }

  async isWebPushEnabled() {
    return this.getFlag<boolean>('web_push_enabled', false);
  }
}

const featureFlagService = new FeatureFlagService();

export default featureFlagService;
