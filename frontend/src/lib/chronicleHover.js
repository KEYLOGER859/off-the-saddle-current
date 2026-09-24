import { gsap } from "@/lib/gsap";

export function createChronicleHover(stage, items, images, field, isBlocked, reducedMotion) {
  let current = -1;
  // Reset the CSS translation before using GSAP's percentage-based mask reveal.
  items.forEach((item) => gsap.set(item.querySelector(".obj__name-inner"), { y: 0, yPercent: 112 }));
  const set = (index) => {
    if (index === current) return;
    current = index;
    field.setHover(index);
    items.forEach((item, i) => {
      const selected = i === index;
      item.classList.toggle("is-hovered", selected);
      const identity = item.querySelector(".obj__identity");
      const name = item.querySelector(".obj__name-inner");
      const action = item.querySelector(".obj__open");
      const duration = reducedMotion.matches ? 0 : 0.5;
      gsap.to(item, { opacity: index < 0 || selected ? 1 : 0.65, duration, overwrite: "auto" });
      gsap.to(images[i], { scale: selected ? 1.025 : 1, filter: selected ? "brightness(1.04)" : "brightness(0.94)", duration, overwrite: "auto" });
      gsap.to(identity, { opacity: selected ? 1 : 0, duration: duration * 0.6, overwrite: true });
      gsap.to(name, { yPercent: selected ? 0 : 112, duration: selected ? duration * 1.3 : duration * 0.5, ease: "power3.out", overwrite: true });
      gsap.to(action, { opacity: selected ? 1 : 0, x: selected ? 0 : -8, duration, overwrite: true });
    });
  };
  const resolve = (event) => {
    if (isBlocked() || stage.classList.contains("is-dragging")) return;
    const item = event.target.closest?.("[data-object-id]");
    set(item ? items.indexOf(item) : -1);
  };
  const leave = () => set(-1);
  const focusOut = (event) => {
    if (!stage.contains(event.relatedTarget)) leave();
  };
  stage.addEventListener("pointerover", resolve);
  stage.addEventListener("pointerleave", leave);
  stage.addEventListener("focusin", resolve);
  stage.addEventListener("focusout", focusOut);
  return {
    clear: leave,
    destroy() {
      stage.removeEventListener("pointerover", resolve);
      stage.removeEventListener("pointerleave", leave);
      stage.removeEventListener("focusin", resolve);
      stage.removeEventListener("focusout", focusOut);
      items.forEach((item, i) => gsap.killTweensOf([item, images[i], ...item.querySelectorAll(".obj__identity, .obj__name-inner, .obj__open")]));
    },
  };
}