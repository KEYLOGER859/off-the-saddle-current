import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { getProductPhotos } from "@/lib/productMedia";
import { useProductTransition } from "@/lib/useProductTransition";
import { ProductStoryInfo } from "@/components/ProductStoryInfo";
import "@/components/ProductView.css";

export const ProductView = ({ product, index, sourceEl, onClosed, onAddToBag }) => {
  const rootRef = useRef(null), slotRef = useRef(null), frameRef = useRef(null), imageRef = useRef(null);
  const photos = getProductPhotos(product);
  const close = useProductTransition({ rootRef, slotRef, frameRef, imageRef, sourceEl, onClosed });
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") { event.preventDefault(); event.stopImmediatePropagation(); close(); }
      if (event.key !== "Tab") return;
      const focusable = [...rootRef.current.querySelectorAll("button:not(:disabled), [href], [tabindex='0']")];
      const current = focusable.indexOf(document.activeElement);
      const next = (current + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length;
      event.preventDefault();
      focusable[next]?.focus();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [close]);
  return (
    <section className="story-view" ref={rootRef} role="dialog" aria-modal="true" aria-labelledby="product-story-title" data-testid="product-detail-modal">
      <div className="story-view__veil" aria-hidden="true" />
      <button className="story-view__close story-reveal" type="button" onClick={close} data-testid="product-modal-close-button" data-cursor="close"><span>Return to Chronicles</span><X size={18} strokeWidth={1} aria-hidden="true" /></button>
      <div className="story-view__lead">
        <div className="story-view__media">
          <div className="story-hero-slot" ref={slotRef} data-testid="product-hero-slot">
            <div className="story-hero" ref={frameRef} data-testid="product-hero-frame">
              <img ref={imageRef} src={photos[0].src} alt={photos[0].alt || product.name} draggable={false} data-testid="product-detail-image" />
            </div>
          </div>
        </div>
        <ProductStoryInfo product={product} index={index} onAddToBag={onAddToBag} />
      </div>
      {photos.length > 1 && <div className="story-view__photographs" data-testid="product-additional-photographs">
        {photos.slice(1).map((photo, i) => <figure key={photo.src} className="story-photograph" data-testid={`product-photograph-${i + 2}`}>
          <img src={photo.src} alt={photo.alt || `${product.name}, photograph ${i + 2}`} loading="lazy" decoding="async" data-testid={`product-photograph-image-${i + 2}`} />
          {photo.caption && <figcaption data-testid={`product-photograph-caption-${i + 2}`}>{photo.caption}</figcaption>}
        </figure>)}
      </div>}
    </section>
  );
};