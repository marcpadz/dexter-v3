"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
}

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}
