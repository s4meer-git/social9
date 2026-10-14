"use client";

import { useSearchParams } from "next/navigation";
import { CutoutScene, FacesScene, ResizeScene, PfpScene } from "@/components/home/ExplainerReel";
import reel from "../../../public/reel/reel.json";

export function ReelStage() {
  const params = useSearchParams();
  const scene = params.get("scene") ?? "cutout";
  return (
    <div className="fixed inset-0 overflow-hidden bg-ink">
      {scene === "cutout" && <CutoutScene />}
      {scene === "faces" && <FacesScene faces={reel.faces} w={reel.w} h={reel.h} />}
      {scene === "resize" && <ResizeScene />}
      {scene === "pfp" && <PfpScene />}
    </div>
  );
}
