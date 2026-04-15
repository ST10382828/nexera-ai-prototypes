"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AvatarHandle } from "@/components/ProceduralAvatar";
import { AVAILABLE_ANIMATIONS } from "@/lib/animation-map";

const AvatarScene = dynamic(() => import("@/components/AvatarScene"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[500px] items-center justify-center rounded-2xl border border-border bg-surface">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  ),
});

interface CommandLog {
  command: string;
  animation: string;
  target: string | null;
  explanation: string;
  timestamp: number;
}

export default function Test2Page() {
  const avatarRef = useRef<AvatarHandle>(null);
  const commandCardRef = useRef<HTMLDivElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAnimation, setCurrentAnimation] = useState("idle");
  const [explanation, setExplanation] = useState<string | null>(null);
  const [commandLog, setCommandLog] = useState<CommandLog[]>([]);

  const handleCommand = async () => {
    if (!command.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/parse-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: command.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to parse command");
      }

      const data = await res.json();

      if (avatarRef.current) {
        avatarRef.current.executeCommand({
          animation: data.animation,
          targetPosition: data.targetPosition,
          standoff: data.standoff,
        });
      }

      setCurrentAnimation(data.animation);
      setExplanation(data.explanation);
      setCommandLog((prev) => [
        {
          command: command.trim(),
          animation: data.animation,
          target: data.target,
          explanation: data.explanation,
          timestamp: Date.now(),
        },
        ...prev.slice(0, 9),
      ]);
      setCommand("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (animName: string) => {
    if (avatarRef.current) {
      avatarRef.current.playAnimation(animName);
    }
    setCurrentAnimation(animName);
    const anim = AVAILABLE_ANIMATIONS.find((a) => a.name === animName);
    setExplanation(anim?.description || null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCommand();
    }
  };

  const handleExampleCommandClick = (example: string) => {
    setCommand(example);
    commandCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    commandInputRef.current?.focus();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-sm text-foreground/50 transition-colors hover:text-foreground"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Back to Home
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          Natural Language Avatar Animation
        </h1>
        <p className="mt-2 text-foreground/60">
          Type commands in plain English to control a 3D avatar — the AI
          interprets your intent, moves the avatar to targets, and plays
          contextual animations.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-6">
          {/* Command Input */}
          <div ref={commandCardRef} className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="mb-4 text-lg font-semibold">Command Avatar</h2>

            <div className="relative">
              <input
                ref={commandInputRef}
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='e.g. "Walk to the table"'
                className="w-full rounded-lg border border-border bg-background px-4 py-3 pr-12 text-sm text-foreground placeholder:text-foreground/30 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                disabled={loading}
              />
              <button
                onClick={handleCommand}
                disabled={loading || !command.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-accent p-1.5 text-white transition-colors hover:bg-accent-light disabled:opacity-40"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                    />
                  </svg>
                )}
              </button>
            </div>

            {error && (
              <div className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="mt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-foreground/40">
                Quick Actions
              </p>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_ANIMATIONS.filter((a) => a.name !== "walk_to").map(
                  (anim) => (
                    <button
                      key={anim.name}
                      onClick={() => handleQuickAction(anim.name)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        currentAnimation === anim.name
                          ? "bg-accent text-white"
                          : "bg-background text-foreground/60 hover:bg-surface-light hover:text-foreground"
                      }`}
                    >
                      {anim.label}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-background p-3">
              <p className="text-xs text-foreground/40">
                Current:{" "}
                <span className="font-medium text-accent-light">
                  {currentAnimation}
                </span>
              </p>
            </div>
          </div>

          {/* AI Explanation */}
          {explanation && (
            <div className="rounded-2xl border border-border bg-surface p-6">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <svg
                  className="h-4 w-4 text-accent-light"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                  />
                </svg>
                AI Explanation
              </h3>
              <p className="text-sm leading-relaxed text-foreground/70">
                {explanation}
              </p>
            </div>
          )}

          {/* Command History */}
          {commandLog.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-6">
              <h3 className="mb-3 text-sm font-semibold">Command History</h3>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {commandLog.map((log) => (
                  <div
                    key={log.timestamp}
                    className="flex items-start gap-2 rounded-lg bg-background p-2 text-xs"
                  >
                    <span className="shrink-0 rounded bg-accent/20 px-1.5 py-0.5 font-mono text-accent-light">
                      {log.animation}
                    </span>
                    {log.target && (
                      <span className="shrink-0 rounded bg-purple-500/20 px-1.5 py-0.5 font-mono text-purple-300">
                        {log.target}
                      </span>
                    )}
                    <span className="line-clamp-1 text-foreground/50">
                      {log.command}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Example Commands */}
          <div className="rounded-2xl border border-border bg-surface p-6">
            <h3 className="mb-3 text-sm font-semibold">Try These Commands</h3>
            <div className="space-y-2">
              {[
                "Walk to the table",
                "Point at the fire extinguisher",
                "Wave hello to the learner",
                "Show the correct safety posture",
                "Look around the room",
                "Turn around",
                "Go to the safety cone",
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => handleExampleCommandClick(example)}
                  className="block w-full rounded-lg bg-background px-3 py-2 text-left text-sm text-foreground/60 transition-colors hover:bg-surface-light hover:text-foreground"
                >
                  &ldquo;{example}&rdquo;
                </button>
              ))}
            </div>
          </div>
        </div>

        <AvatarScene ref={avatarRef} />
      </div>
    </div>
  );
}
