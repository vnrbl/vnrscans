"use client";

import { useEffect } from "react";
import ErrorPage from "@/components/watermelon-ui/error-3";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App boundary error caught:", error);
  }, [error]);

  return <ErrorPage error={error} reset={reset} />;
}
