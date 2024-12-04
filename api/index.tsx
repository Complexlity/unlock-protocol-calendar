import { Button, Frog, TextInput } from "frog";
import { devtools } from "frog/dev";
// import { neynar } from 'frog/hubs'
import { handle } from "frog/next";
import { serveStatic } from "frog/serve-static";
import { getCurrentDateUTC, getUserNftBalance } from "./utils.js";
import { DAYS_CONTRACT_ADDRESSES } from "./constants.js";
import uniFarcasterSdk from "../node_modules/uni-farcaster-sdk/dist/index.mjs";
import { Address } from "viem";

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
      <Button action="/mint">Mint</Button>,
      <Button action="/calendar">Start</Button>,
    ],
  });
});

app.frame("/calendar", (c) => {
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
          Here are the mint dates
        </div>
      </div>
    ),
    intents: [<Button.Transaction target="/tx">Start</Button.Transaction>],
  });
});

app.frame("/mint", async (c) => {
  const frameData = c.frameData;
  if (!frameData) {
    return c.error({ message: "Frame data missing from request" });
  }
  const fid = frameData.fid;
  const res = await sdkInstance.getUsersByFid([fid]);
  if (res.error) {
    console.log(res.error);
    return c.error({ message: "Could` not get user address" });
  }
  const userAddress = res.data[0].ethAddresses[0] as Address;

  const currentDay = getCurrentDateUTC();
  console.log({ currentDay });
  const currentDayContract = DAYS_CONTRACT_ADDRESSES[currentDay - 2];
  console.log({ currentDayContract });
  const userBalance = await getUserNftBalance(userAddress, currentDayContract);
  console.log({ userBalance });
  return c.res({
    image: "https://i.ibb.co/xfnR1cL/frame.png",
    intents: [<Button.Reset>Home</Button.Reset>],
  });
});

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== "undefined";
const isProduction = isEdgeFunction || import.meta.env?.MODE !== "development";
devtools(app, isProduction ? { assetsPath: "/.frog" } : { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
