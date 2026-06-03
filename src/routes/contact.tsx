import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — vnrscans" }] }),
  component: () => (
    <div className="container mx-auto max-w-3xl px-8 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Contact</h1>
      <p className="mt-4 text-muted-foreground">
        For partnership, submission, or licensing inquiries, email{" "}
        <a className="text-primary underline" href="mailto:hello@vnrscans.com">hello@vnrscans.com</a>.
      </p>
      <p className="mt-2 text-muted-foreground">
        For copyright concerns, please use our <a className="text-primary underline" href="/dmca">DMCA page</a>.
      </p>
    </div>
  ),
});