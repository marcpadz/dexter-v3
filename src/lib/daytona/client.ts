import { Daytona } from "@daytonaio/sdk";

let daytonaClient: Daytona | null = null;

export function getDaytonaClient(): Daytona {
  if (!daytonaClient) {
    const apiKey = process.env.DAYTONA_API_KEY;
    const apiUrl = process.env.DAYTONA_API_URL;
    const target = process.env.DAYTONA_TARGET;

    if (!apiKey) {
      throw new Error("DAYTONA_API_KEY is not set");
    }

    daytonaClient = new Daytona({
      apiKey,
      apiUrl,
      target,
    });
  }

  return daytonaClient;
}
