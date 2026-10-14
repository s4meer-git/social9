"use client";

import { platforms } from "@/lib/platforms";
import { FlowPath } from "@/components/fx/FlowPath";

const items = platforms.map((p) => ({ icon: p.icon, label: p.name }));

/** Grey logo + name ribbon that flows along a looping curve. */
export function PlatformFlow(props: Omit<Parameters<typeof FlowPath>[0], "items">) {
  return <FlowPath items={items} {...props} />;
}
