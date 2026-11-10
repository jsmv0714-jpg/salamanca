"use client";

import { useEffect } from "react";

/**
 * Avisa a la campana del encabezado cuando cambia el número de avisos sin leer.
 * Se coloca en la bandeja: al marcar todo como leído, la campana se actualiza
 * sin esperar a cambiar de página.
 */
export default function NotificationSync({ unread }: { unread: number }) {
  useEffect(() => {
    window.dispatchEvent(new Event("notifications:refresh"));
  }, [unread]);

  return null;
}
