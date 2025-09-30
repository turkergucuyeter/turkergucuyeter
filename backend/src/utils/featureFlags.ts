import { prisma } from "../config/prisma";

const cache = new Map<string, any>();

export const getFeatureFlag = async <T>(key: string, defaultValue: T): Promise<T> => {
  if (cache.has(key)) {
    return cache.get(key) as T;
  }
  const flag = await prisma.featureFlag.findUnique({ where: { key } });
  if (!flag) {
    return defaultValue;
  }
  const parsed = (flag.valueJson as unknown as T) ?? defaultValue;
  cache.set(key, parsed);
  return parsed;
};

export const setFeatureFlag = async <T>(key: string, value: T) => {
  const result = await prisma.featureFlag.upsert({
    where: { key },
    update: { valueJson: value as any },
    create: { key, valueJson: value as any },
  });
  cache.set(key, value);
  return result;
};
