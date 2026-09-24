import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { ExhibitionObject } from "@/components/ExhibitionObject";
import { createChronicleField } from "@/lib/chronicleField";
import { createChronicleMotion } from "@/lib/chronicleMotion";
import { createChronicleHover } from "@/lib/chronicleHover";

export const Exhibition = forwardRef(function Exhibition(
  { products, onActiveChange, onDragChange, onOpen, dimmed }, ref
) {
  const stageRef = useRef(null);
  const proxyRef = useRef(null);
  const itemRefs = useRef([]);
  const imgRefs = useRef([]);
  const motionRef = useRef(null);
  const hoverRef = useRef(null);
  const blockedRef = useRef(dimmed);
  blockedRef.current = dimmed;

  useImperativeHandle(ref, () => ({
    glideTo: (index, options) => motionRef.current?.glideTo(index, options),
  }), []);

  useEffect(() => {
    const stage = stageRef.current;
    const proxy = proxyRef.current;
    // React clears callback refs before passive-effect cleanup. Keep a snapshot
    // so animation teardown never reads the subsequently nulled ref array.
    const items = [...itemRefs.current];
    const images = [...imgRefs.current];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const field = createChronicleField(stage, items, images, onActiveChange);
    const hover = createChronicleHover(stage, items, images, field, () => blockedRef.current, reducedMotion);
    hoverRef.current = hover;
    const motion = createChronicleMotion({
      stage, proxy, field, reducedMotion, onDragChange, onOpen, onInteract: hover.clear,
      isBlocked: () => blockedRef.current,
    });
    motionRef.current = motion;
    const tick = () => field.render(Number(gsap.getProperty(proxy, "x")), reducedMotion.matches);
    const resize = new ResizeObserver(() => motion.resize());
    resize.observe(stage);
    motion.resize();
    tick();
    gsap.ticker.add(tick);
    stage.focus({ preventScroll: true });

    return () => {
      resize.disconnect();
      gsap.ticker.remove(tick);
      motion.destroy();
      hover.destroy();
      field.destroy();
      motionRef.current = null;
    };
  }, [products, onActiveChange, onDragChange, onOpen]);

  useEffect(() => {
    motionRef.current?.setBlocked(dimmed);
    if (dimmed) hoverRef.current?.clear();
  }, [dimmed]);

  return (
    <>
      <div ref={proxyRef} className="ex-proxy" aria-hidden="true" />
      <section
        ref={stageRef}
        className="ex-stage"
        data-testid="spatial-canvas"
        aria-label="Chronicles — six jewellery objects"
        aria-roledescription="horizontal photographic exhibition"
        tabIndex={0}
      >
        {products.map((product, index) => (
          <ExhibitionObject
            key={product.id}
            product={product}
            index={index}
            onOpen={onOpen}
            ref={(el) => (itemRefs.current[index] = el)}
            imgRef={(el) => (imgRefs.current[index] = el)}
          />
        ))}
      </section>
    </>
  );
});