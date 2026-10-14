"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getInPlaceHandler, isAcceptedImage, setPendingImage } from "@/lib/pending-image";

export const samples = [
  { id: "portrait", label: "Portrait" },
  { id: "headshot", label: "Headshot" },
  { id: "group", label: "Group photo" },
  { id: "street", label: "With pet" },
];

export interface PickerOptions {
  tool?: string;
  preset?: string;
  /** handle the file in place instead of opening the editor */
  onFile?: (file: File) => void;
  /** listen for Ctrl/Cmd+V anywhere on the page */
  paste?: boolean;
}

/** File input + drop + paste + sample photos, all ending in the editor. */
export function usePhotoPicker({ tool, preset, onFile, paste = true }: PickerOptions = {}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const go = useCallback(
    (file: File | undefined | null) => {
      if (!file) return;
      if (!isAcceptedImage(file)) {
        setError("That file type isn't supported. Try a JPG, PNG, WebP or HEIC photo.");
        return;
      }
      setError(null);
      if (onFile) {
        onFile(file);
        setBusy(null);
        return;
      }
      const here = getInPlaceHandler();
      if (here) {
        here([file]);
        setBusy(null);
        return;
      }
      setPendingImage(file);
      const q = new URLSearchParams();
      if (tool) q.set("tool", tool);
      if (preset) q.set("preset", preset);
      router.push(`/editor${q.size ? `?${q}` : ""}`);
    },
    [router, tool, preset, onFile],
  );

  /** Several files at once (the converter takes them all; everything else uses the first). */
  const goMany = useCallback(
    (list: FileList | File[] | null | undefined) => {
      const files = Array.from(list ?? []).filter(isAcceptedImage);
      const here = getInPlaceHandler();
      if (here && files.length && !onFile) {
        setError(null);
        here(files);
        return;
      }
      go(list?.[0]);
    },
    [go, onFile],
  );

  useEffect(() => {
    if (!paste) return;
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith("image/"));
      if (file) go(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [go, paste]);

  const trySample = async (id: string) => {
    setBusy(id);
    try {
      const blob = await (await fetch(`/samples/${id}.jpg`)).blob();
      go(new File([blob], `${id}.jpg`, { type: "image/jpeg" }));
    } catch {
      setError("Couldn't load that sample. Check your connection and try again.");
      setBusy(null);
    }
  };

  return {
    inputRef,
    open: () => inputRef.current?.click(),
    go,
    goMany,
    trySample,
    busy,
    error,
    inputProps: {
      ref: inputRef,
      type: "file" as const,
      accept: "image/*,.heic,.heif",
      multiple: true,
      className: "sr-only",
      "aria-label": "Choose a photo",
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        goMany(e.target.files);
        e.target.value = ""; // so picking the same photo again still works
      },
    },
  };
}
