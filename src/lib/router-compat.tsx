"use client";

import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

export const Link = React.forwardRef<HTMLAnchorElement, any>(function Link(
  { to, params, search, hash, children, activeProps, activeOptions, className, ...props }: any,
  ref
) {
  let href = to || "";
  if (params) {
    for (const [key, val] of Object.entries(params)) {
      href = href.replace(`$${key}`, val);
    }
  }
  if (search) {
    const searchStr = new URLSearchParams(search).toString();
    if (searchStr) {
      href = `${href}?${searchStr}`;
    }
  }
  if (hash) {
    href = `${href}#${hash}`;
  }

  const pathname = usePathname();
  let isActive = false;
  if (to) {
    if (activeOptions?.exact) {
      isActive = pathname === href;
    } else {
      isActive = pathname.startsWith(href);
    }
  }

  const mergedProps = { ...props };
  let finalClassName = className;
  if (isActive && activeProps) {
    if (activeProps.className) {
      finalClassName = `${className || ""} ${activeProps.className}`.trim();
    }
    Object.assign(mergedProps, activeProps);
    delete mergedProps.className;
  }

  const router = useRouter();

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (href && typeof href === "string" && href.startsWith("/")) {
      try { router.prefetch(href); } catch {}
    }
    props.onMouseEnter?.(e);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLAnchorElement>) => {
    if (href && typeof href === "string" && href.startsWith("/")) {
      try { router.prefetch(href); } catch {}
    }
    props.onTouchStart?.(e);
  };

  return (
    <NextLink
      ref={ref}
      href={href}
      className={finalClassName}
      prefetch={props.prefetch ?? (typeof href === "string" && href.startsWith("/"))}
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleTouchStart}
      {...mergedProps}
    >
      {children}
    </NextLink>
  );
});
Link.displayName = "Link";

export function useNavigate() {
  const router = useRouter();
  return (opts: any) => {
    if (typeof opts === "string") {
      router.push(opts);
      return;
    }
    if (opts.to && opts.params) {
      let target = opts.to;
      for (const [key, val] of Object.entries(opts.params)) {
        target = target.replace(`$${key}`, val);
      }
      if (opts.hash) {
        target = `${target}#${opts.hash}`;
      }
      router.push(target);
    } else if (opts.to) {
      let target = opts.to;
      if (opts.search) {
        const searchStr = new URLSearchParams(opts.search).toString();
        if (searchStr) {
          target = `${target}?${searchStr}`;
        }
      }
      if (opts.hash) {
        target = `${target}#${opts.hash}`;
      }
      router.push(target);
    }
  };
}

export function useRouterCompat() {
  const router = useRouter();
  return {
    navigate: useNavigate(),
    invalidate: () => {},
    refresh: () => router.refresh(),
  };
}
