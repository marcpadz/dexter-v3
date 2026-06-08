import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/session";

export default async function LandingPage() {
  const { userId } = await auth();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
            D
          </div>
          <span className="text-xl font-semibold tracking-tight">Dexter</span>
        </div>
        <div className="flex items-center gap-3">
          {userId ? (
            <Button asChild>
              <Link href="/chat">Open App</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          One prompt. Every model.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
          Dexter is the open-source interface for AI chat. Multi-model, BYOK-ready,
          and fully self-hostable. Use Claude, OpenAI, Gemini, local models, and more,
          all in one place.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" asChild className="rounded-full px-8">
            <Link href={userId ? "/chat" : "/sign-up"}>Start chatting</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="rounded-full px-8">
            <Link href="https://github.com" target="_blank">View on GitHub</Link>
          </Button>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-6 opacity-60">
          {["OpenAI", "Claude", "Gemini", "Mistral", "Groq", "xAI", "DeepSeek", "OpenRouter"].map((p) => (
            <span key={p} className="text-sm font-medium text-muted-foreground">
              {p}
            </span>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/30 px-6 py-20">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-3">
          {[
            {
              title: "Multi-model",
              desc: "Compare the best models without the tab shuffle. Route one prompt across providers.",
            },
            {
              title: "Artifacts",
              desc: "Turn useful answers into working surfaces. Code, notes, and files live beside the chat.",
            },
            {
              title: "Follow-through",
              desc: "Connect answers to actions. Notes, tasks, and files when the work calls for it.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-6">
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
