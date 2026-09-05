import type { Metadata } from "next";
import { AuthGuardClient } from "./AuthGuardClient";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuardClient>{children}</AuthGuardClient>;
}
