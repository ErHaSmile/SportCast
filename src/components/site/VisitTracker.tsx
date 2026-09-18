"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const recent = new Map<string, number>();

export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api")) {
      return;
    }
    const now = Date.now();
    const last = recent.get(pathname) || 0;
    if (now - last < 2500) return;
    recent.set(pathname, now);

    fetch("/api/stats/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
