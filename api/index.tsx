import { Button, Frog, TextInput } from "frog";
import { devtools } from "frog/dev";
// import { neynar } from 'frog/hubs'
import { handle } from "frog/next";
import { serveStatic } from "frog/serve-static";
import {
  getCurrentDateUTC,
  getDayImage,
  getUserNftBalance,
  getValidKeysForUser,
} from "./utils.js";
import { DAYS_CONTRACT_ADDRESSES } from "./constants.js";
import uniFarcasterSdk from "../node_modules/uni-farcaster-sdk/dist/index.mjs";
import { Address } from "viem";
import { unlockAbi } from "./abi.js";
import { base } from "viem/chains";

// Uncomment to use Edge Runtime.
// export const config = {
//   runtime: 'edge',
// }

const sdkInstance = new uniFarcasterSdk({
  neynarApiKey: "NEYNAR_FROG_FM",
});

export const app = new Frog({
  assetsPath: "/",
  basePath: "/api",
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
  title: "Frog Frame",
});

app.frame("/", (c) => {
  return c.res({
    image: (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(to right, #432889, #17101F)",
          backgroundSize: "100% 100%",
          display: "flex",
          flexDirection: "column",
          flexWrap: "nowrap",
          height: "100%",
          justifyContent: "center",
          textAlign: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: 60,
            fontStyle: "normal",
            letterSpacing: "-0.025em",
            lineHeight: 1.4,
            marginTop: 30,
            padding: "0 120px",
            whiteSpace: "pre-wrap",
          }}
        >
          Welcome to Unlock Protocol Calendar
        </div>
      </div>
    ),
    intents: [
      // <Button action="/mint">Mint Today</Button>,
      <Button action="/calendar">Start</Button>,
    ],
  });
});

app.frame("/calendar", async (c) => {
  const frameData = c.frameData;
  if (!frameData) {
    return c.error({
      message: "Frame data missing",
    });
  }
  const userFid = frameData.fid;
  const res = await sdkInstance.getUsersByFid([userFid]);
  if (res.error) {
    return c.error({
      message: "Something went wrong getting your user data",
    });
  }
  const userAddress = res.data[0].ethAddresses[0] as Address;
  // const userAddress = "0x8ff47879d9eE072b593604b8b3009577Ff7d6809" as Address;
  // const userAddress = "0xe06Dacf8a98CBbd9692A17fcb8e917a6cb5e65ED" as Address;
  const today = getCurrentDateUTC();
  const validKeys = await getValidKeysForUser(userAddress, today);
  console.log({ validKeys });
  let nextMintableDay = -1;
  for (let i = 0; i < today; i++) {
    const hasMembership = validKeys[i];
    const hasPreviousMembership = i === 0 ? true : validKeys[i - 1];
    if (!hasMembership && hasPreviousMembership) {
      nextMintableDay = i;
    }
  }

  const imageUrl = getDayImage(nextMintableDay == -1 ? 1 : nextMintableDay + 1);
  return c.res({
    action: `/finish/${nextMintableDay}`,
    image: imageUrl,
    // image: (
    //   <div
    //     style={{
    //       alignItems: "center",
    //       background: "linear-gradient(to right, #432889, #17101F)",
    //       backgroundSize: "100% 100%",
    //       display: "flex",
    //       flexDirection: "column",
    //       flexWrap: "nowrap",
    //       height: "100%",
    //       justifyContent: "center",
    //       textAlign: "center",
    //       width: "100%",
    //     }}
    //   >
    //     <div
    //       style={{
    //         color: "white",
    //         fontSize: 60,
    //         fontStyle: "normal",
    //         letterSpacing: "-0.025em",
    //         lineHeight: 1.4,
    //         marginTop: 30,
    //         padding: "0 120px",
    //         whiteSpace: "pre-wrap",
    //       }}
    //     >
    //       Here are the mint dates
    //     </div>
    //   </div>
    // ),
    intents: [
      <Button.Transaction target={`/tx/${nextMintableDay}/${userAddress}`}>
        Mint Day {`${Number(nextMintableDay) + 1}`}
      </Button.Transaction>,
    ],
  });
});

app.frame("/finish/:day", async (c) => {
  const day = c.req.param("day");
  return c.res({
    image: (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(to right, #432889, #17101F)",
          backgroundSize: "100% 100%",
          display: "flex",
          flexDirection: "column",
          flexWrap: "nowrap",
          height: "100%",
          justifyContent: "center",
          textAlign: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: 60,
            fontStyle: "normal",
            letterSpacing: "-0.025em",
            lineHeight: 1.4,
            marginTop: 30,
            padding: "0 120px",
            whiteSpace: "pre-wrap",
            display: "flex",
          }}
        >
          You successfully minted day {`${Number(day) + 1}`}
        </div>
      </div>
    ),
    intents: [<Button action="/calendar">View Calendar</Button>],
  });
});
// app.frame("/mint", async (c) => {
//   const frameData = c.frameData;
//   if (!frameData) {
//     return c.error({ message: "Frame data missing from request" });
//   }
//   const fid = frameData.fid;
//   // const res = await sdkInstance.getUsersByFid([fid]);
//   // if (res.error) {
//   //   console.log(res.error);
//   //   return c.error({ message: "Could` not get user address" });
//   // }
//   // const userAddress = res.data[0].ethAddresses[0] as Address;
//   const userAddress = "0x8ff47879d9eE072b593604b8b3009577Ff7d6809" as Address;
//   const currentDay = getCurrentDateUTC();
//   console.log({ currentDay });
//   const currentDayContract = DAYS_CONTRACT_ADDRESSES[currentDay - 1];
//   console.log({ currentDayContract });
//   const userBalance = await getUserNftBalance(
//     userAddress,
//     currentDayContract
//   ).catch((e) => null);
//   if (userBalance === null) {
//     return c.error({
//       message: "Something went wrong getting balance",
//     });
//   }

//   if (Number(userBalance) == 1) {
//     return c.error({
//       message: "You already minted today's NFT",
//     });
//   }

//   return c.res({
//     image: "https://i.ibb.co/xfnR1cL/frame.png",
//     intents: [
//       <Button.Transaction target={`/tx/${currentDay}/${userAddress}`}>
//         Mint Today
//       </Button.Transaction>,
//     ],
//   });
// });

app.transaction("/tx/:day/:address", async (c) => {
  const { day, address } = c.req.param();
  const userAddress = address as Address;
  const nextMintableDay = Number(day);
  if (isNaN(nextMintableDay)) {
    return c.error({ message: "Invalid day" });
  }
  console.log({ currentDay: nextMintableDay });
  const currentDayContract = DAYS_CONTRACT_ADDRESSES[nextMintableDay];
  console.log({ currentDayContract });
  const userBalance = await getUserNftBalance(
    userAddress,
    currentDayContract
  ).catch((e) => null);
  if (userBalance === null) {
    return c.error({
      message: "You already minted today's NFT",
    });
  }

  if (Number(userBalance) == 1) {
    return c.error({
      message: "You already minted today's NFT",
    });
  }

  const referrerAddress =
    "0x8ff47879d9eE072b593604b8b3009577Ff7d6809" as Address;
  return c.contract({
    abi: unlockAbi,
    functionName: "purchase",
    args: [[0n], [userAddress], [referrerAddress], [userAddress], ["0x0"]],
    to: currentDayContract,
    chainId: `eip155:${base.id}`,
    value: 0n,
  });
});

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== "undefined";
const isProduction = isEdgeFunction || import.meta.env?.MODE !== "development";
devtools(app, isProduction ? { assetsPath: "/.frog" } : { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
