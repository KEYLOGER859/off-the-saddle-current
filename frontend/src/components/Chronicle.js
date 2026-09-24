import { useCallback, useEffect, useRef, useState } from "react";
import { products } from "@/data/products";
import { Exhibition } from "@/components/Exhibition";
import { BottomUI } from "@/components/BottomUI";
import { ProductView } from "@/components/ProductView";
import "@/components/Chronicle.css";

// The exhibition contains six objects; shared product data is left intact.
const chronicles = products.slice(0, 6);

export const Chronicle = ({ open, overlayDimmed, onClose, onDragChange, onAddToBag }) => {
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const rootRef = useRef(null);
  const exhibitionRef = useRef(null);
  const viewingRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewing, setViewing] = useState(null);

  const openProduct = useCallback((id, sourceEl) => {
    if (viewingRef.current) return;
    const index = chronicles.findIndex((product) => product.id === id);
    if (index < 0) return;
    const next = { product: chronicles[index], index, sourceEl };
    viewingRef.current = next;
    setViewing(next);
  }, []);
  const closeProduct = useCallback(() => {
    const source = viewingRef.current?.sourceEl;
    viewingRef.current = null;
    setViewing(null);
    requestAnimationFrame(() => source?.focus({ preventScroll: true }));
  }, []);
  const selectIndex = useCallback((index) => exhibitionRef.current?.glideTo(index), []);

  useEffect(() => {
    if (open) {
      setMounted(true);
      document.documentElement.classList.add("no-scroll");
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }
    setShown(false);
    document.documentElement.classList.remove("no-scroll");
    const t = setTimeout(() => {
      setMounted(false);
      viewingRef.current = null;
      setViewing(null);
    }, 760);
    return () => clearTimeout(t);
  }, [open]);

  const handleDrag = useCallback(
    (d) => {
      onDragChange?.(d);
    },
    [onDragChange]
  );

  useEffect(() => {
    if (!rootRef.current) return;
    rootRef.current.inert = !open || !!overlayDimmed || !!viewing;
    if (open && !overlayDimmed && !viewing) rootRef.current.querySelector(".ex-stage")?.focus({ preventScroll: true });
  }, [open, overlayDimmed, mounted, viewing]);

  useEffect(() => () => document.documentElement.classList.remove("no-scroll"), []);

  if (!mounted) return null;

  return (
    <>
      <div ref={rootRef} className={`chronicle ${shown ? "is-open" : ""}`} data-testid="chronicle-view" aria-hidden={!open || !!overlayDimmed}>
        <button
          className="chronicle__close"
          onClick={onClose}
          data-testid="chronicle-close-button"
          data-cursor="link"
          type="button"
        >
          <span className="chronicle__close-x" aria-hidden>↑</span> Back home
        </button>
        <Exhibition
          ref={exhibitionRef}
          products={chronicles}
          onActiveChange={setActiveIndex}
          onOpen={openProduct}
          onDragChange={handleDrag}
          dimmed={!open || overlayDimmed || !!viewing}
        />
        <BottomUI index={activeIndex} total={chronicles.length} onSelect={selectIndex} hidden={!!viewing || overlayDimmed} />
      </div>
      {viewing && <ProductView product={viewing.product} index={viewing.index} sourceEl={viewing.sourceEl} onClosed={closeProduct} onAddToBag={onAddToBag} />}
    </>
  );
};
