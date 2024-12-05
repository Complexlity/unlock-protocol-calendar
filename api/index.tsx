import { Button, Frog } from "frog";
import { devtools } from "frog/dev";
import { neynar } from "frog/hubs";
import { handle } from "frog/next";
import { serveStatic } from "frog/serve-static";
import uniFarcasterSdk from "uni-farcaster-sdk";
import { Address } from "viem";
import { base } from "viem/chains";
import { unlockAbi } from "./abi.js";
import { DAYS_CONTRACT_ADDRESSES, UNLOCK_REDIS_KEY } from "./constants.js";
import {
  getCurrentDateUTC,
  getDayImage,
  getUserNftBalance,
  getValidKeysForUser,
  kvStore,
  sentDcToUser,
} from "./utils.js";

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
  hub: neynar({ apiKey: "NEYNAR_FROG_FM" }),
  title: "Unlock Protocol Advent Calendar",
});

app.hono.post("/send-notifications", async (c) => {
  const currentDay = getCurrentDateUTC();
  const notificationMessage = `
    Day ${currentDay} is now mintable!.

    https://https://unlock-protocol-calendar.vercel.app/api
    `;
  const userFids = await kvStore.smembers(UNLOCK_REDIS_KEY);

  for (const fid of userFids) {
    await sentDcToUser(Number(fid), notificationMessage);
  }
  await sentDcToUser(846887, notificationMessage);
});

app.frame("/", (c) => {
  return c.res({
    image: <StartImage />,
    intents: [<Button action="/calendar">Start</Button>],
  });
});

app.frame("/calendar", async (c) => {
  const frameData = c.frameData;
  const verified = c.verified;
  console.log("Checking user verification...");
  console.log({ verified });
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
  const today = getCurrentDateUTC();
  const validKeys = await getValidKeysForUser(userAddress, today);
  console.log({ validKeys, userAddress });
  let nextMintableDay = -1;
  for (let i = 0; i < today; i++) {
    const hasMembership = validKeys[i];
    const hasPreviousMembership = i === 0 ? true : validKeys[i - 1];
    if (!hasMembership && hasPreviousMembership) {
      nextMintableDay = i;
    }
  }

  const remainingDays =
    nextMintableDay == -1 || nextMintableDay == today - 1
      ? 0
      : validKeys.slice(nextMintableDay + 1).length;

  const action =
    nextMintableDay == -1 ? "/" : `/finish/${nextMintableDay}/${remainingDays}`;
  return c.res({
    action,
    image: (
      <AdventCalendarImage
        currentDay={today}
        nextMintableDay={nextMintableDay}
      />
    ),

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
      nextMintableDay === -1 ? (
        <Button.Reset>Home</Button.Reset>
      ) : (
        <Button.Transaction target={`/tx/${nextMintableDay}/${userAddress}`}>
          Mint Day {`${Number(nextMintableDay) + 1}`}
        </Button.Transaction>
      ),
    ],
  });
});

app.frame("/finish/:day/:remainingDays", async (c) => {
  const { day, remainingDays: remDays } = c.req.param();
  const remainingDays = Number(remDays);
  const verified = c.verified;
  const frameData = c.frameData;
  const mintedDay = Number(day) + 1;
  // let dcMessage = `You just minted unlock protocol advent calendar day ${mintedDay}\n`;
  // if (remainingDays === 0) {
  //   if (mintedDay === 24) {
  //     dcMessage +=
  //       "\nCongratulations! You've completed all days of the advent calendar!";
  //   }
  //   dcMessage += `\nCome back tomorrow to mint day ${mintedDay + 1}. `;
  // } else {
  //   const daysText = remainingDays === 1 ? "day" : "days";
  //   dcMessage += `\n You still have ${remainingDays} more ${daysText} to mint 🥳.`;
  // }

  // if (verified && frameData) {
  // const userFid = frameData.fid;
  // await registerUserForNotifications(userFid)
  // await sentDcToUser(userFid, dcMessage).catch((e) => console.error(e));
  // }
  const mintedImageUrl = getDayImage(mintedDay);
  return c.res({
    image: (
      <FinalImage
        mintedDay={mintedDay}
        remainingDays={Number(remainingDays)}
        mintedImageUrl={mintedImageUrl}
      />
    ),
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
    //         display: "flex",
    //       }}
    //     >
    //       You successfully minted day {`${Number(day) + 1}`}
    //     </div>
    //   </div>
    // ),
    intents: [<Button action="/calendar">View Calendar</Button>],
  });
});

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

  //complexlity.eth
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

function StartImage() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1a365d",
        color: "white",
        fontFamily: "sans-serif",
        padding: "40px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "24px",
          maxWidth: "800px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "48px",
            fontWeight: "bold",
            background: "linear-gradient(to right, #60a5fa, #a78bfa)",
            backgroundClip: "text",
            color: "transparent",
            marginBottom: "16px",
          }}
        >
          Welcome to Unlock Protocol
        </h1>
        <h2
          style={{
            fontSize: "64px",
            fontWeight: "bold",
            color: "white",
            marginTop: "0",
          }}
        >
          Advent Calendar
        </h2>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100px",
            height: "4px",
            background: "linear-gradient(to right, #60a5fa, #a78bfa)",
            borderRadius: "2px",
            margin: "24px 0",
          }}
        ></div>
      </div>

      {/* Decorative Elements */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "absolute",
          top: "40px",
          left: "40px",
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          background: "#60a5fa",
          opacity: "0.5",
        }}
      ></div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "absolute",
          bottom: "40px",
          right: "40px",
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          background: "#a78bfa",
          opacity: "0.5",
        }}
      ></div>
    </div>
  );
}

