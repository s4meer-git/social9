"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { FaArrowRotateLeft, FaArrowRotateRight, FaImage, FaEye, FaSpinner } from "react-icons/fa6";
import { LogoMark } from "@/components/brand/Logo";
import { RatioShape } from "@/components/ui/RatioShape";
import { Tooltip } from "@/components/ui/Tooltip";
import { UploadCard } from "@/components/home/UploadCard";
import { ExportButton } from "@/components/editor/ExportDialog";
import { Swap } from "@/components/motion/Swap";
import { useEditor, outputSize } from "@/editor/store";
import { railTools, railById, resolveRoute, type RailId } from "@/editor/tools";
import { ratioLabel } from "@social9/core/image/geometry";
import { isAcceptedImage, takePendingImage } from "@/lib/pending-image";

// The canvas and panels only matter once a photo is open, so they load in their own chunks.
const PanelLoading = () => <div className="h-40 animate-pulse rounded-3xl bg-ink/5" />;
const CanvasView = dynamic(() => import("@/components/editor/CanvasView").then((m) => m.CanvasView));
const panels: Record<RailId, React.ComponentType> = {
  background: dynamic(() => import("@/components/editor/panels/BackgroundPanel").then((m) => m.BackgroundPanel), { loading: PanelLoading }),
  faces: dynamic(() => import("@/components/editor/panels/FacesPanel").then((m) => m.FacesPanel), { loading: PanelLoading }),
  retouch: dynamic(() => import("@/components/editor/panels/RetouchPanel").then((m) => m.RetouchPanel), { loading: PanelLoading }),
  text: dynamic(() => import("@/components/editor/panels/TextPanel").then((m) => m.TextPanel), { loading: PanelLoading }),
  profile: dynamic(() => import("@/components/editor/panels/PfpPanel").then((m) => m.PfpPanel), { loading: PanelLoading }),
  size: dynamic(() => import("@/components/editor/panels/ResizePanel").then((m) => m.ResizePanel), { loading: PanelLoading }),
  save: dynamic(() => import("@/components/editor/panels/ExportPanel").then((m) => m.ExportPanel), { loading: PanelLoading }),
};

