"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

export interface FaqAccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: FaqItem[];
  title?: string;
  defaultOpenIndex?: number | null;
}

export const VNR_FAQ_ITEMS: FaqItem[] = [
  {
    question: "Is vnrscans completely free to use?",
    answer:
      "Yes! vnrscans is entirely free for all readers. We do not require any paid subscription to read our indexed series, bookmark your favorites, or keep track of your reading progress.",
  },
  {
    question: "How does the cultivation realm and Spiritual Qi system work?",
    answer:
      "As you read chapters, post comments, and maintain your daily reading streaks, you gather Spiritual Qi. Accumulating Qi allows your soul to break through higher Cultivation Realms, unlocking rare badges, exclusive animated avatar frames, custom accent glows, and prestigious seasonal community ranks.",
  },
  {
    question: "Where does vnrscans get its content?",
    answer:
      "vnrscans does not store any files on its servers. We only link to media hosted on third-party services. If you have copyright concerns, please visit our DMCA registry page.",
  },
  {
    question: "What is your DMCA copyright policy?",
    answer:
      "We take intellectual property ownership extremely seriously. If you are a copyright holder and believe your work is on our platform without authorization, you can file a quick takedown notice on our DMCA page. We review and process verified reports within 5 business days.",
  },
  {
    question: "Can independent creators publish their work here?",
    answer:
      "Absolutely! We love supporting independent authors and illustrators. Please reach out to creator@vnrscans.com or use our Contact page form to send us details of your work, and our admin team will assist you in setting up your series.",
  },
];

export function FaqAccordion({
  items = VNR_FAQ_ITEMS,
  title,
  defaultOpenIndex = null,
  className,
  ...props
}: FaqAccordionProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(defaultOpenIndex);

  const toggleItem = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className={cn("w-full max-w-4xl mx-auto py-2 relative font-sans", className)} {...props}>
      {title && (
        <h2 className="text-center font-bold text-2xl md:text-3xl mb-10 text-white uppercase tracking-tight font-sans">
          {title}
        </h2>
      )}
      
      <ul className="w-full mx-auto list-none p-0 flex flex-col space-y-2.5">
        {items.map((item, index) => {
          const isActive = activeIndex === index;
          return (
            <li
              key={index}
              className={cn(
                "w-full relative transition-all duration-200 rounded-[4px] overflow-hidden border backdrop-blur-md",
                isActive 
                  ? "border-white/25 bg-neutral-900/80 shadow-md shadow-black/40" 
                  : "border-white/10 bg-neutral-950/60 hover:border-white/20 hover:bg-neutral-900/40"
              )}
            >
              <button
                type="button"
                className={cn(
                  "flex flex-row items-center justify-start w-full min-h-[58px] py-4 relative m-0 px-4 pl-12 sm:pl-14 cursor-pointer",
                  "border-l-[4px] sm:border-l-[5px] transition-all duration-200 text-left outline-none text-sm sm:text-base font-bold",
                  isActive 
                    ? "border-l-white text-white" 
                    : "border-l-transparent text-neutral-300 hover:text-white hover:border-l-neutral-600"
                )}
                onClick={() => toggleItem(index)}
                aria-expanded={isActive}
              >
                {/* Plus / Minus Indicator */}
                <span 
                  className={cn(
                    "absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 transition-all duration-200 font-mono text-xl sm:text-2xl leading-none select-none",
                    isActive ? "text-white" : "text-neutral-500"
                  )}
                >
                  {isActive ? "−" : "+"}
                </span>
                
                <span className="pr-8 tracking-[0.02em]">{item.question}</span>
                
                {/* Chevron Indicator */}
                <span 
                  className={cn(
                    "absolute right-4 sm:right-6 block w-2 h-2 border-t-[2px] border-r-[2px] transition-transform duration-200 ease-in-out",
                    isActive 
                      ? "rotate-[-45deg] border-white translate-y-0.5" 
                      : "rotate-[135deg] border-neutral-500 -translate-y-0.5"
                  )}
                />
              </button>

              <div 
                className={cn(
                  "grid transition-all duration-300 ease-in-out w-full",
                  "border-l-[4px] sm:border-l-[5px]",
                  isActive 
                    ? "grid-rows-[1fr] border-l-white" 
                    : "grid-rows-[0fr] border-l-transparent"
                )}
              >
                <div className="overflow-hidden">
                  <div className="px-4 pl-12 sm:pl-14 pb-5 pt-1 text-xs sm:text-sm font-light leading-relaxed text-neutral-400">
                    <span className="opacity-95">{item.answer}</span>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default FaqAccordion;
