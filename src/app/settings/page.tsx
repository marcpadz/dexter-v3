import { getUserSettings } from "@/lib/server/actions/settings";
import SettingsPage from "./settings-view";
import { redirect } from "next/navigation";

export default async function SettingsRoute() {
  const user = await getUserSettings();
  if (!user) redirect("/login");
  return <SettingsPage user={user} />;
}