export function EditorShell() {
  const params = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const source = useEditor((s) => s.source);
  const loading = useEditor((s) => s.loading);
  const error = useEditor((s) => s.error);
  const activeTool = useEditor((s) => s.activeTool);
  const frame = useEditor((s) => s.frame);
  const canUndo = useEditor((s) => s.past.length > 0);
  const canRedo = useEditor((s) => s.future.length > 0);
  const { loadFile, open, selectTool, applyPreset, undo, redo, setCompare } = useEditor.getState();

  // One-time setup from the URL and the photo handed over by a landing page.
  useEffect(() => {
    const preset = params.get("preset");
    if (preset) applyPreset(preset);
    const route = resolveRoute(params.get("tool"));
    if (route) open(route);
    const pending = takePendingImage();
    if (pending) loadFile(pending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard: undo/redo, hold \ to compare with the original.
  useEffect(() => {
    const typing = (e: KeyboardEvent) => !!(e.target as HTMLElement)?.closest("input, textarea, select");
    const down = (e: KeyboardEvent) => {
      if (typing(e)) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (e.key === "\\" && !e.repeat) {
        e.preventDefault();
        setCompare(true);
      } else if (e.key.toLowerCase() === "b" && !e.metaKey && !e.ctrlKey && useEditor.getState().mask) {
        const s = useEditor.getState();
        s.setPointer(s.pointer === "brush" ? "move" : "brush");
      }
    };
    const up = (e: KeyboardEvent) => e.key === "\\" && setCompare(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [undo, redo, setCompare]);

  const pick = (file: File | null | undefined) => {
    if (!file) return;
    if (isAcceptedImage(file)) loadFile(file);
    else useEditor.setState({ error: "That doesn't look like a photo. Try a JPG, PNG, WebP or HEIC." });
  };

  const tool = railById(activeTool);
  const Panel = panels[activeTool];
  const out = outputSize(frame, source);

  return (
    <div className="flex h-dvh flex-col bg-canvas">
      {/* top bar */}
      <header className="z-20 flex h-14 shrink-0 items-center gap-2 border-b border-line bg-white px-3 sm:gap-3 sm:px-4">
        <Link href="/" className="flex items-center gap-2 rounded-xl p-1 hover:bg-ink/5" aria-label="Social9 home">
          <LogoMark className="h-8 w-8" />
          <span className="hidden font-display text-lg font-bold tracking-tight lg:inline">social9</span>
        </Link>
        <span className="hidden h-6 w-px bg-line sm:block" />
        {source && <span className="hidden max-w-40 truncate text-sm font-medium text-ink-soft md:block">{source.file.name}</span>}
        <div className="flex items-center">
          <Tooltip label="Undo" kbd="Ctrl Z" side="bottom">
            <button onClick={undo} disabled={!canUndo} className="grid h-10 w-10 place-items-center rounded-full text-ink/80 transition hover:bg-ink/5 active:scale-90 disabled:opacity-25" aria-label="Undo">
              <FaArrowRotateLeft aria-hidden />
            </button>
          </Tooltip>
          <Tooltip label="Redo" kbd="Ctrl ⇧ Z" side="bottom">
            <button onClick={redo} disabled={!canRedo} className="grid h-10 w-10 place-items-center rounded-full text-ink/80 transition hover:bg-ink/5 active:scale-90 disabled:opacity-25" aria-label="Redo">
              <FaArrowRotateRight aria-hidden />
            </button>
          </Tooltip>
        </div>
        {source && (
          <button
            type="button"
            onClick={() => selectTool("size")}
            className="mx-auto hidden items-center gap-2 rounded-full bg-ink/5 px-3 py-1.5 text-sm font-semibold transition hover:bg-ink/10 md:flex"
            title="Change the size"
          >
            <RatioShape width={out.width} height={out.height} max={14} />
            {out.width} × {out.height}
            <span className="font-medium text-ink-soft">{ratioLabel(out.width, out.height)}</span>
          </button>
        )}
        <div className={clsx("flex items-center gap-1.5", source ? "ml-auto md:ml-0" : "ml-auto")}>
          {source && (
            <>
              <Tooltip label="Hold to see the original" kbd="\" side="bottom">
                <button
                  onPointerDown={() => setCompare(true)}
                  onPointerUp={() => setCompare(false)}
                  onPointerLeave={() => setCompare(false)}
                  className="hidden h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-ink/80 hover:bg-ink/5 sm:flex"
                >
                  <FaEye aria-hidden /> Compare
                </button>
              </Tooltip>
              <button onClick={() => inputRef.current?.click()} className="hidden h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-ink/80 hover:bg-ink/5 lg:flex">
                <FaImage aria-hidden /> Replace
              </button>
            </>
          )}
          <ExportButton />
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col md:flex-row">
        {/* tool rail: one tool per pipeline stage */}
        <nav aria-label="Tools" className="order-last shrink-0 overflow-x-auto border-t border-line bg-white md:order-first md:w-23 md:overflow-y-auto md:overflow-x-hidden md:border-r md:border-t-0">
          <ul className="flex gap-0 px-0.5 py-1.5 md:flex-col md:justify-start md:gap-1 md:p-2">
            {railTools.map((t) => {
              const active = t.id === activeTool;
              return (
                <li key={t.id} className="min-w-[52px] flex-1 md:flex-none">
                  <button
                    onClick={() => selectTool(t.id)}
                    aria-pressed={active}
                    title={t.blurb}
                    className={clsx(
                      "group flex w-full flex-col items-center gap-1 rounded-2xl px-0.5 py-2 text-[10px] font-bold leading-tight tracking-[-0.01em] transition-all duration-200 active:scale-95 sm:text-[11.5px] md:w-19 md:px-1",
                      active ? t.tint : "text-ink/65 hover:bg-ink/5 hover:text-ink",
                    )}
                  >
                    <span className={clsx("grid h-8 w-8 place-items-center rounded-xl text-[16px] transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:-rotate-6 group-hover:scale-110", active && clsx(t.fill, "shadow-pop"))}>
                      <t.icon aria-hidden />
                    </span>
                    {t.short}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* canvas: neutral on purpose */}
        <main
          className="relative min-h-0 flex-1 overflow-hidden bg-[radial-gradient(rgb(15_14_23/0.10)_1px,transparent_1.2px)] bg-size-[20px_20px]"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            pick(e.dataTransfer.files[0]);
          }}
        >
          {source ? (
            <CanvasView />
          ) : (
            <div className="absolute inset-0 grid place-items-center overflow-y-auto p-4">
              {loading ? (
                <p className="flex items-center gap-3 rounded-full bg-white px-5 py-3 font-semibold shadow-card">
                  <FaSpinner aria-hidden className="animate-spin text-violet" /> Opening your photo
                </p>
              ) : (
                <div className="w-full max-w-lg text-center">
                  <p className={clsx("mx-auto mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold", tool.tint)}>
                    <tool.icon aria-hidden /> {tool.name}
                  </p>
                  {/* same headline as the server skeleton, so hydrating doesn't count as a new paint */}
                  <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Edit your photo</h1>
                  <p className="mx-auto mt-2 max-w-sm text-ink-soft">Drop a photo here to start. It stays on your device.</p>
                  <UploadCard className="mt-6 text-left" onFile={pick} />
                  <p className="mt-6 text-[15px] text-ink-soft">iPhone HEIC photos work too. Nothing is uploaded, and it also works offline.</p>
                  {error && (
                    <p role="alert" className="mt-4 text-sm font-medium text-pink-deep">
                      {error}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.heic,.heif"
            className="sr-only"
            aria-label="Choose a photo"
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = ""; // so picking the same photo again still works
            }}
          />
        </main>

        {/* settings panel */}
        {source && (
          <aside className="max-h-[42dvh] shrink-0 overflow-y-auto border-t border-line bg-white md:max-h-none md:w-90 md:border-l md:border-t-0">
            <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-white px-4 py-2.5 md:px-5 md:py-4">
              <span className={clsx("grid h-8 w-8 shrink-0 place-items-center rounded-xl text-base md:h-10 md:w-10 md:text-lg", tool.tint)}>
                <tool.icon aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-base font-bold leading-tight tracking-tight md:text-lg">{tool.name}</h2>
                <p className="hidden truncate text-[13px] text-ink-soft md:block">{tool.blurb}</p>
              </div>
            </div>
            <Swap id={activeTool} className="p-4 md:p-5">
              <Panel />
            </Swap>
          </aside>
        )}
      </div>
    </div>
  );
}
