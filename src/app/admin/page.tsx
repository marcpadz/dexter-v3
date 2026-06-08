import { auth } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const { user } = await auth();
  if (user?.role !== "admin") {
    redirect("/chat");
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Admin</h1>
      <p className="text-muted-foreground">
        Admin dashboard for managing users, providers, and app configuration.
      </p>
    </div>
  );
}
