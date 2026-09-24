import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { Hero } from "@/components/Hero";
import { Footer } from "@/components/Footer";
import "@/components/Home.css";

export const Home = ({ onExplore }) => {
  const rootRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const img = rootRef.current.querySelector(".hero__img");
      const content = rootRef.current.querySelector(".hero__content");
      const aside = rootRef.current.querySelector(".hero__aside");
      const footer = rootRef.current.querySelector(".footer-reveal");
      if (!footer) return;

      // Hero image holds behind, drifting slower than the rising footer (depth).
      gsap.fromTo(
        img,
        { yPercent: 0, scale: 1 },
        {
          yPercent: 12,
          scale: 1.08,
          ease: "none",
          scrollTrigger: { trigger: footer, start: "top bottom", end: "top top", scrub: true },
        }
      );
      // Hero copy fades as the footer sheet slides up over it.
      gsap.to([content, aside], {
        opacity: 0,
        y: -46,
        ease: "none",
        scrollTrigger: { trigger: footer, start: "top bottom", end: "top 40%", scrub: true },
      });
    }, rootRef);

    const t = setTimeout(() => ScrollTrigger.refresh(), 200);
    return () => {
      clearTimeout(t);
      ctx.revert();
    };
  }, []);

  return (
    <div className="home" ref={rootRef} data-testid="home-view">
      <Hero onExplore={onExplore} />
      <Footer />
    </div>
  );
};
