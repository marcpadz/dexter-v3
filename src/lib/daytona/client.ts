import { Daytona } from "@daytonaio/sdk";

let daytonaClient: Daytona | null = null;

function log(level: string, message: string, meta?: Record<string, unknown>) {
  const prefix = "[daytona]";
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  if (level === "error") {
    console.error(`${prefix} ${message}${metaStr}`);
  } else {
    console.log(`${prefix} ${message}${metaStr}`);
  }
}

export function getDaytonaClient(): Daytona {
  if (!daytonaClient) {
    const apiKey = process.env.DAYTONA_API_KEY;
    const apiUrl = process.env.DAYTONA_API_URL;
    const target = process.env.DAYTONA_TARGET;

    if (!apiKey) {
      log("error", "DAYTONA_API_KEY is not set");
      throw new Error("DAYTONA_API_KEY is not set");
    }

    log("info", "Initializing Daytona client", {
      apiUrl: apiUrl || "default",
      target: target || "default",
    });

    daytonaClient = new Daytona({
      apiKey,
      apiUrl,
      target,
    });
  }

  return daytonaClient;
}
