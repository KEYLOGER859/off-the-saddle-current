import { gsap, Draggable } from "@/lib/gsap";

// Local, transform-only motion. No document scroll, Lenis instance, snap points or clones.
export function createChronicleMotion({ stage, proxy, field, reducedMotion, onDragChange, isBlocked, onOpen, onInteract }) {
  let target = 0, wheelTween = null;
  const current = () => Number(gsap.getProperty(proxy, "x"));
  const stop = () => {
    wheelTween?.kill();
    wheelTween = null;
    draggable.tween?.kill();
    target = current();
  };
  const glide = (x, immediate = false) => {
    onInteract?.();
    field.clearIdentity();
    wheelTween?.kill();
    draggable.tween?.kill();
    target = x;
    if (immediate) gsap.set(proxy, { x });
    else wheelTween = gsap.to(proxy, {
      x, duration: reducedMotion.matches ? 0.16 : 0.72, ease: "power3.out",
      onComplete: () => { wheelTween = null; },
    });
  };
  const [draggable] = Draggable.create(proxy, {
    type: "x", trigger: stage, inertia: !reducedMotion.matches,
    dragResistance: 0.12, throwResistance: 1050,
    minDuration: 0.15, maxDuration: 1.8, minimumMovement: 3,
    allowNativeTouchScrolling: false, allowContextMenu: true,
    onPressInit() { stop(); },
    onPress() {
      onInteract?.();
      field.clearIdentity();
      stage.focus({ preventScroll: true });
      stage.classList.add("is-dragging");
      onDragChange(true);
    },
    onRelease() {
      stage.classList.remove("is-dragging");
      onDragChange(false);
    },
    onClick(event) {
      if (isBlocked() || event.target.closest?.("button")) return;
      const item = event.target.closest?.("[data-object-id]");
      if (item) { stop(); onOpen?.(item.dataset.objectId, item); }
    },
  });

  const onWheel = (event) => {
    if (isBlocked() || event.ctrlKey) return;
    event.preventDefault();
    event.stopPropagation();
    if (draggable.isPressed) return;
    const unit = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? stage.clientHeight : 1;
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    const base = wheelTween?.isActive() ? target : current();
    glide(base - gsap.utils.clamp(-field.width * 0.85, field.width * 0.85, delta * unit));
  };
  const onKey = (event) => {
    if (isBlocked() || event.altKey || event.metaKey || event.ctrlKey) return;
    if (event.key === "Enter" || event.key === " ") {
      const item = event.target.closest?.("[data-object-id]") || stage.querySelector("[data-focused='true']");
      if (item && !event.target.closest("button")) {
        event.preventDefault();
        stop();
        onOpen?.(item.dataset.objectId, item);
      }
      return;
    }
    const direction = { ArrowRight: -1, ArrowLeft: 1 }[event.key];
    if (!direction) return;
    event.preventDefault();
    const base = wheelTween?.isActive() ? target : current();
    glide(base + direction * field.width * 0.36);
  };
  const onBlur = () => {
    draggable.endDrag();
    stop();
    stage.classList.remove("is-dragging");
    onDragChange(false);
  };
  const onMotionPreference = () => {
    stop();
    draggable.vars.inertia = !reducedMotion.matches;
  };
  stage.addEventListener("wheel", onWheel, { passive: false });
  stage.addEventListener("keydown", onKey);
  window.addEventListener("blur", onBlur);
  reducedMotion.addEventListener("change", onMotionPreference);

  return {
    glideTo: (index, options = {}) => glide(field.centerOffset(index, current()), options.immediate),
    resize() {
      onInteract?.();
      const oldPeriod = field.period;
      const phase = oldPeriod ? current() / oldPeriod : 0;
      onBlur();
      field.measure();
      gsap.set(proxy, { x: phase * field.period });
      draggable.update();
    },
    setBlocked(blocked) {
      if (blocked) { onBlur(); draggable.disable(); }
      else draggable.enable();
    },
    destroy() {
      stop();
      draggable.kill();
      onDragChange(false);
      stage.removeEventListener("wheel", onWheel);
      stage.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", onBlur);
      reducedMotion.removeEventListener("change", onMotionPreference);
    },
  };
}