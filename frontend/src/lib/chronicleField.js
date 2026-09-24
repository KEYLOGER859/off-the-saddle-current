import { gsap } from "@/lib/gsap";

// One aligned editorial strip. Only X changes during exploration, for both the
// six persistent frames and their oversized photographs. No depth, scale or Y animation.
const wrap = (value, period) => ((value % period) + period) % period;

export function createChronicleField(stage, items, images, onActiveChange) {
  const setters = items.map((item, i) => ({
    x: gsap.quickSetter(item, "x", "px"),
    imageX: gsap.quickSetter(images[i], "x", "px"),
  }));
  let width = 0, period = 0, guard = 0, active = -1, focusX = 0;
  let positions = [], lastOffset = NaN, lastReducedMotion;
  const hover = items.map(() => ({ amount: 0 }));

  const measure = () => {
    width = stage.clientWidth;
    const height = stage.clientHeight;
    const compact = width <= 600;
    const top = width <= 900 ? 108 : 126;
    const bottom = compact ? 40 : 44;
    const available = Math.max(80, height - top - bottom);
    const h = Math.min(available, width);
    const w = h * 0.8;
    const y = top + (available - h) / 2;
    focusX = width / 2;
    guard = w / 2 + 64;
    const gap = Math.max(compact ? 28 : 64, width * (compact ? 0.08 : 0.09));
    // Equal spacing also includes the 06 → 01 boundary. Both recycling ends are
    // entirely outside the viewport, with no duplicate elements or scroll reset.
    const step = Math.max(w + gap, (width + guard * 2 + 160) / items.length);
    period = step * items.length;
    positions = items.map((item, index) => {
      gsap.set(item, { width: w, height: h, y, scale: 1, rotation: 0, opacity: 1, zIndex: 1 });
      gsap.set(images[index], { y: 0 });
      return { w, center: focusX + index * step };
    });
    lastOffset = NaN;
  };

  const clearIdentity = () => items.forEach((item) => item.classList.remove("is-inspected"));

  const render = (offset, reducedMotion) => {
    if (!period || (lastOffset === offset && lastReducedMotion === reducedMotion)) return;
    lastOffset = offset;
    lastReducedMotion = reducedMotion;
    let closest = 0, distance = Infinity;
    positions.forEach((p, index) => {
      const center = wrap(p.center + offset + guard, period) - guard;
      const fromFocus = center - focusX;
      const relative = gsap.utils.clamp(-1, 1, fromFocus / (p.w * 1.12));
      setters[index].x(center - p.w / 2);
      // Counter-travel makes the photograph move slightly slower than its frame.
      // 10–11.8% visible counter-travel stays within the photograph's 13% overscan.
      setters[index].imageX(reducedMotion ? 0 : -relative * p.w * (0.10 + hover[index].amount * 0.018));
      if (Math.abs(fromFocus) < distance) { closest = index; distance = Math.abs(fromFocus); }
    });
    if (closest !== active) {
      active = closest;
      items.forEach((item, index) => {
        item.classList.toggle("is-focus", index === closest);
        item.dataset.focused = String(index === closest);
        item.tabIndex = index === closest ? 0 : -1;
      });
      stage.dataset.focusedObject = items[closest].dataset.objectId;
      onActiveChange?.(closest);
    }
  };

  return {
    measure, render, clearIdentity,
    setHover(index) {
      hover.forEach((state, i) => gsap.to(state, {
        amount: i === index ? 1 : 0, duration: 0.45, overwrite: true,
        onUpdate: () => { lastOffset = NaN; },
      }));
    },
    destroy() { hover.forEach((state) => gsap.killTweensOf(state)); },
    inspect(item) {
      const inspected = item.classList.contains("is-inspected");
      clearIdentity();
      if (!inspected) item.classList.add("is-inspected");
    },
    get period() { return period; },
    get width() { return width; },
    centerOffset(index, offset) {
      const destination = focusX - positions[index].center;
      return offset + wrap(destination - offset + period / 2, period) - period / 2;
    },
  };
}