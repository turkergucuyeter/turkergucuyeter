import { prisma } from '../config/prisma';

export const getFlagValue = async <T>(key: string, defaultValue: T): Promise<T> => {
  const flag = await prisma.featureFlag.findUnique({ where: { key } });
  if (!flag) return defaultValue;
  try {
    return JSON.parse(flag.valueJson) as T;
  } catch (error) {
    return defaultValue;
  }
};
