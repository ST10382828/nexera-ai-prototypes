"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function AnimatedGradient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    };
    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      t += 0.003;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const blobs = [
        { x: 0.5 + Math.sin(t * 0.7) * 0.2, y: 0.3 + Math.cos(t * 0.5) * 0.15, r: 0.35, color: "rgba(99, 102, 241, 0.12)" },
        { x: 0.7 + Math.cos(t * 0.6) * 0.15, y: 0.6 + Math.sin(t * 0.4) * 0.2, r: 0.25, color: "rgba(168, 85, 247, 0.08)" },
        { x: 0.3 + Math.sin(t * 0.8) * 0.1, y: 0.7 + Math.cos(t * 0.3) * 0.15, r: 0.3, color: "rgba(59, 130, 246, 0.06)" },
      ];

      for (const blob of blobs) {
        const gradient = ctx.createRadialGradient(
          blob.x * w, blob.y * h, 0,
          blob.x * w, blob.y * h, blob.r * Math.max(w, h)
        );
        gradient.addColorStop(0, blob.color);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      }

      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ opacity: 1 }}
    />
  );
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 text-center overflow-hidden">
        <AnimatedGradient />

        <div className="relative z-10 max-w-4xl">
          <FadeIn delay={250}>
            <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight sm:text-7xl">
              AI-Powered
              <br />
              <span className="bg-gradient-to-r from-accent via-purple-400 to-blue-400 bg-clip-text text-transparent">
                Learning Tools
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={400}>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-foreground/60 sm:text-xl leading-relaxed">
              Two interactive prototypes demonstrating how AI transforms 3D
              content creation and avatar-based training for human education.
            </p>
          </FadeIn>

          <FadeIn delay={550}>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/test1"
                className="group flex w-full items-center justify-center gap-3 rounded-xl bg-accent px-8 py-4 text-base font-semibold text-white transition-all hover:bg-accent-light hover:shadow-lg hover:shadow-accent/25 hover:-translate-y-0.5 sm:w-auto"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
                </svg>
                Test 1: 3D Asset Pipeline
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>

              <Link
                href="/test2"
                className="group flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface/80 px-8 py-4 text-base font-semibold text-foreground backdrop-blur-sm transition-all hover:border-accent/50 hover:bg-surface-light hover:-translate-y-0.5 sm:w-auto"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                Test 2: Avatar Animation
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="border-t border-border bg-surface/50 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <h2 className="mb-4 text-center text-3xl font-bold tracking-tight">
              How It Works
            </h2>
            <p className="mx-auto mb-12 max-w-lg text-center text-foreground/50">
              Built for NexEra&apos;s AI-powered human training platform
            </p>
          </FadeIn>
          <div className="grid gap-8 md:grid-cols-2">
            <FadeIn delay={100}>
              <FeatureCard
                title="AI-Generated 3D Assets"
                description="Describe an object in text or upload an image, and our pipeline generates a fully interactive 3D model with educational context — ready for training modules."
                steps={[
                  "Describe an object or upload a photo",
                  "AI generates a 3D model (GLB format)",
                  "Auto-scaled and centered in interactive viewer",
                  "AI provides educational training context",
                ]}
                icon={
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
                  </svg>
                }
              />
            </FadeIn>
            <FadeIn delay={250}>
              <FeatureCard
                title="Natural Language Avatar Control"
                description="Type commands in plain English to control a 3D avatar. The AI interprets your intent and plays the appropriate animation — building blocks for interactive training."
                steps={[
                  "Type a natural language command",
                  "Gemini AI interprets your intent",
                  "Avatar performs the matched animation",
                  "AI explains the action in training context",
                ]}
                icon={
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                }
              />
            </FadeIn>
          </div>
        </div>
      </section>

    </div>
  );
}

function FeatureCard({
  title,
  description,
  steps,
  icon,
}: {
  title: string;
  description: string;
  steps: string[];
  icon: React.ReactNode;
}) {
  return (
    <div className="group rounded-2xl border border-border bg-surface p-8 transition-all hover:border-accent/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent-light">
        {icon}
      </div>
      <h3 className="mb-3 text-xl font-semibold">{title}</h3>
      <p className="mb-6 text-sm text-foreground/60 leading-relaxed">{description}</p>
      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={i} className="flex items-center gap-3 text-sm">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent-light">
              {i + 1}
            </span>
            <span className="text-foreground/70">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
