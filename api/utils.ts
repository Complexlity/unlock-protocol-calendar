import { Address, createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { hookAbi, PublicLockAbi, unlockAbi } from "./abi.js";
import config from "./config.js";
import {
  DAYS_CONTRACT_ADDRESSES,
  MAIN_SITE_URL,
  UNLOCK_REDIS_KEY,
} from "./constants.js";
import { kvStore } from "./services.js";

export function getCurrentDateUTC() {
  return new Date().getUTCDate();
}

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

export function getUserNftBalance(
  userAddress: Address,
  dayContractAddress: Address
) {
  return publicClient.readContract({
    abi: unlockAbi,
    functionName: "balanceOf",
    args: [userAddress],
    address: dayContractAddress,
  });
}

export const getValidKeysForUser = async (
  userAddress: Address,
  currentDay: number
) => {
  const validKeysContracts = DAYS_CONTRACT_ADDRESSES.slice(0, currentDay).map(
    (lockAddress) => ({
      address: lockAddress,
      abi: PublicLockAbi,
      functionName: "getHasValidKey",
      args: [userAddress],
    })
  );

  try {
    const results = await publicClient.multicall({
      //@ts-expect-error: ts not sure if validKeysContracts fits the contracts type
      contracts: validKeysContracts,
    });

    return results.map((result) =>
      result.status === "success" ? (result.result as boolean) : false
    );
  } catch (error) {
    console.error("Multicall error:", error);
    return new Array(DAYS_CONTRACT_ADDRESSES.length).fill(false);
  }
};

export const getLockAddresses = async (hookContractAddress: Address) => {
  const days = Array.from({ length: 24 }, (_, i) => i + 1);

  const lockAddresses: Address[] = [];

  for (const day of days) {
    try {
      const lockAddress = await publicClient.readContract({
        address: hookContractAddress,
        abi: hookAbi,
        functionName: "lockByDay",
        args: [day],
      });

      lockAddresses.push(lockAddress as Address);
    } catch (error) {
      console.error(`Error fetching lock for day ${day}:`, error);
    }
  }

  return lockAddresses;
};

export function getDayImage(day: number) {
  return `${MAIN_SITE_URL}/images/nft/${day}.png`;
}

export async function generateIdempotencyKey(input: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);

  return crypto.subtle.digest("SHA-256", data).then((buffer) => {
    const hashArray = Array.from(new Uint8Array(buffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex.substring(0, 16);
  });
}

export async function sentDcToUser(fid: number, message: string) {
  const idempotencyKey = await generateIdempotencyKey(message);
  try {
    await fetch("https://api.warpcast.com/v2/ext-send-direct-cast", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${config.DC_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipientFid: fid,
        message: message,
        idempotencyKey,
      }),
    });
  } catch (error) {
    console.error("Error sending direct cast:", error);
    throw error;
  }
}

export async function registerUserForNotifications(fid: number) {
  await kvStore.sadd(UNLOCK_REDIS_KEY, fid);
}
