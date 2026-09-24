import { forwardRef } from "react";
import { pad } from "@/data/products";
import { ArrowUpRight } from "lucide-react";

export const ExhibitionObject = forwardRef(function ExhibitionObject(
  { product, index, imgRef, onOpen }, ref
) {
  return (
    <article
      ref={ref}
      className="obj"
      data-object-id={product.id}
      data-testid={`object-card-${product.id}`}
      aria-labelledby={`chronicle-name-${product.id}`}
      tabIndex={-1}
      data-cursor="object"
    >
      <div className="obj__frame" data-testid={`object-frame-${product.id}`}>
        <img
          ref={imgRef}
          className="obj__img"
          src={product.image}
          alt={product.name}
          width={848}
          height={1264}
          decoding="async"
          loading="eager"
          draggable={false}
          data-testid={`object-image-${product.id}`}
        />
      </div>
      <div className="obj__identity" data-testid={`object-metadata-${product.id}`}>
        <span className="obj__number" data-testid={`object-number-${product.id}`}>{pad(index + 1)}</span>
        <div>
          <h2 id={`chronicle-name-${product.id}`} data-testid={`object-name-${product.id}`}><span className="obj__name-inner">{product.name}</span></h2>
          <p data-testid={`object-place-${product.id}`}>{product.place}</p>
        </div>
      </div>
      <button className="obj__open" type="button" aria-label={`View ${product.name}`} data-testid={`object-open-${product.id}`} data-cursor="view" onClick={(event) => {
        event.stopPropagation();
        onOpen?.(product.id, event.currentTarget.closest("[data-object-id]"));
      }} tabIndex={-1}>
        <ArrowUpRight size={22} strokeWidth={1} aria-hidden="true" />
      </button>
    </article>
  );
});