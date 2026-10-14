"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { FaArrowRotateRight, FaCircleCheck, FaTriangleExclamation, FaChevronDown } from "react-icons/fa6";
import { useEditor } from "@/editor/store";
import { getModelStatus, subscribeModelStatus, MODELS, type ModelId, type ModelState } from "@social9/core/ml/models";
import { formatBytes } from "@social9/core/image/geometry";

type Task = "mask" | "faces";

/** What the person sees above the bar while the work runs. No technical words here. */
const working: Record<string, string> = {
  "background:remove": "Removing the background on your device",
  "background:replace": "Separating you from the background",
  "background:blur": "Finding you, so only the background is blurred",
  profile: "Framing your profile picture",
  "faces:blur": "Finding faces on your device",
  "faces:pixelate": "Finding faces on your device",
  "faces:eyewear": "Finding the eyes in each face",
  "faces:sticker": "Finding faces for your stickers",
};
const finished: Record<Task, string> = { mask: "Cut-out ready", faces: "Faces found" };
const warmingUp: Record<Task, string> = {
  mask: "Getting the AI ready",
  faces: "Getting the face finder ready",
};

/** Rotating line under the bar: a useful fact for what they're doing. */
const facts: Record<"mask" | "pfp" | "faces", string[]> = {
  mask: [
    "A plain background keeps the attention on you. That is why photo studios use them.",
    "Clean cut-outs make product photos look sharper in shops and listings.",
    "Hair is the hardest part of a cut-out, so the AI looks at it in extra detail.",
    "Your photo never leaves this device. It is not uploaded or copied to a server.",
    "Once this is set up, it also works without an internet connection.",
  ],
  pfp: [
    "LinkedIn says profiles with a photo get up to 21 times more profile views.",
    "People form a first impression of a face in about a tenth of a second.",
    "Profile pictures look best when your face fills most of the circle. We frame it for you.",
    "Using the same photo everywhere makes you easier to recognize across apps.",
    "Your photo never leaves this device. It is not uploaded or copied to a server.",
  ],
  faces: [
    "Covering faces protects friends who didn't agree to be posted online.",
    "Children can't agree to having their photos online. Covering their faces protects their privacy.",
    "Photos can contain your exact GPS location. We remove it when you save.",
    "Light pixelation can sometimes be reversed. Use a higher strength for faces that must stay hidden.",
    "Nothing is uploaded, so no one else sees the faces in your photo.",
  ],
};

const modelFor = (task: Task, kind?: string | null): ModelId => (task === "faces" ? "faces" : kind === "object" ? "objects" : "matting");

/** 0..1 progress for one task: download is most of the bar, then setup, then the work itself creeps toward the end. */
function taskProgress(model: ModelState, busy: boolean, runningFor: number) {
  if (!busy) return 1;
  if (model.state === "downloading") return 0.72 * (model.total ? model.loaded / model.total : 0);
  if (model.state === "starting") return 0.78;
  return 0.8 + 0.18 * (1 - Math.exp(-runningFor / 3500));
}

/**
 * Friendly progress for the AI steps. The technical part (model files, sizes, engine)
 * stays behind a "Details" toggle for people who want it.
 */
