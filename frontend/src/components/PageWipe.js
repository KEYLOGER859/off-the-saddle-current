import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { flushSync } from "react-dom";
import { gsap } from "@/lib/gsap";
import { waitForPageReady } from "@/lib/pageReadiness";
import "@/components/PageWipe.css";

export const PageWipe = forwardRef(function PageWipe(_, ref) {
  const rootRef = useRef(null), panelRef = useRef(null), tweenRef = useRef(null);
  const busyRef = useRef(false), abortRef = useRef(null);

  useImperativeHandle(ref, () => ({
    get isRunning() { return busyRef.current; },
    async transition(changePage, selector) {
      if (busyRef.current) return false;
      busyRef.current = true;
      const controller = new AbortController();
      abortRef.current = controller;
      const root = rootRef.current, panel = panelRef.current;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const duration = reduce ? 0.12 : 0.52;
      const lockKeys = (event) => {
        if (["Enter", " ", "Escape", "Tab", "ArrowLeft", "ArrowRight"].includes(event.key)) {
          event.preventDefault(); event.stopImmediatePropagation();
        }
      };
      const animate = (yPercent) => new Promise((resolve, reject) => {
        tweenRef.current = gsap.to(panel, { yPercent, duration, ease: "power2.inOut", onComplete: resolve, onInterrupt: () => reject(new Error("Transition interrupted")) });
      });
      window.addEventListener("keydown", lockKeys, true);
      root.parentElement?.setAttribute("aria-busy", "true");
      root.dataset.state = "covering";
      // Reset absolute offsets as well: CSS percentage translations can otherwise
      // be parsed as a residual pixel Y offset by GSAP on the first transition.
      gsap.set(panel, { x: 0, y: 0, xPercent: 0, yPercent: -100 });
      gsap.set(root, { visibility: "visible", pointerEvents: "auto" });
      try {
        await animate(0);
        if (controller.signal.aborted) return false;
        gsap.set(panel, { x: 0, y: 0, xPercent: 0, yPercent: 0 });
        await new Promise(requestAnimationFrame);
        if (controller.signal.aborted) return false;
        const cover = panel.getBoundingClientRect();
        if (cover.top > 1 || cover.left > 1 || cover.bottom < window.innerHeight - 1 || cover.right < window.innerWidth - 1) {
          throw new Error("Content swap blocked: wipe has not fully covered the viewport");
        }
        root.dataset.state = "covered";
        // This is the ONLY content-swap point. The sheet is completely covering
        // the viewport before React receives a destination-state update.
        flushSync(changePage);
        root.dataset.state = "waiting";
        await waitForPageReady(selector, controller.signal);
        if (controller.signal.aborted) return false;
        root.dataset.state = "revealing";
        await animate(100);
        return true;
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Page transition could not finish preparing content", error);
          await animate(100);
        }
        return false;
      } finally {
        window.removeEventListener("keydown", lockKeys, true);
        if (!controller.signal.aborted) {
          gsap.set(root, { visibility: "hidden", pointerEvents: "none" });
          root.dataset.state = "idle";
          root.parentElement?.removeAttribute("aria-busy");
        }
        busyRef.current = false;
      }
    },
  }), []);
  useEffect(() => () => { abortRef.current?.abort(); tweenRef.current?.kill(); }, []);
  return <div className="page-wipe" ref={rootRef} aria-hidden="true" data-testid="page-wipe" data-state="idle"><div className="page-wipe__panel" ref={panelRef} data-testid="page-wipe-panel" /></div>;
});