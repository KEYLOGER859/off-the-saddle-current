import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { HOME_HERO } from "@/data/home";

export const Hero = ({ onExplore }) => {
  const rootRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero__reveal", {
        yPercent: 120,
        duration: 1.35,
        stagger: 0.11,
        ease: "expo.out",
        delay: 0.35,
      });
      gsap.from(".hero__fade", {
        opacity: 0,
        y: 22,
        duration: 1.2,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.95,
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="hero" ref={rootRef} data-testid="home-hero" style={{ "--hero-position": HOME_HERO.position, "--hero-mobile-position": HOME_HERO.mobilePosition }}>
      <div className="hero__bg" aria-hidden>
        <img src={HOME_HERO.src} alt={HOME_HERO.alt} className="hero__img" draggable={false} fetchPriority="high" data-testid="home-hero-image" />
        <div className="hero__scrim" />
      </div>

      <div className="hero__content">
        <h1 className="hero__title" data-testid="hero-title">
          <span className="hero__line"><span className="hero__reveal">India</span></span>
          <span className="hero__line"><span className="hero__reveal">lives in</span></span>
          <span className="hero__line"><span className="hero__reveal"><em>detail.</em></span></span>
        </h1>
        <div className="hero__rule hero__fade" aria-hidden />
        <p className="hero__sub hero__fade">
          Jewellery inspired by land, stories and the hands that keep them alive.
        </p>
        <button
          className="hero__explore hero__fade"
          onClick={onExplore}
          data-testid="hero-explore-button"
          data-cursor="link"
          type="button"
        >
          <span className="hero__explore-dot" aria-hidden />
          <span className="hero__explore-text">Explore<br />our collection</span>
        </button>
      </div>

      <p className="hero__aside hero__fade" data-testid="hero-aside">
        Objects carry <em>People.</em>
      </p>
    </section>
  );
};
