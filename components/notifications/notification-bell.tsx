"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

/** Campana con el número de avisos sin leer; se refresca al cambiar de página. */
export default function NotificationBell({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;

    const load = () => {
      fetch("/api/notifications/unread-count", { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : { count: 0 }))
        .then((data: { count?: number }) => {
          if (active) setCount(typeof data.count === "number" ? data.count : 0);
        })
        .catch(() => null);
    };

    load();
    window.addEventListener("notifications:refresh", load);

    return () => {
      active = false;
      window.removeEventListener("notifications:refresh", load);
    };
  }, [pathname]);

  return (
    <Link
      href="/cuenta/notificaciones"
      onClick={onNavigate}
      aria-label={count > 0 ? `Notificaciones: ${count} sin leer` : "Notificaciones"}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-unis-lightgray text-unis-gray transition hover:border-unis-red hover:text-unis-red"
    >
      <Bell className="h-4 w-4" aria-hidden="true" />
      {count > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-unis-red px-1.5 text-[10px] font-bold leading-5 text-white">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
