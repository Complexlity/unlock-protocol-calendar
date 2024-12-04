import { Address, createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { unlockAbi } from "./abi.js";
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
