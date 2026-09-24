import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { formatPrice, pad } from "@/data/products";

export const ProductStoryInfo = ({ product, index, onAddToBag }) => {
  const [added, setAdded] = useState(false);
  const timerRef = useRef(null);
  useEffect(() => () => clearTimeout(timerRef.current), []);
  const add = () => {
    if (added) return;
    onAddToBag(product);
    setAdded(true);
    timerRef.current = setTimeout(() => setAdded(false), 1800);
  };
  return (
    <aside className="story-info" data-testid="product-story-info">
      <p className="story-info__eyebrow story-reveal" data-testid="product-detail-number">Chronicle {pad(index + 1)}</p>
      <h1 className="story-info__name" id="product-story-title" data-testid="product-detail-name">
        {product.name.split(" ").map((word, i) => <span className="story-name-mask" key={i}><span className="story-name-inner">{word}</span></span>)}
      </h1>
      <dl className="story-info__specs story-reveal">
        <div><dt>Origin</dt><dd data-testid="product-detail-place">{product.place}</dd></div>
        <div><dt>Material</dt><dd data-testid="product-detail-material">{product.material}</dd></div>
        <div><dt>Made by</dt><dd data-testid="product-detail-maker">{product.maker}</dd></div>
      </dl>
      <p className="story-info__description story-reveal" data-testid="product-detail-story">{product.story}</p>
      <div className="story-info__purchase story-reveal">
        <span className="story-info__price" data-testid="product-detail-price">{formatPrice(product.price)}</span>
        <button className="story-info__add" onClick={add} type="button" disabled={added} data-testid="product-add-to-bag-button" data-cursor="add">
          <span>{added ? "Added to bag" : "Add to bag"}</span>{added ? <Check size={18} strokeWidth={1.25} aria-hidden="true" /> : <ArrowUpRight size={18} strokeWidth={1.25} aria-hidden="true" />}
        </button>
      </div>
      <span className="story-info__confirmation" role="status" data-testid="product-add-confirmation">{added ? `${product.name} added to your bag.` : ""}</span>
    </aside>
  );
};