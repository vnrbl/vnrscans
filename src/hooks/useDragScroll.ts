import { useRef, useCallback, type DragEvent, type PointerEvent, type RefObject } from "react";

const DRAG_THRESHOLD = 5;

/** Apply on the horizontal scroll container */
export const DRAG_SCROLL_CONTAINER_CLASS =
  "flex gap-4 overflow-x-auto pb-4 scrollbar-hide touch-pan-x md:cursor-grab [&[data-dragging=true]]:cursor-grabbing [&[data-dragging=true]_*]:pointer-events-none";

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
      if (!el || e.pointerType !== "mouse" || e.button !== 0) return;

      pointerId.current = e.pointerId;
      startX.current = e.clientX;
      scrollLeftStart.current = el.scrollLeft;
      isDragging.current = false;
      suppressClick.current = false;

      const onMove = (moveEvent: globalThis.PointerEvent) => {
        if (pointerId.current !== moveEvent.pointerId) return;

        const container = scrollRef.current;
        if (!container) return;

        if (moveEvent.buttons !== 1) {
          finishDrag(container, moveEvent.pointerId);
          document.removeEventListener("pointermove", onMove);
          document.removeEventListener("pointerup", onUp);
          document.removeEventListener("pointercancel", onUp);
          return;
        }

        const dx = moveEvent.clientX - startX.current;

        if (!isDragging.current) {
          if (Math.abs(dx) < DRAG_THRESHOLD) return;

          isDragging.current = true;
          suppressClick.current = true;
          container.setPointerCapture(moveEvent.pointerId);
          container.dataset.dragging = "true";
          container.style.cursor = "grabbing";
          document.body.style.userSelect = "none";
          document.body.style.cursor = "grabbing";
        }

        moveEvent.preventDefault();
        container.scrollLeft = scrollLeftStart.current - dx;
      };

      const onUp = (upEvent: globalThis.PointerEvent) => {
        if (pointerId.current !== upEvent.pointerId) return;
        finishDrag(scrollRef.current, upEvent.pointerId);
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onUp);
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onUp);
    },
    [finishDrag]
  );

  const handleClickCapture = (e: PointerEvent) => {
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
