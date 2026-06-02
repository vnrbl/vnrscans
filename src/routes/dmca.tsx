import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dmca")({
  head: () => ({ meta: [{ title: "DMCA / Copyright — ShadowShelf" }] }),
  component: () => (
    <div className="container mx-auto max-w-3xl px-8 py-12">
      <h1 className="text-3xl font-bold tracking-tight">DMCA & Copyright</h1>
      <p className="mt-4 text-muted-foreground">
        ShadowShelf hosts only original, licensed, public-domain, or creator-submitted content. If you are a rights holder and believe content here was uploaded in error, contact{" "}
        <a className="text-primary underline" href="mailto:dmca@shadowshelf.example">dmca@shadowshelf.example</a> with the URL, your contact details, and proof of ownership. We will review within 5 business days.
      </p>
    </div>
  ),
});