import type { Metadata } from "next";
import Link from "next/link";
import { FileText, ArrowLeft, Scale, Mail, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Terms of Service — vnrscans",
  description:
    "Read the vnrscans Terms of Service. Understand the rules and conditions for using our manga, manhwa, and manhua reading platform, including acceptable use, intellectual property, and liabilities.",
  keywords: [
    "vnrscans terms of service",
    "terms of use",
    "manga reader terms",
    "acceptable use policy",
    "user agreement",
  ],
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Terms of Service — vnrscans",
    description:
      "Read the vnrscans Terms of Service. Understand the rules and conditions for using our reading platform.",
    url: "https://www.vnrscans.com/terms",
    type: "article",
  },
  twitter: {
    card: "summary",
    title: "Terms of Service — vnrscans",
    description:
      "Read the vnrscans Terms of Service. Understand the rules and conditions for using our reading platform.",
  },
};

const lastUpdated = "June 23, 2026";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-16 md:py-24 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-red-500/5 blur-[80px] pointer-events-none" />

      <div className="container mx-auto max-w-4xl px-4 sm:px-6 md:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4.5 w-4.5" /> Back to landing
        </Link>

        <div className="mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-4 text-xs font-semibold text-primary">
            <FileText className="h-4 w-4" /> User Agreement
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl leading-tight">
            Terms of Service
          </h1>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Welcome to vnrscans. These Terms of Service (&quot;Terms&quot;)
            govern your access to and use of www.vnrscans.com and its features
            (the &quot;Service&quot;). By accessing or using the Service, you
            agree to be bound by these Terms.
          </p>
          <p className="mt-2 text-3xs text-muted-foreground/60">
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Important notice */}
        <div className="flex gap-4 p-5 rounded-2xl border border-amber-500/10 bg-amber-500/5 mb-10">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wide">
              Please Read Carefully
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              If you do not agree with any part of these Terms, you must not use
              the Service. We may revise these Terms at any time, and continued
              use of the Service constitutes acceptance of the updated Terms.
            </p>
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">
              1. Eligibility
            </h2>
            <p>
              You must be at least 13 years of age (or the minimum age required
              in your jurisdiction) to create an account and use certain
              features. By using the Service, you represent that you meet this
              requirement and that you have the legal capacity to agree to these
              Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">
              2. Your Account
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                You are responsible for maintaining the confidentiality of your
                account credentials and for all activity under your account.
              </li>
              <li>
                You agree to provide accurate information and to keep it current.
              </li>
              <li>
                You must notify us immediately of any unauthorized use of your
                account.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">
              3. Acceptable Use
            </h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                Use the Service for any unlawful purpose or in violation of any
                applicable law;
              </li>
              <li>
                Harass, abuse, threaten, or impersonate any other user or
                person;
              </li>
              <li>
                Post spam, malware, or content that is defamatory, obscene, or
                infringes on others&apos; rights;
              </li>
              <li>
                Attempt to gain unauthorized access to the Service, its systems,
                or another user&apos;s data;
              </li>
              <li>
                Use bots, scrapers, or automated tools to access the Service in
                a way that sends more requests than a human reasonably could;
              </li>
              <li>
                Interfere with or disrupt the Service, servers, or networks
                connected to the Service.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">
              4. Content &amp; Intellectual Property
            </h2>
            <div className="flex gap-4 p-4 rounded-xl border border-border/40 bg-card/40 mb-3">
              <Scale className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">
                <strong className="text-foreground">
                  Important:
                </strong>{" "}
                vnrscans does not store any media files on its servers. We only
                provide links to content hosted on third-party services. All
                manga, manhwa, manhua, and related artwork remain the property of
                their respective copyright holders.
              </p>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                User-generated content (comments, ratings, profile information)
                remains owned by you, but you grant vnrscans a non-exclusive,
                royalty-free license to host, display, and use that content in
                connection with the Service.
              </li>
              <li>
                You represent that any content you submit does not violate the
                rights of any third party.
              </li>
              <li>
                If you believe content linked on the Service infringes your
                copyright, please file a notice on our{" "}
                <Link
                  href="/dmca"
                  className="text-primary hover:underline font-semibold"
                >
                  DMCA Copyright page
                </Link>
                .
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">
              5. Third-Party Links &amp; Services
            </h2>
            <p>
              The Service contains links to third-party websites and services
              that we do not control. We are not responsible for the content,
              accuracy, or practices of any third-party sites. You access them at
              your own risk and should review their terms and policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">
              6. Advertising
            </h2>
            <p>
              The Service may display advertising provided by third parties,
              including Google AdSense. Advertisers and ad networks may use
              cookies and similar technologies as described in our{" "}
              <Link
                href="/privacy"
                className="text-primary hover:underline font-semibold"
              >
                Privacy Policy
              </Link>
              . We are not responsible for the content of third-party
              advertisements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">
              7. Disclaimer of Warranties
            </h2>
            <p>
              The Service is provided &quot;AS IS&quot; and &quot;AS
              AVAILABLE&quot; without warranties of any kind, whether express or
              implied. We do not warrant that the Service will be uninterrupted,
              error-free, secure, or that any linked content is accurate,
              complete, or lawful.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">
              8. Limitation of Liability
            </h2>
            <p>
              To the fullest extent permitted by law, vnrscans and its operators
              shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages, or any loss of data, arising
              out of or related to your use of, or inability to use, the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">
              9. Termination
            </h2>
            <p>
              We may suspend or terminate your access to the Service at any time,
              without notice, for any reason, including violation of these
              Terms. Upon termination, the provisions that by their nature should
              survive will remain in effect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">
              10. Governing Law
            </h2>
            <p>
              These Terms are governed by and construed in accordance with
              applicable laws, without regard to conflict-of-law principles. Any
              disputes will be resolved in the competent courts of the applicable
              jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">
              11. Changes to These Terms
            </h2>
            <p>
              We may modify these Terms at any time. The updated Terms will be
              posted on this page with a revised date. Your continued use of the
              Service after changes take effect constitutes acceptance of the new
              Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">
              12. Contact
            </h2>
            <p>Questions about these Terms? Contact us:</p>
            <a
              href="mailto:hello@vnrscans.com"
              className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors px-5 py-3.5 text-sm font-bold text-primary mt-3"
            >
              <Mail className="h-4.5 w-4.5" /> hello@vnrscans.com
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}
