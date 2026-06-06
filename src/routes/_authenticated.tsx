import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireAuthenticatedUser } from "@/lib/auth-guards";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const user = await requireAuthenticatedUser();
    return { user };
  },
  component: () => <Outlet />,
});
