import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import "@/components/MenuOverlay.css";

const LINKS = ["Chronicles", "Makers", "Journal", "About", "Contact"];

export const MenuOverlay = ({ open, onClose, onContact, onChronicles }) => {
  const ref = useRef(null);
  const first = useRef(true);
  const tlRef = useRef(null);

  useEffect(() => {
    const root = ref.current;
    const inner = root.querySelectorAll(".menu__line-inner");
    const meta = root.querySelectorAll(".menu__meta");
    root.inert = !open;
    tlRef.current?.kill();

    if (open) {
      gsap.set(root, { pointerEvents: "auto" });
      const tl = gsap.timeline();
      tl.set(inner, { yPercent: 110 })
        .to(root, { opacity: 1, duration: 0.55, ease: "power2.out" }, 0)
        .to(inner, { yPercent: 0, duration: 1.1, stagger: 0.07, ease: "expo.out" }, 0.1)
        .fromTo(meta, { opacity: 0 }, { opacity: 1, duration: 0.9, stagger: 0.08 }, 0.5);
      tlRef.current = tl;
    } else if (!first.current) {
      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(root, { pointerEvents: "none" });
          gsap.set(inner, { yPercent: 110 });
        },
      });
      tl.to(inner, { yPercent: -110, duration: 0.5, stagger: 0.04, ease: "power3.in" }, 0)
        .to(root, { opacity: 0, duration: 0.5, ease: "power2.inOut" }, 0.22);
      tlRef.current = tl;
    }
    first.current = false;
    return () => tlRef.current?.kill();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleClick = (e, label) => {
    e.preventDefault();
    if (label === "Contact") onContact();
    else if (label === "Chronicles") onChronicles();
    else onClose();
  };

  return (
    <div className="menu" ref={ref} data-testid="menu-overlay" aria-hidden={!open}>
      <button className="menu__close" onClick={onClose} data-testid="menu-overlay-close-button" data-cursor="link" type="button">
        Close ×
      </button>
      <div className="menu__brand" data-testid="menu-brand">
        <img src="/images/menu-logo.png" alt="OFF THE SADDLE" width="988" height="1280" data-testid="menu-logo" />
      </div>
      <nav className="menu__nav">
        {LINKS.map((l, i) => (
          <a
            key={l}
            href="#"
            className={`menu__link ${i === 0 ? "is-current" : ""}`}
            data-testid={`menu-link-${l.toLowerCase()}`}
            data-cursor="link"
            onClick={(e) => handleClick(e, l)}
          >
            <span className="menu__num">0{i + 1}</span>
            <span className="menu__line"><span className="menu__line-inner">{l}</span></span>
          </a>
        ))}
      </nav>
      <div className="menu__foot">
        <span className="menu__eyebrow" data-testid="menu-navigation-label">Navigation</span>
        <span className="menu__meta">Objects made by hand across India</span>
        <a className="menu__meta menu__instagram" href="https://www.instagram.com/offthesaddle_/" target="_blank" rel="noopener noreferrer" data-testid="menu-instagram-link" data-cursor="open">@offthesaddle_ <span aria-hidden="true">↗</span></a>
      </div>
    </div>
  );
};
