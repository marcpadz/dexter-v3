import { headers } from "next/headers";
import { auth } from "./index";

export const getSession = async () => {
  return auth.api.getSession({ headers: await headers() });
};

export const requireAuth = async () => {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
};
