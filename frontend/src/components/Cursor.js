import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import "@/components/Cursor.css";

const LABELS = { view: "View", drag: "Drag", open: "Open", add: "Add", close: "Close" };

export const Cursor = ({ dragging }) => {
  const rootRef = useRef(null), shapeRef = useRef(null), dotRef = useRef(null), labelRef = useRef(null);
  const modeRef = useRef("default");
  const [mode, setMode] = useState("default");
  const finalMode = dragging ? "drag" : mode;

  useEffect(() => {
    const root = rootRef.current;
    const x = gsap.quickTo(root, "x", { duration: 0.12, ease: "power3.out" });
    const y = gsap.quickTo(root, "y", { duration: 0.12, ease: "power3.out" });
    const resolve = (event) => {
      const next = event.target.closest?.("[data-cursor]")?.dataset.cursor || "default";
      if (next !== modeRef.current) { modeRef.current = next; setMode(next); }
    };
    const move = (event) => {
      if (event.pointerType === "touch") return;
      x(event.clientX); y(event.clientY);
      root.style.opacity = "1";
      resolve(event);
    };
    const leave = () => { root.style.opacity = "0"; };
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerover", resolve);
    document.documentElement.addEventListener("mouseleave", leave);
    window.addEventListener("blur", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", resolve);
      document.documentElement.removeEventListener("mouseleave", leave);
      window.removeEventListener("blur", leave);
      x.tween.kill(); y.tween.kill();
    };
  }, []);

  useEffect(() => {
    const action = !!LABELS[finalMode];
    const size = finalMode === "object" ? 34 : finalMode === "link" ? 26 : 20;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 0.32;
    const targets = [shapeRef.current, dotRef.current, labelRef.current];
    gsap.to(shapeRef.current, { width: action ? 66 : size, height: action ? 28 : size, borderRadius: action ? 14 : size / 2, backgroundColor: action ? "#c4653a" : "rgba(196,101,58,0.04)", duration, ease: "power3.out", overwrite: true });
    gsap.to(dotRef.current, { opacity: action ? 0 : 1, duration: duration * 0.65 });
    gsap.to(labelRef.current, { opacity: action ? 1 : 0, duration: duration * 0.65 });
    return () => gsap.killTweensOf(targets);
  }, [finalMode]);

  return (
    <div ref={rootRef} className="nucleus-cursor" aria-hidden="true" data-testid="custom-cursor" data-mode={finalMode}>
      <span ref={shapeRef} className="nucleus-cursor__shape" data-testid="cursor-shape">
        <span ref={dotRef} className="nucleus-cursor__dot" />
        <span ref={labelRef} className="nucleus-cursor__label" data-testid="cursor-action">{LABELS[finalMode] || ""}</span>
      </span>
    </div>
  );
};