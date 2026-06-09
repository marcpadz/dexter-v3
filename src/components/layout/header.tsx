"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/server/actions/auth";

export default function Header() {
  const router = useRouter();

  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <div className="font-semibold cursor-pointer" onClick={() => router.push("/")}>Dexter Agent</div>
      <div className="flex items-center gap-4">
        <select className="border p-1 rounded bg-background" defaultValue="gpt-4o">
          <option value="gpt-4o">GPT-4o</option>
          <option value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet</option>
        </select>
        <button onClick={() => router.push("/settings")} className="text-sm">Settings</button>
        <button onClick={async () => {
          await signOut();
          router.push("/login");
        }} className="text-sm border px-2 py-1 rounded">Sign Out</button>
      </div>
    </header>
  );
}