export function AiStatus({ tasks, doneLabel }: { tasks: Task[]; doneLabel?: string }) {
  const busy = useEditor((s) => s.busy);
  const aiError = useEditor((s) => s.aiError);
  const mask = useEditor((s) => s.mask);
  const faces = useEditor((s) => s.faces);
  const [open, setOpen] = useState(false);
  const detailsId = useId();

  const anyBusy = tasks.some((t) => busy[t]);
  const done = tasks.every((t) => (t === "mask" ? !!mask : !!faces));

  // When work ends, keep the card a moment at 100% before it folds away (no abrupt collapse).
  const [wasBusy, setWasBusy] = useState(anyBusy);
  const [finishing, setFinishing] = useState(false);
  if (wasBusy !== anyBusy) {
    setWasBusy(anyBusy);
    setFinishing(!anyBusy);
  }
  useEffect(() => {
    if (!finishing) return;
    const t = setTimeout(() => setFinishing(false), 750);
    return () => clearTimeout(t);
  }, [finishing]);

  const failed = !!aiError && !anyBusy && !done;
  const showCard = anyBusy || finishing;

  return (
    // empty:hidden: when there's nothing to show, take no space in the panel
    <div className="empty:hidden">
      <AnimatePresence initial={false}>
        {showCard && (
          <motion.div
            key="card"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="overflow-hidden"
          >
            <Working tasks={tasks} finishing={finishing} />
          </motion.div>
        )}
        {!showCard && done && doneLabel && !failed && (
          <motion.p
            key="done"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="flex items-center gap-2 text-sm font-semibold text-emerald-700"
          >
            <FaCircleCheck aria-hidden /> {doneLabel}
          </motion.p>
        )}
      </AnimatePresence>
      {failed && (
        <div role="alert" className="rounded-2xl bg-pink-soft p-4 text-sm">
          <div className="flex items-start gap-3">
            <FaTriangleExclamation aria-hidden className="mt-0.5 shrink-0 text-pink-deep" />
            <div className="flex-1">
              <p className="font-bold text-pink-deep">Something went wrong.</p>
              <p className="mt-0.5 text-ink-soft">The first time needs an internet connection. Check your connection and try again.</p>
              <div className="mt-2 flex items-center gap-4">
                <button
                  onClick={() => tasks.forEach((t) => (t === "mask" ? useEditor.getState().ensureMask() : useEditor.getState().ensureFaces()))}
                  className="inline-flex items-center gap-1.5 font-bold text-ink underline-offset-[5px] decoration-[1.5px] hover:underline"
                >
                  <FaArrowRotateRight aria-hidden className="text-xs" /> Try again
                </button>
                <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={detailsId} className="font-semibold text-ink-soft hover:text-ink">
                  Details
                </button>
              </div>
              {open && (
                <p id={detailsId} className="mt-2 rounded-xl bg-white/70 p-2.5 font-mono text-xs text-ink-soft">
                  {aiError}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** The live card. Mounted only while work runs, so its clock starts fresh each time. */
function Working({ tasks, finishing }: { tasks: Task[]; finishing: boolean }) {
  const busy = useEditor((s) => s.busy);
  const maskKind = useEditor((s) => s.maskKind);
  const activeTool = useEditor((s) => s.activeTool);
  const bgTab = useEditor((s) => s.bgTab);
  const facesTab = useEditor((s) => s.facesTab);
  const status = useSyncExternalStore(subscribeModelStatus, getModelStatus, getModelStatus);
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const active = tasks.filter((t) => busy[t]);

  // Clock for the creeping bar and the rotating facts.
  const [startedAt] = useState(() => performance.now());
  const [now, setNow] = useState(startedAt);
  useEffect(() => {
    const id = setInterval(() => setNow(performance.now()), 200);
    return () => clearInterval(id);
  }, []);

  const factSet = activeTool === "profile" ? facts.pfp : tasks.includes("mask") ? facts.mask : facts.faces;
  const [factOffset] = useState(() => Math.floor(Math.random() * factSet.length));
  const fact = factSet[(factOffset + Math.floor((now - startedAt) / 5000)) % factSet.length];

  const models = active.map((t) => ({ task: t, id: modelFor(t, maskKind), state: status[modelFor(t, maskKind)] }));
  const warming = models.some((m) => m.state.state === "downloading" || m.state.state === "starting");
  const progress = finishing ? 1 : tasks.reduce((n, t) => n + taskProgress(status[modelFor(t, maskKind)], busy[t], now - startedAt), 0) / tasks.length;
  const key = activeTool === "background" ? `background:${bgTab}` : activeTool === "faces" ? `faces:${facesTab}` : activeTool;
  const headline = finishing ? finished[tasks.includes("mask") ? "mask" : "faces"] : warming ? warmingUp[active.includes("mask") ? "mask" : "faces"] : (working[key] ?? (active.includes("mask") ? "Cutting out your subject" : "Finding faces"));

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-line" aria-live="polite">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[15px] font-bold leading-snug text-ink">{headline}</p>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={detailsId}
            aria-label={open ? "Hide details" : "Show details"}
            className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-ink/5 hover:text-ink"
          >
            <FaChevronDown aria-hidden className={clsx("text-xs transition-transform duration-300", open && "rotate-180")} />
          </button>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/[0.06]" role="progressbar" aria-label="Progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
          <div className="relative h-full rounded-full brand-gradient transition-[width] duration-500 ease-out" style={{ width: `${Math.max(4, progress * 100)}%` }}>
            <span className="absolute inset-0 animate-[bar-shine_1.6s_linear_infinite] bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.45),transparent)] bg-[length:50%_100%] bg-no-repeat" />
          </div>
        </div>

        <div className="relative mt-3 min-h-[2.75rem] text-[13px] leading-snug text-ink-soft">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p key={fact} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35 }}>
              {fact}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div id={detailsId} initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }} className="overflow-hidden">
            <ul className="space-y-2 border-t border-line bg-paper px-4 py-3 text-xs text-ink-soft">
              {models.map((m) => (
                <li key={m.id} className="flex justify-between gap-3">
                  <span className="font-semibold text-ink">AI model: {MODELS[m.id].label}</span>
                  <span className="tabular-nums">{modelLine(m.state)}</span>
                </li>
              ))}
              <li className="flex justify-between gap-3">
                <span className="font-semibold text-ink">Processing</span>
                <span>{warming ? "Waiting for the model" : "Running in this browser"}</span>
              </li>
              <li className="pt-1 leading-relaxed">The AI model is downloaded once and saved on this device. Next time, it starts straight away and works offline. Your photo is never uploaded.</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function modelLine(s: ModelState) {
  switch (s.state) {
    case "downloading":
      return `Downloading ${formatBytes(s.loaded)} of ${formatBytes(s.total)}`;
    case "starting":
      return "Starting up";
    case "ready":
      return "Ready, saved on this device";
    case "error":
      return "Failed";
    default:
      return "Waiting";
  }
}
