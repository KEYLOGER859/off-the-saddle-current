import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { CONTACT, IMAGES, IMPACT } from "@/data/assets";

const SYMBOLS = ["◌", "↺", "✦", "∿", "⌁"];

export const Footer = () => {
  const rootRef = useRef(null);
  const sheetRef = useRef(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const sheet = sheetRef.current;
    if (!root || !sheet) return undefined;

    const ctx = gsap.context(() => {
      const reveal = gsap.utils.toArray(".footer__reveal");
      const claims = gsap.utils.toArray(".footer__claim");
      // Footer content enters progressively as the sheet rises over the hero.
      const transition = { trigger: root, start: "top 92%", end: "top 20%", scrub: 1 };

      gsap.fromTo(
        reveal,
        { y: 80, opacity: 0 },
        { y: 0, opacity: 1, ease: "none", stagger: 0.05, scrollTrigger: transition }
      );
      gsap.fromTo(
        claims,
        { x: 40, opacity: 0 },
        { x: 0, opacity: 1, ease: "none", stagger: 0.07, scrollTrigger: transition }
      );
    }, root);

    return () => {
      ctx.revert();
      ScrollTrigger.refresh();
    };
  }, []);

  const submit = (event) => {
    event.preventDefault();
    setJoined(true);
  };

  return (
    <footer className="footer-reveal" ref={rootRef} data-testid="site-footer">
      <div className="footer__sheet" ref={sheetRef}>
        <div className="footer__edge" aria-hidden="true" />
        <div className="footer__intro">
          <div className="footer__copy">
            <span className="footer__eyebrow footer__reveal">A slower way to make</span>
            <h2 className="footer__title footer__reveal">Objects with<br /><em>memory.</em></h2>
            <p className="footer__lede footer__reveal">
              Reclaimed metals, named makers, and pieces that are allowed to show the hand that made them.
            </p>
            <div className="footer__stamps footer__reveal" aria-label="Our studio commitments">
              <span>Made in India</span>
              <span>Small batch</span>
              <span>Low waste</span>
            </div>
          </div>
          <div className="footer__image-wrap footer__reveal">
            <img src={IMAGES.hands} alt="Artisan hands shaping a piece in warm studio light" className="footer__image" />
            <span className="footer__image-note">Hands / Jaipur, Rajasthan</span>
          </div>
        </div>

        <div className="footer__claims">
          <div className="footer__claims-head footer__reveal">
            <span className="footer__eyebrow">What we stand behind</span>
            <span className="footer__claims-count">05 commitments</span>
          </div>
          <div className="footer__claim-grid">
            {IMPACT.map((claim, index) => (
              <article className="footer__claim" key={claim.title}>
                <span className="footer__claim-symbol" aria-hidden="true">{SYMBOLS[index]}</span>
                <h3>{claim.title}</h3>
                <p>{claim.body}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="footer__lower">
          <div className="footer__contact footer__reveal">
            <span className="footer__eyebrow">Studio notes</span>
            <a href={`mailto:${CONTACT.email}`} data-cursor="link">{CONTACT.email}</a>
            <a href={`https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}`} data-cursor="link">WhatsApp {CONTACT.whatsapp}</a>
            <span>{CONTACT.location}</span>
          </div>
          <div className="footer__newsletter footer__reveal">
            <span className="footer__eyebrow">Occasional letters from the studio</span>
            {joined ? (
              <p className="footer__joined">You are on the list. <em>Thank you.</em></p>
            ) : (
              <form onSubmit={submit} className="footer__form">
                <label className="sr-only" htmlFor="footer-email">Email address</label>
                <input id="footer-email" type="email" placeholder="Your email address" required />
                <button type="submit" data-cursor="link">Join <span aria-hidden="true">↗</span></button>
              </form>
            )}
          </div>
        </div>

        <div className="footer__base footer__reveal">
          <span>© {new Date().getFullYear()} Off The Saddle</span>
          <span>Jewellery for the long way home</span>
          <span>Jaipur / India</span>
        </div>
      </div>
    </footer>
  );
};
