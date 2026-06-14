import "dotenv/config";
import { createClient } from "@corsair-dev/app";

export const corsair = createClient({
  apiKey: process.env.CORSAIR_DEV_KEY!,
});

export const instance = corsair.instance(process.env.CORSAIR_INSTANCE_ID!);