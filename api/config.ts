import dotenv from "dotenv";
import z from "zod";

dotenv.config();

const configSchema = z.object({
  REDIS_URL: z.string(),
  REDIS_TOKEN: z.string(),
  DC_API_KEY: z.string(),
  QSTASH_CURRENT_SIGNING_KEY: z.string(),
  QSTASH_NEXT_SIGNING_KEY: z.string(),
});

const config = configSchema.parse(process.env);
console.log({ config });

export default config;
