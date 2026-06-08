import { nextAuth } from "./auth";

export async function auth() {
  const session = await nextAuth();
  return {
    userId: session?.user?.id ?? null,
    user: session?.user ?? null,
    session,
  };
}
