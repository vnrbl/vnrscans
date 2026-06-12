"use client";

import { useParams } from "next/navigation";
import { useNavigate } from "@/lib/router-compat";
import ChapterManager from "../../series/ChapterManager";

export default function AdminSeriesChaptersPage() {
  const params = useParams<{ seriesId: string }>();
  const seriesId = params.seriesId ?? "";
  const navigate = useNavigate();

  return (
    <ChapterManager
      seriesId={seriesId}
      onBack={() => navigate("/admin/series")}
    />
  );
}
