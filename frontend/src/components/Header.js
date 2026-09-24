import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { pad } from "@/data/products";

export const Header = ({ bagCount, menuOpen, chronicleOpen, onMenu, onBag, onHome }) => {
  const countRef = useRef(null);
  const rootRef = useRef(null);
  const [nearTop, setNearTop] = useState(true);

  useEffect(() => {
    gsap.fromTo(
      rootRef.current.children,
      { y: -14, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.4, stagger: 0.08, delay: 0.5 }
    );
  }, []);

  useEffect(() => {
    if (!bagCount) return;
    gsap.fromTo(countRef.current, { y: 8 }, { y: 0, duration: 0.9 });
  }, [bagCount]);

  useEffect(() => {
    const onScroll = () => setNearTop(window.scrollY < window.innerHeight * 0.55);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Dark ink text only while the bright hero is in view on the home page.
  const isDark = nearTop && !chronicleOpen;

  return (
    <header className={`hdr ${isDark ? "hdr--dark" : ""}`} ref={rootRef}>
      <button className="hdr__logo" onClick={onHome} data-testid="header-logo" data-cursor="link" aria-label="OFF THE SADDLE — home" type="button">
        <img src="/logo.png" alt="OFF THE SADDLE" />
      </button>
      <div className="hdr__title" data-testid="header-exhibition-title">
        <span>OFF THE SADDLE</span>
        <span className="hdr__title-sub">Artisan jewellery, India</span>
      </div>
      <nav className="hdr__nav">
        <button className="hdr__btn" onClick={onBag} data-testid="header-bag-button" data-cursor="link" type="button">
          Bag <span ref={countRef} className="hdr__count" data-testid="header-bag-count">{pad(bagCount)}</span>
        </button>
        <button className={`hdr__btn hdr__menu-btn ${menuOpen ? "is-open" : ""}`} onClick={onMenu} data-testid="header-menu-button" data-cursor="link" type="button" aria-label="Open menu">
          <span className="hdr__menu-lines" aria-hidden="true"><span /><span /></span>
        </button>
      </nav>
    </header>
  );
};
