import { Globe, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ─── Platform SVG icons ─── */

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function MALIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8.273 7.247v8.56H6.063V10.74L4.43 15.807H2.86L1.2 10.72v5.088H0V7.247h1.744l1.753 5.14 1.689-5.14zm5.344 0h2.273l1.455 5.14 1.407-5.14h2.282v8.56h-1.6V10.367l-1.58 5.44h-1.2l-1.58-5.37v5.37h-1.457zm11.038 7.264v1.296H19.59V7.247h1.637v7.264z" />
    </svg>
  );
}

function AniListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6.361 2.943L0 21.056h4.942l1.077-3.133H11.4l1.052 3.133H22.9c.71 0 1.1-.392 1.1-1.1V17.53c0-.71-.39-1.1-1.1-1.1h-6.483V4.045c0-.71-.392-1.1-1.1-1.1h-2.422c-.71 0-1.1.39-1.1 1.1v11.4H9.934L6.361 2.948v-.005zM6.107 14.625l1.681-5.014 1.68 5.014H6.107z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

const PLATFORMS = [
  {
    key: "social_discord" as const,
    label: "Discord",
    icon: DiscordIcon,
    placeholder: "username#1234 or invite link",
    color: "#5865F2",
  },
  {
    key: "social_instagram" as const,
    label: "Instagram",
    icon: InstagramIcon,
    placeholder: "https://instagram.com/username",
    color: "#E4405F",
  },
  {
    key: "social_twitter" as const,
    label: "X / Twitter",
    icon: TwitterIcon,
    placeholder: "https://x.com/username",
    color: "#000000",
  },
  {
    key: "social_mal" as const,
    label: "MyAnimeList",
    icon: MALIcon,
    placeholder: "https://myanimelist.net/profile/username",
    color: "#2E51A2",
  },
  {
    key: "social_anilist" as const,
    label: "AniList",
    icon: AniListIcon,
    placeholder: "https://anilist.co/user/username",
    color: "#02A9FF",
  },
  {
    key: "social_website" as const,
    label: "Website",
    icon: Globe,
    placeholder: "https://yoursite.com",
    color: "#8B5CF6",
  },
];

export type SocialLinksData = {
  social_discord: string;
  social_instagram: string;
  social_twitter: string;
  social_mal: string;
  social_anilist: string;
  social_website: string;
};

type EditorProps = {
  values: SocialLinksData;
  onChange: (key: keyof SocialLinksData, value: string) => void;
};

/** Edit form for social links — used in profile edit tab */
export function SocialLinksEditor({ values, onChange }: EditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">Social Links</Label>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your accounts so others can find you.
        </p>
      </div>

      <div className="space-y-3">
        {PLATFORMS.map((platform) => {
          const Icon = platform.icon;
          return (
            <div key={platform.key} className="flex items-center gap-3">
              <div
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
                style={{ backgroundColor: `${platform.color}15` }}
              >
                <Icon className="h-5 w-5" style={{ color: platform.color }} />
              </div>
              <div className="flex-1">
                <Input
                  value={values[platform.key] || ""}
                  onChange={(e) => onChange(platform.key, e.target.value)}
                  placeholder={platform.placeholder}
                  className="text-sm"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type DisplayProps = {
  values: Partial<SocialLinksData>;
  accentColor?: string;
};

/** Read-only display of social links as icon row — used on profile header */
export function SocialLinksDisplay({ values, accentColor = "#8B5CF6" }: DisplayProps) {
  const activeLinks = PLATFORMS.filter(
    (p) => values[p.key] && values[p.key]!.trim() !== ""
  );

  if (activeLinks.length === 0) return null;

  const getUrl = (platform: (typeof PLATFORMS)[number], value: string) => {
    // If it's already a URL, return as-is
    if (value.startsWith("http://") || value.startsWith("https://")) return value;
    // For Discord, don't linkify usernames
    if (platform.key === "social_discord") return null;
    return value;
  };

  return (
    <div className="flex items-center gap-2">
      {activeLinks.map((platform) => {
        const Icon = platform.icon;
        const value = values[platform.key]!;
        const url = getUrl(platform, value);

        if (url) {
          return (
            <a
              key={platform.key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="group grid h-9 w-9 place-items-center rounded-lg transition-all duration-200 hover:scale-110"
              style={{ backgroundColor: `${accentColor}15` }}
              title={`${platform.label}: ${value}`}
            >
              <Icon
                className="h-4.5 w-4.5 transition-colors"
                style={{ color: accentColor }}
              />
            </a>
          );
        }

        return (
          <div
            key={platform.key}
            className="grid h-9 w-9 place-items-center rounded-lg"
            style={{ backgroundColor: `${accentColor}15` }}
            title={`${platform.label}: ${value}`}
          >
            <Icon className="h-4.5 w-4.5" style={{ color: accentColor }} />
          </div>
        );
      })}
    </div>
  );
}
