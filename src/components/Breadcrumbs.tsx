import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumbs — sitewide breadcrumb navigation.
 *
 * - Last item renders as the current page (no link, aria-current="page").
 * - Injects Schema.org BreadcrumbList JSON-LD for Google rich results.
 * - Long labels truncate gracefully on mobile.
 */
export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  const SITE_URL = "https://www.vnrscans.com";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${SITE_URL}${item.href}` } : {}),
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className={`min-w-0 ${className}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          const isLink = !!item.href && !isLast;
          return (
            <li key={`${item.label}-${i}`} className="flex min-w-0 items-center gap-1">
              {i > 0 && (
                <ChevronRight className="h-3 w-3 shrink-0 text-neutral-600" aria-hidden="true" />
              )}
              {isLink ? (
                <Link
                  href={item.href!}
                  className="focus-ring truncate rounded-sm font-medium text-neutral-400 transition-colors hover:text-purple-300"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current="page"
                  title={item.label}
                  className="truncate font-semibold text-neutral-200"
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Capitalize a series type (e.g. "manhwa" -> "Manhwa") for breadcrumb labels. */
export function formatTypeLabel(type: string | null | undefined): string {
  if (!type) return "";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export default Breadcrumbs;
