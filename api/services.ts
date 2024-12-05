import { Receiver } from "@upstash/qstash";
import { Redis } from "@upstash/redis";
import uniFarcasterSdk from "uni-farcaster-sdk";
import config from "./config.js";

export const kvStore = new Redis({
  url: config.REDIS_URL,
  token: config.REDIS_TOKEN,
});

export const qstashReceiver = new Receiver({
  currentSigningKey: config.QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: config.QSTASH_NEXT_SIGNING_KEY,
});

export const sdkInstance = new uniFarcasterSdk({
  neynarApiKey: "NEYNAR_FROG_FM",
});