function AdventCalendarImage({
  currentDay,
  nextMintableDay,
}: {
  currentDay: number;
  nextMintableDay: number;
}) {
  const boxSize = 100;
  const gap = 24;
  function getBoxColor(day: number) {
    if (nextMintableDay == -1 && day <= currentDay) {
      return "#48bb78"; // Success (green) for all days up to currentDay
    } else if (day < nextMintableDay + 1) {
      return "#48bb78"; // Success (green)
    } else if (day >= nextMintableDay + 1 && day <= currentDay) {
      return "#ed8936"; // Current day range (orange)
    } else if (day > currentDay) {
      return "#718096"; // Default (gray)
    } else {
      return "#4299e1"; // Future day (blue)
    }
  }

  const rowStyle = {
    display: "flex",
    gap: `${gap}px`,
    width: "100%",
    justifyContent: "center",
    marginBottom: `${gap}px`,
  };

  const boxStyle = (day: number) => ({
    width: boxSize,
    height: boxSize,
    backgroundColor: getBoxColor(day),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    fontWeight: "bold",
    borderRadius: 8,
    color: "white",
  });

  const containerStyle = {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a365d",
    color: "white",
    fontFamily: "sans-serif",
  };

  const messageStyle = {
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 32,
    textAlign: "center",
    display: "flex",
    gap: "2px",
  };

  let rows: number[][] = [];
  if (nextMintableDay == -1) {
    const row1 = Array.from({ length: 8 }, (_, i) => i + 1);
    const row2 = Array.from({ length: 8 }, (_, i) => i + 9);
    const row3 = Array.from({ length: 8 }, (_, i) => i + 17);
    rows = [row1, row2, row3];
  } else {
    const row1 = Array.from({ length: 6 }, (_, i) => i + 1);
    const row2 = Array.from({ length: 6 }, (_, i) => i + 7);
    const row3 = Array.from({ length: 6 }, (_, i) => i + 13);
    const row4 = Array.from({ length: 6 }, (_, i) => i + 19);
    rows = [row1, row2, row3, row4];
  }

  return (
    <div style={containerStyle}>
      <h1 style={{ fontSize: 48, marginBottom: 20 }}>
        Your Advent Calendar 2024
      </h1>
      {rows.map((row, i) => (
        <div key={i} style={rowStyle}>
          {row.map((day) => (
            <div key={day} style={boxStyle(day)}>
              {day}
            </div>
          ))}
        </div>
      ))}
      {nextMintableDay === -1 && (
        <div style={messageStyle}>
          🎉 <span tw="text-green-600 mx-2">Congratulations!</span>
          You have minted all days. Come back tomorrow! 🎉
        </div>
      )}
    </div>
  );
}

interface FinalImageProps {
  mintedDay: number;
  remainingDays: number;
  mintedImageUrl: string;
}

function FinalImage({
  mintedDay,
  remainingDays,
  mintedImageUrl,
}: FinalImageProps) {
  const containerStyle = {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a365d",
    color: "white",
    fontFamily: "sans-serif",
    padding: "40px",
    gap: "24px",
  };

  const cardStyle = {
    backgroundColor: "#2d3748",
    borderRadius: "16px",
    padding: "32px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "24px",
    maxWidth: "600px",
    width: "100%",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  };

  const imageStyle = {
    width: "300px",
    height: "300px",
    borderRadius: "12px",
    objectFit: "cover" as const,
    backgroundColor: "#4a5568",
  };

  const titleStyle = {
    fontSize: "32px",
    fontWeight: "bold",
    textAlign: "center" as const,
    color: "#48bb78",
  };

  const messageStyle = {
    fontSize: "24px",
    textAlign: "center" as const,
    color: "#e2e8f0",
    lineHeight: 1.6,
  };

  const getMessage = () => {
    if (remainingDays === 0) {
      if (mintedDay === 24) {
        return (
          <span>
            Congratulations! You've completed all days of the advent calendar!
          </span>
        );
      }
      return <span>Come back tomorrow to mint day {mintedDay + 1}.</span>;
    }

    const daysText = remainingDays === 1 ? "day" : "days";

    return (
      <span tw="flex items-center gap-2">
        <span>You still have </span>
        <span tw="text-orange-400 font-bold text-3xl mx-2">
          {remainingDays} {daysText}
        </span>{" "}
        <span>to be minted.</span>
      </span>
    );
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Day {mintedDay} Successfully Minted! 🎉</h1>

        {mintedImageUrl && (
          <img
            src={mintedImageUrl}
            alt={`Day ${mintedDay} NFT`}
            style={imageStyle}
          />
        )}

        <p style={messageStyle}>{getMessage()}</p>
      </div>
    </div>
  );
}

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== "undefined";
const isProduction = isEdgeFunction || import.meta.env?.MODE !== "development";
devtools(app, isProduction ? { assetsPath: "/.frog" } : { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
