import { useRef, useCallback, type DragEvent, type PointerEvent, type MouseEvent, type RefObject } from "react";

const DRAG_THRESHOLD = 5;

/** Apply on the horizontal scroll container */
export const DRAG_SCROLL_CONTAINER_CLASS =
  "flex gap-4 overflow-x-auto overscroll-x-contain pb-4 scrollbar-hide [-webkit-overflow-scrolling:touch] md:touch-pan-x md:cursor-grab [&[data-dragging=true]]:cursor-grabbing [&[data-dragging=true]_*]:pointer-events-none";

export function useDragScroll<T extends HTMLElement>() {
  const scrollRef = useRef<T>(null);
  const pointerId = useRef<number | null>(null);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const isDragging = useRef(false);
  const suppressClick = useRef(false);

  const finishDrag = useCallback((el: T | null, id: number) => {
    if (el && isDragging.current) {
      try {
        el.releasePointerCapture(id);
      } catch {
        /* already released */
      }
      delete el.dataset.dragging;
      el.style.cursor = "";
    }

    pointerId.current = null;
    isDragging.current = false;
    document.body.style.removeProperty("user-select");
    document.body.style.removeProperty("cursor");
  }, []);

  const scrollBy = useCallback((direction: "left" | "right", amount = 400) => {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }, []);

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      const el = scrollRef.current;
      if (!el || e.button !== 0) return;

      pointerId.current = e.pointerId;
      startX.current = e.clientX;
      const startY = e.clientY;
      scrollLeftStart.current = el.scrollLeft;
      isDragging.current = false;
      suppressClick.current = false;

      let axisLock: "x" | "y" | null = e.pointerType === "mouse" ? "x" : null;
      let rafId: number | null = null;
      let latestDx = 0;

      const onMove = (moveEvent: globalThis.PointerEvent) => {
        if (pointerId.current !== moveEvent.pointerId) return;

        const container = scrollRef.current;
        if (!container) return;

        if (e.pointerType === "mouse" && moveEvent.buttons !== 1) {
          if (rafId) cancelAnimationFrame(rafId);
          finishDrag(container, moveEvent.pointerId);
          document.removeEventListener("pointermove", onMove);
          document.removeEventListener("pointerup", onUp);
          document.removeEventListener("pointercancel", onUp);
          return;
        }

        const dx = moveEvent.clientX - startX.current;
        const dy = moveEvent.clientY - startY;
        latestDx = dx;

        if (e.pointerType === "touch" && !axisLock) {
          if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
          axisLock = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
          if (axisLock === "y") {
            document.removeEventListener("pointermove", onMove);
            document.removeEventListener("pointerup", onUp);
            document.removeEventListener("pointercancel", onUp);
            pointerId.current = null;
            return;
          }
        }

        if (axisLock === "y") return;

        if (!isDragging.current) {
          if (Math.abs(dx) < DRAG_THRESHOLD) return;

          isDragging.current = true;
          suppressClick.current = true;
          try {
            container.setPointerCapture(moveEvent.pointerId);
          } catch {
            /* capture may fail on some browsers */
          }
          container.dataset.dragging = "true";
          if (e.pointerType === "mouse") {
            container.style.cursor = "grabbing";
            document.body.style.userSelect = "none";
            document.body.style.cursor = "grabbing";
          }
        }

        moveEvent.preventDefault();
        if (!rafId) {
          rafId = requestAnimationFrame(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollLeft = scrollLeftStart.current - latestDx;
            }
            rafId = null;
          });
        }
      };

      const onUp = (upEvent: globalThis.PointerEvent) => {
        if (pointerId.current !== upEvent.pointerId) return;
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        finishDrag(scrollRef.current, upEvent.pointerId);
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onUp);
      };

      document.addEventListener("pointermove", onMove, { passive: false });
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onUp);
    },
    [finishDrag]
  );

  const handleClickCapture = (e: MouseEvent) => {
    if (suppressClick.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClick.current = false;
    }
  };

  const handleDragStart = (e: DragEvent) => {
    e.preventDefault();
  };

  return {
    scrollRef: scrollRef as RefObject<T>,
    scrollBy,
    dragHandlers: {
      onPointerDown: handlePointerDown,
      onClickCapture: handleClickCapture,
      onDragStart: handleDragStart,
    },
  };
};
