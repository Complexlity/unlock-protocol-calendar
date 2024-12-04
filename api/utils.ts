import { Address, createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { hookAbi, PublicLockAbi, unlockAbi } from "./abi.js";
import { DAYS_CONTRACT_ADDRESSES } from "./constants.js";

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
