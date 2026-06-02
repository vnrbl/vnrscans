import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — ShadowShelf" }, { name: "description", content: "About ShadowShelf — a legal reader for manga, manhwa, manhua, and novels." }] }),
  component: () => (
    <div className="container mx-auto max-w-3xl px-8 py-12">
      <h1 className="text-3xl font-bold tracking-tight">About ShadowShelf</h1>
      <p className="mt-4 text-muted-foreground">
        ShadowShelf is a clean, dark-themed reader for original, licensed, public-domain, and creator-submitted manga, manhwa, manhua, and web novels.
      </p>
      <p className="mt-4 text-muted-foreground">
        We do not host or import unauthorized copyrighted content. Every series available here was added by an admin who confirmed its rights status.
      </p>
    </div>
  ),
});