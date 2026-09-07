import { PageKineticLoader } from "@/components/ui/kinetic-text-loader";

export default function ChapterLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <PageKineticLoader text="Loading" />
    </div>
  );
}
