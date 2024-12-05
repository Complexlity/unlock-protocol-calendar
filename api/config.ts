import dotenv from "dotenv";
import z from "zod";

dotenv.config();

const configSchema = z.object({
  REDIS_URL: z.string(),
  REDIS_TOKEN: z.string(),
  DC_API_KEY: z.string(),
  QSTASH_CURRENT_SIGNING_KEY: z.string(),
  QSTASH_NEXT_SIGNING_KEY: z.string(),
  PROD_URL: z.string().default("https://unlock-protocol-calendar.vercel.app"),
});

const config = configSchema.parse(process.env);

export default config;
