import { Redis } from "@upstash/redis";

const url =
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.KV_REST_API_URL;

const token =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.KV_REST_API_TOKEN;

if (!url || !token) {
  throw new Error(
    "FESTO: Redis environment variables are not configured."
  );
}

export const redis = new Redis({
  url,
  token,
});

export const DATA_KEY = "festo:data";

export async function getData() {
  const data = await redis.get(DATA_KEY);

  if (!data) {
    return {
      restaurants: [],
      categories: [],
      dishes: [],
      tables: [],
      orders: [],
    };
  }

  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return {
        restaurants: [],
        categories: [],
        dishes: [],
        tables: [],
        orders: [],
      };
    }
  }

  return data;
}

export async function saveData(data) {
  await redis.set(DATA_KEY, JSON.stringify(data));
}