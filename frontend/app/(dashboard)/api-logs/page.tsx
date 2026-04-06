"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ApiLogsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/reports");
  }, [router]);
  return (
    <p className="text-sm text-muted-foreground">
      Redirecionando para relatórios…
    </p>
  );
}
