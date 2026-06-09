import { auth } from "./index";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const getSession = async () => {
  return await auth.api.getSession({
    headers: await headers(),
  });
};

export const requireAuth = async () => {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
};
