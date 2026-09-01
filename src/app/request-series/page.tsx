"use client";

import { Link } from "@/lib/router-compat";
import { useState } from "react";
import {
  ArrowLeft,
  BookPlus,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type SeriesType = "manga" | "manhwa" | "manhua" | "novel" | "unknown";

const initialForm = {
  title: "",
  type: "unknown" as SeriesType,
  sourceUrl: "",
  contactEmail: "",
  notes: "",
};

export default function RequestSeriesPage() {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const title = form.title.trim();
    const sourceUrl = form.sourceUrl.trim();
    const contactEmail = form.contactEmail.trim();
    const notes = form.notes.trim();

    if (!title) {
      toast.error("Add the series title before submitting.");
      return;
    }

    setSubmitting(true);
    const { error } = await (supabase as any).from("series_requests").insert({
      title,
      type: form.type === "unknown" ? null : form.type,
      source_url: sourceUrl || null,
      contact_email: contactEmail || user?.email || null,
      notes: notes || null,
      requested_by: user?.id ?? null,
      status: "pending",
    });

    setSubmitting(false);

    if (error) {
      toast.error(error.message || "Could not submit request.");
      return;
    }

    setSubmitted(true);
    setForm(initialForm);
    toast.success("Series request submitted.");
  };

  return (
    <div className="min-h-screen bg-background py-12 md:py-18">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 md:px-8">
        <Link
          to="/browse"
          className="mb-8 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to browse
        </Link>

        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          <section className="lg:col-span-5">
            <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
              <BookPlus className="h-4 w-4" />
              Library Requests
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Request a Series
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
              Tell the team what you want added next. Source links help us verify the title faster,
              but the title is enough to start the request.
            </p>

            <div className="mt-8 space-y-4">
              <InfoRow
                label="What to include"
                value="Official title, alternate title, source link, or release page."
              />
              <InfoRow
                label="Review status"
                value="Requests are saved as pending until staff review them."
              />
              <InfoRow
                label="Already listed?"
                value="Search the catalog first to avoid duplicate requests."
              />
            </div>
          </section>

          <section className="lg:col-span-7">
            <Card className="rounded-lg border-border/50 bg-card/70 p-6 shadow-sm md:p-8">
              {submitted ? (
                <div className="py-12 text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="h-9 w-9" />
                  </div>
                  <h2 className="mt-5 text-2xl font-bold text-foreground">Request received</h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                    Thanks for the tip. The team can now review this title from the request queue.
                  </p>
                  <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <Button onClick={() => setSubmitted(false)}>
                      Request another
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/browse">Browse library</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider">
                      Series Title *
                    </Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(event) => updateForm("title", event.target.value)}
                      placeholder="Solo Leveling"
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="type" className="text-xs font-bold uppercase tracking-wider">
                        Format
                      </Label>
                      <Select
                        value={form.type}
                        onValueChange={(value) => updateForm("type", value)}
                      >
                        <SelectTrigger id="type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unknown">Not sure</SelectItem>
                          <SelectItem value="manga">Manga</SelectItem>
                          <SelectItem value="manhwa">Manhwa</SelectItem>
                          <SelectItem value="manhua">Manhua</SelectItem>
                          <SelectItem value="novel">Novel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="contactEmail"
                        className="text-xs font-bold uppercase tracking-wider"
                      >
                        Contact Email
                      </Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={form.contactEmail}
                        onChange={(event) => updateForm("contactEmail", event.target.value)}
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="sourceUrl"
                      className="text-xs font-bold uppercase tracking-wider"
                    >
                      Source Link
                    </Label>
                    <div className="relative">
                      <ExternalLink className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="sourceUrl"
                        type="url"
                        value={form.sourceUrl}
                        onChange={(event) => updateForm("sourceUrl", event.target.value)}
                        placeholder="https://example.com/title"
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider">
                      Notes
                    </Label>
                    <Textarea
                      id="notes"
                      value={form.notes}
                      onChange={(event) => updateForm("notes", event.target.value)}
                      placeholder="Alternate titles, author, language, why readers want it..."
                      rows={5}
                    />
                  </div>

                  <Button type="submit" disabled={submitting} className="h-11 w-full gap-2">
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting
                      </>
                    ) : (
                      <>
                        Submit Request
                        <Send className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-secondary/20 p-4">
      <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">{label}</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{value}</p>
    </div>
  );
}
