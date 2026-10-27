"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { authClient } from "../../lib/auth-client";

export default function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await authClient.signOut();
    } finally {
      router.push("/");
      router.refresh();
      setLoading(false);
    }
  };

  return (
    <button type="button" onClick={handleSignOut} disabled={loading} className={className}>
      <LogOut className="h-4 w-4" aria-hidden="true" />
      {loading ? "Saliendo..." : "Cerrar sesión"}
    </button>
  );
}
