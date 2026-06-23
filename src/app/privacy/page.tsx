import type { Metadata } from "next";
import Link from "next/link";
import { Shield, ArrowLeft, Cookie, Mail, Eye, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy — vnrscans",
  description:
    "Read the vnrscans Privacy Policy. Learn what data we collect, how cookies are used, how Google AdSense and analytics process information, and your rights to control your data.",
  keywords: [
    "vnrscans privacy policy",
    "manga reader privacy",
    "cookie policy",
    "google adsense privacy",
    "data protection",
  ],
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy — vnrscans",
    description:
      "Read the vnrscans Privacy Policy. Learn what data we collect, how cookies are used, and your rights to control your data.",
    url: "https://www.vnrscans.com/privacy",
    type: "article",
  },
  twitter: {
    card: "summary",
    title: "Privacy Policy — vnrscans",
    description:
      "Read the vnrscans Privacy Policy. Learn what data we collect, how cookies are used, and your rights to control your data.",
  },
};

const lastUpdated = "June 23, 2026";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-16 md:py-24 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-violet-600/5 blur-[80px] pointer-events-none" />

      <div className="container mx-auto max-w-4xl px-4 sm:px-6 md:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4.5 w-4.5" /> Back to landing
        </Link>

        <div className="mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-4 text-xs font-semibold text-primary">
            <Shield className="h-4 w-4" /> Your Privacy Matters
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl leading-tight">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-2xl">
            This Privacy Policy explains how vnrscans (&quot;we&quot;,
            &quot;us&quot;, or &quot;our&quot;) collects, uses, and protects your
            information when you visit www.vnrscans.com (the
            &quot;Service&quot;). By using the Service, you agree to the practices
            described here.
          </p>
          <p className="mt-2 text-3xs text-muted-foreground/60">
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Quick summary cards */}
        <div className="grid gap-4 sm:grid-cols-3 mb-12">
          {[
            {
              icon: Eye,
              title: "What We Collect",
              desc: "Account info, reading history, and basic usage data — never more than needed.",
            },
            {
              icon: Cookie,
              title: "Cookies & Ads",
              desc: "Cookies for sessions and analytics. Third-party vendors may serve ads.",
            },
            {
              icon: Lock,
              title: "Your Control",
              desc: "Opt out, request deletion, or access your data at any time.",
            },
          ].map((item, idx) => {
            const ItemIcon = item.icon;
            return (
              <Card key={idx} className="p-5 border-border/40 bg-card/40">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600/10 text-primary mb-3">
                  <ItemIcon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </Card>
            );
          })}
        </div>

        {/* Full policy */}
        <div className="prose dark:prose-invert max-w-none space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">
              1. Information We Collect
            </h2>
            <p>We collect the following types of information:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                <strong className="text-foreground">
                  Account Information:
                </strong>{" "}
                When you create an account, we collect your email address,
                username, and display preferences.
              </li>
              <li>
                <strong className="text-foreground">Usage Data:</strong>{" "}
                Information such as your reading history, bookmarks, reading
                progress, and interactions (comments, ratings) to provide and
                improve our features.
              </li>
              <li>
                <strong className="text-foreground">Technical Data:</strong>{" "}
                Aggregated and anonymized data such as browser type, device
                type, approximate location, and pages visited, collected via
                analytics tools.
              </li>
            </ul>
            <p className="mt-2">
              vnrscans does not store any media files on its servers. We only
              link to content hosted on third-party services, so we do not
              collect data related to the content itself.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">
              2. How We Use Your Information
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide, operate, and maintain the Service;</li>
              <li>
                To personalize your experience, including reading progress,
                recommendations, and gamification features (XP, badges,
                streaks);
              </li>
              <li>To improve our content, features, and performance;</li>
              <li>
                To monitor and prevent fraud, abuse, and security issues;
              </li>
              <li>
                To respond to your comments, questions, and support requests.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">
              3. Cookies and Tracking Technologies
            </h2>
            <p>
              We use cookies and similar technologies to operate the Service,
              keep you signed in, remember your preferences, and understand how
              the Service is used. You can disable cookies in your browser
              settings, though some features may not function properly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">
              4. Google AdSense &amp; Third-Party Advertising
            </h2>
            <p>
              We may use third-party advertising companies, including{" "}
              <strong className="text-foreground">Google AdSense</strong>, to
              serve ads when you visit our website. These companies may use
              cookies (such as the DoubleClick DART cookie) to serve ads based on
              your prior visits to this and other websites.
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                Google&apos;s use of advertising cookies enables it and its
                partners to serve ads to you based on your visit to our site
                and/or other sites on the Internet.
              </li>
              <li>
                You may opt out of personalized advertising by visiting{" "}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google Ads Settings
                </a>
                .
              </li>
              <li>
                For more information about how Google uses data, visit{" "}
                <a
                  href="https://policies.google.com/technologies/partner-sites"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  How Google uses information from sites or apps that use our
                  services
                </a>
                .
              </li>
            </ul>
            <p className="mt-2">
              Third-party vendors, including Google, use cookies to serve ads
              based on a user&apos;s previous visits to our website or other
              websites. Google&apos;s use of advertising cookies enables it and
              its partners to serve ads to our users based on their visit to our
              site and/or other sites on the Internet.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">
              5. Analytics
            </h2>
            <p>
              We may use analytics services such as Vercel Analytics and Google
              Analytics to understand how visitors interact with the Service.
              These services collect information sent by your device, including
              the pages you visit, performance metrics, and other usage data, in
              an aggregated and/or anonymized form.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">
              6. Data Sharing and Disclosure
            </h2>
            <p>
              We do not sell your personal information. We may share data only:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                With service providers (hosting, analytics, email) who help us
                operate the Service, under appropriate confidentiality
                obligations;
              </li>
              <li>
                To comply with legal obligations, respond to legal requests, or
                protect our rights and safety;
              </li>
              <li>
                In connection with a merger, acquisition, or asset sale, subject
                to confidentiality safeguards.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">
              7. Data Security
            </h2>
            <p>
              We use reasonable administrative, technical, and physical
              safeguards designed to protect your information. However, no method
              of transmission over the Internet or electronic storage is 100%
              secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">
              8. Your Rights and Choices
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-foreground">Access &amp; Update:</strong>{" "}
                You can view and update your profile and reading preferences in
                your account settings.
              </li>
              <li>
                <strong className="text-foreground">Opt Out of Ads:</strong>{" "}
                Personalized ads can be disabled via your browser or{" "}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google Ads Settings
                </a>
                .
              </li>
              <li>
                <strong className="text-foreground">
                  Account Deletion:
                </strong>{" "}
                You may request deletion of your account and associated data at
                any time by contacting us.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">
              9. Children&apos;s Privacy
            </h2>
            <p>
              The Service is not directed to children under the age of 13 (or the
              minimum age in your jurisdiction). We do not knowingly collect
              personal information from children. If you believe a child has
              provided us with personal information, please contact us so we can
              delete it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">
              10. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will
              be posted on this page with an updated revision date. We encourage
              you to review this page periodically.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-2">
              11. Contact Us
            </h2>
            <p>
              If you have questions about this Privacy Policy or your data,
              please reach out:
            </p>
            <a
              href="mailto:hello@vnrscans.com"
              className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors px-5 py-3.5 text-sm font-bold text-primary mt-3"
            >
              <Mail className="h-4.5 w-4.5" /> hello@vnrscans.com
            </a>
            <p className="mt-3">
              For copyright concerns, see our{" "}
              <Link
                href="/dmca"
                className="text-primary hover:underline font-semibold"
              >
                DMCA Copyright Policy
              </Link>{" "}
              or our{" "}
              <Link
                href="/terms"
                className="text-primary hover:underline font-semibold"
              >
                Terms of Service
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
