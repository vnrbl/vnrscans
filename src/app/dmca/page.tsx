import type { Metadata } from "next";
import Link from "next/link";
import { Scale, ArrowLeft, Mail, AlertTriangle, FileText, Check } from "lucide-react";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "DMCA Copyright Policy — vnrscans",
  description: "vnrscans DMCA and copyright protection policy. Guidelines for submitting copyright removal requests.",
};

export default function DmcaPage() {
  return (
    <div className="min-h-screen bg-background py-16 md:py-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-red-500/5 blur-[80px] pointer-events-none" />

      <div className="container mx-auto max-w-4xl px-4 sm:px-6 md:px-8">
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4.5 w-4.5" /> Back to landing
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/5 px-4 py-1.5 mb-4 text-xs font-semibold text-red-500">
            <Scale className="h-4 w-4" /> Intellectual Property Protection
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl leading-tight">
            DMCA & Copyright Policy
          </h1>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-2xl">
            vnrscans does not store any files on its servers. We only link to media hosted on third-party services. If you have copyright concerns, please submit a formal removal request below.
          </p>
        </div>

        {/* Notice Warning */}
        <div className="flex gap-4 p-5 rounded-2xl border border-amber-500/10 bg-amber-500/5 mb-10">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wide">Important Notice</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              vnrscans does not store any files on its servers. All contents are links pointing to media hosted on third-party services. We only accept formal, digital DMCA notices containing all required items to handle the removal of these links.
            </p>
          </div>
        </div>

        {/* Step checklist */}
        <div className="space-y-6 mb-12">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Takedown Notice Checklist
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "Clear identification of the copyrighted work claimed to have been infringed (title, artist, and publisher).",
              "Direct URLs pointing to the exact pages or chapters hosting the alleged infringing material.",
              "Complete contact information of the owner or authorized representative (name, physical address, email, telephone).",
              "A statement that the complaining party has a good faith belief that the use is not authorized by the copyright owner.",
              "A statement that the information in the notification is accurate, under penalty of perjury.",
              "A physical or electronic signature of the copyright owner or their authorized agent.",
            ].map((text, idx) => (
              <Card key={idx} className="p-4 border-border/40 bg-card/40 flex gap-3">
                <div className="grid h-6 w-6 place-items-center rounded-full bg-violet-600/10 text-primary shrink-0">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Submit Details */}
        <div className="rounded-2xl border border-border/40 bg-card/45 p-6 md:p-8 space-y-4">
          <h3 className="text-lg font-bold">Where to Submit Notices</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            All formal removal requests must be drafted and sent to our legal desk at:
          </p>
          <a
            href="mailto:dmca@vnrscans.com"
            className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors px-5 py-3.5 text-sm font-bold text-primary"
          >
            <Mail className="h-4.5 w-4.5" /> dmca@vnrscans.com
          </a>
          <p className="text-3xs text-muted-foreground/60 leading-normal pt-2">
            We confirm receipt and process verified claims within 3 to 5 business days. Once an item is verified as infringing, it is permanently purged from our search indexing and databases.
          </p>
        </div>
      </div>
    </div>
  );
}
