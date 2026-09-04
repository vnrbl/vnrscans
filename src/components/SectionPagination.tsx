"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SectionPaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  accentColor?: string;
  className?: string;
}

export function SectionPagination({
  currentPage,
  totalItems,
  pageSize = 20,
  onPageChange,
  itemLabel = "items",
  accentColor = "#8B5CF6",
  className = "",
}: SectionPaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      className={`mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/40 ${className}`}
    >
      <p className="text-xs text-muted-foreground order-2 sm:order-1">
        Showing <span className="font-semibold text-foreground">{start}</span>–
        <span className="font-semibold text-foreground">{end}</span> of{" "}
        <span className="font-semibold text-foreground">{totalItems}</span> {itemLabel}
      </p>

      <div className="flex items-center gap-1.5 order-1 sm:order-2 flex-wrap justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0 cursor-pointer disabled:opacity-40"
          title="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {Array.from({ length: totalPages }).map((_, idx) => {
          const pageNum = idx + 1;
          if (totalPages > 7) {
            if (
              pageNum !== 1 &&
              pageNum !== totalPages &&
              Math.abs(pageNum - currentPage) > 1
            ) {
              if (pageNum === 2 && currentPage > 3) {
                return (
                  <span
                    key="ellipsis-start"
                    className="px-1 text-xs text-muted-foreground select-none"
                  >
                    ...
                  </span>
                );
              }
              if (pageNum === totalPages - 1 && currentPage < totalPages - 2) {
                return (
                  <span
                    key="ellipsis-end"
                    className="px-1 text-xs text-muted-foreground select-none"
                  >
                    ...
                  </span>
                );
              }
              return null;
            }
          }

          const isActive = currentPage === pageNum;
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className="h-8 min-w-[32px] px-2 rounded-md text-xs font-semibold transition-all cursor-pointer border"
              style={
                isActive
                  ? {
                      backgroundColor: accentColor,
                      color: "#FFFFFF",
                      borderColor: accentColor,
                      boxShadow: `0 0 10px ${accentColor}50`,
                    }
                  : {
                      backgroundColor: "transparent",
                      borderColor: "rgba(255,255,255,0.1)",
                      color: "inherit",
                    }
              }
            >
              {pageNum}
            </button>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0 cursor-pointer disabled:opacity-40"
          title="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default SectionPagination;
