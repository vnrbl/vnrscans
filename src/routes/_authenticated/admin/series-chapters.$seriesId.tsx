import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { ChapterManager } from "./series";

export const Route = createFileRoute("/_authenticated/admin/series-chapters/$seriesId")({
  head: () => ({ meta: [{ title: "Admin · Chapters" }] }),
  component: AdminSeriesChapters,
});

function AdminSeriesChapters() {
  const { seriesId } = Route.useParams();
  const navigate = useNavigate();

  return (
    <ChapterManager
      seriesId={seriesId}
      onBack={() => navigate({ to: "/admin/series" })}
    />
  );
}
