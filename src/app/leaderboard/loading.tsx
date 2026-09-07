import { PageKineticLoader } from "@/components/ui/kinetic-text-loader";

export default function LeaderboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <PageKineticLoader text="Loading" />
    </div>
  );
}
