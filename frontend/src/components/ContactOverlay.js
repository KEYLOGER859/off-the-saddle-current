import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";

const TITLE = ["Let's make", "something", "that lasts."];

export const ContactOverlay = ({ open, onClose }) => {
  const ref = useRef(null);
  const first = useRef(true);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const root = ref.current;
    const lines = root.querySelectorAll(".contact__line-inner");
    const reveal = root.querySelectorAll(".contact__reveal");
    if (open) {
      gsap.set(root, { pointerEvents: "auto" });
      gsap.timeline()
        .to(root, { opacity: 1, duration: 0.7, ease: "power2.out" }, 0)
        .fromTo(lines, { yPercent: 115 }, { yPercent: 0, duration: 1.2, stagger: 0.09, ease: "expo.out" }, 0.15)
        .fromTo(reveal, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1, stagger: 0.07, ease: "power3.out" }, 0.6);
    } else if (!first.current) {
      gsap.timeline({ onComplete: () => gsap.set(root, { pointerEvents: "none" }) })
        .to(root, { opacity: 0, duration: 0.6, ease: "power2.inOut" }, 0);
    }
    first.current = false;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setSent(false);
      setForm({ name: "", email: "", message: "" });
    }
  }, [open]);

  const submit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="contact" ref={ref} data-testid="contact-overlay" aria-hidden={!open}>
      <button className="contact__close" onClick={onClose} data-testid="contact-close-button" data-cursor="link" type="button">
        Close <span className="contact__close-x">×</span>
      </button>

      <div className="contact__left">
        <span className="contact__eyebrow contact__reveal">Contact — OFF THE SADDLE</span>
        <h2 className="contact__title" data-testid="contact-title">
          {TITLE.map((l, i) => (
            <span className="contact__line" key={i}>
              <span className="contact__line-inner">
                {i === 2 ? <em>{l}</em> : l}
              </span>
            </span>
          ))}
        </h2>
        <dl className="contact__details">
          <div className="contact__row contact__reveal">
            <dt>Studio</dt>
            <dd>Jaipur · Rajasthan, India</dd>
          </div>
          <div className="contact__row contact__reveal">
            <dt>Enquiries</dt>
            <dd><a href="mailto:hello@offthesaddle.in" data-cursor="link" data-testid="contact-email">hello@offthesaddle.in</a></dd>
          </div>
          <div className="contact__row contact__reveal">
            <dt>WhatsApp</dt>
            <dd><a href="https://wa.me/919876543210" data-cursor="link">+91 98765 43210</a></dd>
          </div>
          <div className="contact__row contact__reveal">
            <dt>Instagram</dt>
            <dd><a href="https://instagram.com" target="_blank" rel="noreferrer" data-cursor="link">@offthesaddle</a></dd>
          </div>
        </dl>
      </div>

      <div className="contact__right">
        {sent ? (
          <p className="contact__sent contact__reveal" data-testid="contact-sent-message">
            Thank you, {form.name ? form.name.split(" ")[0] : "friend"}. <span>We will be in touch soon.</span>
          </p>
        ) : (
          <form className="contact__form" onSubmit={submit} data-testid="contact-form">
            <div className="contact__field contact__reveal">
              <label htmlFor="c-name">Your name</label>
              <input id="c-name" type="text" placeholder="Ada Lovelace" value={form.name} onChange={set("name")} required data-testid="contact-name-input" />
            </div>
            <div className="contact__field contact__reveal">
              <label htmlFor="c-email">Email</label>
              <input id="c-email" type="email" placeholder="you@studio.com" value={form.email} onChange={set("email")} required data-testid="contact-email-input" />
            </div>
            <div className="contact__field contact__reveal">
              <label htmlFor="c-message">Tell us about the piece</label>
              <textarea id="c-message" placeholder="A commission, a question, a collaboration…" value={form.message} onChange={set("message")} required data-testid="contact-message-input" />
            </div>
            <button className="contact__send contact__reveal" type="submit" data-cursor="link" data-testid="contact-send-button">
              Send message <span aria-hidden>→</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
