"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function signUp(email: string, password: string, name: string) {
  // using better-auth api directly for sign up server side
  try {
    const res = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
      headers: await headers(),
    });
    return { success: true, user: res };
  } catch (e: any) {
    return { error: e.message || "Failed to sign up" };
  }
}

export async function signIn(email: string, password: string) {
  try {
    const res = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
      headers: await headers(),
    });
    return { success: true, session: res };
  } catch (e: any) {
    return { error: e.message || "Failed to sign in" };
  }
}

export async function signOut() {
  try {
    await auth.api.signOut({
      headers: await headers(),
    });
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Failed to sign out" };
  }
}
