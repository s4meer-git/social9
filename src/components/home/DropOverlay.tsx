"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FaArrowUpFromBracket } from "react-icons/fa6";
import { usePhotoPicker } from "@/components/home/usePhotoPicker";

/** Drag a photo anywhere over the page: a full-screen drop target appears. */
export function DropOverlay({ tool, preset }: { tool?: string; preset?: string }) {
  const { goMany } = usePhotoPicker({ tool, preset, paste: false });
  const [show, setShow] = useState(false);
  const depth = useRef(0);

  useEffect(() => {
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth.current++;
      setShow(true);
    };
    const leave = () => {
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setShow(false);
    };
    const over = (e: DragEvent) => hasFiles(e) && e.preventDefault();
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current = 0;
      setShow(false);
      goMany(e.dataTransfer?.files);
    };
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragleave", leave);
    window.addEventListener("dragover", over);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("dragover", over);
      window.removeEventListener("drop", drop);
    };
  }, [goMany]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[100] grid place-items-center bg-ink/40 p-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.92, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className="grid h-[min(60vh,420px)] w-[min(90vw,640px)] place-items-center rounded-[40px] border-2 border-dashed border-white/80 bg-white/10"
          >
            <div className="text-center text-white">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white text-2xl text-violet shadow-float">
                <FaArrowUpFromBracket aria-hidden />
              </span>
              <p className="mt-5 font-display text-4xl font-extrabold tracking-tight">Drop your photo here</p>
              <p className="mt-2 text-white/80">It will open in the editor. Nothing is uploaded.</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
