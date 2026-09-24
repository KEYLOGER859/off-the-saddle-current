import { useCallback, useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

export function useProductTransition({ rootRef, slotRef, frameRef, imageRef, sourceEl, onClosed }) {
  const closeRef = useRef(null);
  useLayoutEffect(() => {
    const root = rootRef.current, frame = frameRef.current, image = imageRef.current;
    const sourceFrame = sourceEl?.querySelector(".obj__frame");
    const sourceImage = sourceEl?.querySelector(".obj__img");
    const veil = root.querySelector(".story-view__veil");
    const reveals = root.querySelectorAll(".story-reveal");
    const names = root.querySelectorAll(".story-name-inner");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduce ? 0.12 : 0.95;
    let closing = false, exit;
    const previousVisibility = sourceFrame?.style.visibility || "";
    const geometry = () => {
      const target = slotRef.current.getBoundingClientRect();
      const source = sourceFrame?.isConnected ? sourceFrame.getBoundingClientRect() : target;
      return { x: source.left - target.left, y: source.top - target.top, scale: source.width / target.width };
    };
    const imageGeometry = () => {
      const ratio = slotRef.current.clientWidth / (sourceFrame?.clientWidth || slotRef.current.clientWidth);
      return {
        width: "126%", height: "151.2%", left: "-13%", top: "-25.6%",
        x: Number(sourceImage ? gsap.getProperty(sourceImage, "x") : 0) * ratio,
        scale: Number(sourceImage ? gsap.getProperty(sourceImage, "scale") : 1),
        filter: sourceImage ? getComputedStyle(sourceImage).filter : "none",
      };
    };
    const restore = () => { if (sourceFrame) sourceFrame.style.visibility = previousVisibility; };
    gsap.set(frame, { ...geometry(), transformOrigin: "0 0" });
    gsap.set(image, imageGeometry());
    if (sourceFrame) sourceFrame.style.visibility = "hidden";
    root.dataset.state = "opening";
    const intro = gsap.timeline({ onComplete: () => { root.dataset.state = "open"; } });
    intro.to(frame, { x: 0, y: 0, scale: 1, duration, ease: "power3.inOut" }, 0)
      .fromTo(veil, { opacity: 0 }, { opacity: 0.96, duration, ease: "power2.inOut" }, 0)
      .to(image, { width: "100%", height: "100%", left: "0%", top: "0%", x: 0, scale: 1, filter: "brightness(1)", duration, ease: "power3.inOut" }, 0)
      .fromTo(names, { yPercent: 112 }, { yPercent: 0, duration: duration * 0.7, stagger: 0.05, ease: "power3.out" }, duration * 0.45)
      .fromTo(reveals, { opacity: 0 }, { opacity: 1, duration: duration * 0.6, stagger: 0.035 }, duration * 0.55);
    root.querySelector("[data-testid='product-modal-close-button']")?.focus({ preventScroll: true });

    closeRef.current = () => {
      if (closing) return;
      closing = true;
      root.dataset.state = "closing";
      intro.kill();
      exit = gsap.timeline();
      exit.to(root, { scrollTop: 0, duration: root.scrollTop > 0 && !reduce ? 0.3 : 0 })
        .to([...reveals, ...names], { opacity: 0, duration: duration * 0.2 }, 0)
        .add(() => {
          exit.to(frame, { ...geometry(), duration: duration * 0.85, ease: "power3.inOut" })
            .to(image, { ...imageGeometry(), duration: duration * 0.85, ease: "power3.inOut" }, "<")
            .to(veil, { opacity: 0, duration: duration * 0.85, ease: "power2.inOut" }, "<")
            .call(() => { restore(); onClosed(); });
        });
    };
    return () => { intro.kill(); exit?.kill(); restore(); closeRef.current = null; };
  }, [rootRef, slotRef, frameRef, imageRef, sourceEl, onClosed]);
  return useCallback(() => closeRef.current?.(), []);
}