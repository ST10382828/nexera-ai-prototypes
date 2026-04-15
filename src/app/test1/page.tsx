"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[500px] items-center justify-center rounded-2xl border border-border bg-surface">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  ),
});

type Stage = "idle" | "uploading" | "generating" | "processing" | "loading" | "done";

const STAGE_LABELS: Record<Stage, string> = {
  idle: "",
  uploading: "Uploading to AI pipeline...",
  generating: "AI is generating your 3D model...",
  processing: "Processing and optimizing mesh...",
  loading: "Loading model into viewer...",
  done: "Complete!",
};

const DEMO_MODELS = [
  { name: "Damaged Helmet", url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DamagedHelmet/glTF-Binary/DamagedHelmet.glb", desc: "a damaged battle helmet" },
  { name: "Avocado", url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Avocado/glTF-Binary/Avocado.glb", desc: "an avocado" },
  { name: "Barramundi Fish", url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/BarramundiFish/glTF-Binary/BarramundiFish.glb", desc: "a barramundi fish" },
];

export default function Test1Page() {
  const [prompt, setPrompt] = useState("");
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"text" | "image">("text");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (mode === "text" && !prompt.trim()) return;
    if (mode === "image" && !imageFile) return;

    setLoading(true);
    setError(null);
    setStage("uploading");
    setProgress(0);
    setModelUrl(null);
    setSummary(null);

    try {
      let taskResponse;

      if (mode === "text") {
        taskResponse = await fetch("/api/generate-3d", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: prompt.trim() }),
        });
      } else {
        const formData = new FormData();
        formData.append("image", imageFile!);
        taskResponse = await fetch("/api/generate-3d-from-image", {
          method: "POST",
          body: formData,
        });
      }

      if (!taskResponse.ok) {
        const errData = await taskResponse.json();
        throw new Error(errData.error || "Failed to start generation");
      }

      const { taskId } = await taskResponse.json();
      setStage("generating");

      const glbUrl = await pollForResult(taskId);
      setStage("loading");
      setModelUrl(glbUrl);
      setStage("done");

      const descriptionToSummarize =
        mode === "text" ? prompt.trim() : "the uploaded image object";
      fetchSummary(descriptionToSummarize, mode === "image");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStage("idle");
    } finally {
      setLoading(false);
    }
  };

  const pollForResult = async (taskId: string): Promise<string> => {
    const endpoint = mode === "text" ? "generate-3d" : "generate-3d-from-image";
    for (let i = 0; i < 120; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const res = await fetch(`/api/${endpoint}?taskId=${taskId}`);
      const data = await res.json();

      if (data.status === "SUCCEEDED") {
        return data.modelUrl;
      } else if (data.status === "FAILED") {
        throw new Error("Generation failed. Try a different description.");
      }

      const p = data.progress || 0;
      setProgress(p);
      if (data.status === "RUNNING" && p > 50) setStage("processing");
    }
    throw new Error("Generation timed out");
  };

  const fetchSummary = async (description: string, withImage?: boolean) => {
    try {
      const body: Record<string, string> = { description };

      if (withImage && imagePreview) {
        const base64Match = imagePreview.match(/^data:(.+?);base64,(.+)$/);
        if (base64Match) {
          body.imageMimeType = base64Match[1];
          body.imageBase64 = base64Match[2];
        }
      }

      const res = await fetch("/api/educational-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
      }
    } catch {
      // Non-critical
    }
  };

  const handleDownload = () => {
    if (!modelUrl) return;
    const a = document.createElement("a");
    a.href = modelUrl;
    a.download = `nexera-model-${Date.now()}.glb`;
    a.target = "_blank";
    a.click();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-sm text-foreground/50 transition-colors hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Home
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          AI-Generated 3D Asset Pipeline
        </h1>
        <p className="mt-2 text-foreground/60">
          Describe an object or upload an image to generate an interactive 3D
          model with educational context.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-6">
          {/* Input Panel */}
          <div className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="mb-4 text-lg font-semibold">Generate 3D Model</h2>

            {/* Mode Toggle */}
            <div className="mb-4 flex gap-1 rounded-lg bg-background p-1">
              <button
                onClick={() => setMode("text")}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                  mode === "text"
                    ? "bg-accent text-white shadow-sm"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                Text Description
              </button>
              <button
                onClick={() => setMode("image")}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                  mode === "image"
                    ? "bg-accent text-white shadow-sm"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                Image Upload
              </button>
            </div>

            {mode === "text" ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground/70">
                  Describe the object
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder='e.g. "a yellow hard hat" or "fire extinguisher"'
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                  rows={3}
                  disabled={loading}
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["yellow hard hat", "fire extinguisher", "safety goggles", "power drill"].map(
                    (ex) => (
                      <button
                        key={ex}
                        onClick={() => setPrompt(ex)}
                        disabled={loading}
                        className="rounded-full bg-background px-2.5 py-1 text-xs text-foreground/50 transition-colors hover:bg-surface-light hover:text-foreground disabled:opacity-40"
                      >
                        {ex}
                      </button>
                    )
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground/70">
                  Upload an image
                </label>
                {imagePreview ? (
                  <div className="flex flex-col items-center rounded-lg border border-border bg-background p-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mb-3 h-32 w-32 rounded-lg object-cover"
                    />
                    <p className="mb-2 text-xs text-foreground/50 truncate max-w-full">
                      {imageFile?.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      disabled={loading}
                      className="rounded-md bg-surface px-3 py-1.5 text-xs font-medium text-foreground/60 transition-colors hover:bg-surface-light hover:text-foreground disabled:opacity-40"
                    >
                      Change Image
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-background p-6 transition-colors hover:border-accent/50">
                    <svg className="mb-2 h-10 w-10 text-foreground/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                    <span className="text-xs text-foreground/50">Click to select an image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                      disabled={loading}
                    />
                  </label>
                )}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading || (mode === "text" ? !prompt.trim() : !imageFile)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-accent-light hover:shadow-lg hover:shadow-accent/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  Generate 3D Model
                </>
              )}
            </button>
          </div>

          {/* Progress Panel */}
          {stage !== "idle" && stage !== "done" && (
            <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                <span className="text-sm font-medium text-accent-light">
                  {STAGE_LABELS[stage]}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-background">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-purple-400 transition-all duration-500"
                  style={{ width: `${Math.max(progress, stage === "uploading" ? 10 : stage === "processing" ? 85 : 5)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-foreground/40">
                {progress > 0 ? `${progress}% complete` : "This usually takes 1-3 minutes"}
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-400">Generation Failed</p>
                  <p className="mt-1 text-xs text-red-300/70">{error}</p>
                  <button
                    onClick={() => { setError(null); setStage("idle"); }}
                    className="mt-2 rounded-md bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/30"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions Panel (after generation) */}
          {modelUrl && (
            <div className="rounded-2xl border border-border bg-surface p-6">
              <h3 className="mb-3 text-sm font-semibold">Model Actions</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-background px-3 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-surface-light hover:text-foreground"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Download GLB
                </button>
                <button
                  onClick={() => {
                    setModelUrl(null);
                    setSummary(null);
                    setStage("idle");
                    setProgress(0);
                    setImageFile(null);
                    setImagePreview(null);
                    setError(null);
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-background px-3 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-surface-light hover:text-foreground"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                  </svg>
                  New Model
                </button>
              </div>
            </div>
          )}

          {/* Educational Summary */}
          {summary && (
            <div className="rounded-2xl border border-border bg-surface p-6">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <svg className="h-4 w-4 text-accent-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                </svg>
                Educational Summary
              </h3>
              <p className="text-sm leading-relaxed text-foreground/70">
                {summary}
              </p>
            </div>
          )}

          {/* Info Panel */}
          {!modelUrl && stage === "idle" && (
            <div className="rounded-2xl border border-border bg-surface p-6">
              <h3 className="mb-3 text-sm font-semibold">How It Works</h3>
              <ol className="space-y-2">
                {[
                  "Describe an object or upload an image",
                  "AI generates a 3D model via Tripo3D",
                  "Model is auto-scaled and centered in the viewer",
                  "Gemini AI provides educational context",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent-light">
                      {i + 1}
                    </span>
                    <span className="text-foreground/60">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Demo Models */}
          {!loading && (
            <div className="rounded-2xl border border-dashed border-accent/30 bg-accent/5 p-6">
              <h3 className="mb-1 text-sm font-semibold text-accent-light">Demo Models</h3>
              <p className="mb-3 text-xs text-foreground/40">Load a sample GLB to preview the 3D viewer</p>
              <div className="space-y-2">
                {DEMO_MODELS.map((demo) => {
                  const isActive = modelUrl === demo.url;
                  return (
                    <button
                      key={demo.name}
                      onClick={() => {
                        setError(null);
                        setSummary(null);
                        setModelUrl(demo.url);
                        setStage("done");
                        fetchSummary(demo.desc);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        isActive
                          ? "bg-accent/20 text-accent-light ring-1 ring-accent/40"
                          : "bg-background text-foreground/70 hover:bg-surface-light hover:text-foreground"
                      }`}
                    >
                      <svg className="h-4 w-4 shrink-0 text-accent-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
                      </svg>
                      {demo.name}
                      {isActive && (
                        <span className="ml-auto text-xs text-accent-light/60">Active</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <ModelViewer modelUrl={modelUrl} showPlaceholder={!modelUrl} />
      </div>
    </div>
  );
}
