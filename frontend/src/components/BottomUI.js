import { useState } from "react";
import { pad } from "@/data/products";
import { Minus, Plus } from "lucide-react";

export const BottomUI = ({ index, total, onSelect, hidden }) => {
  const [expanded, setExpanded] = useState(true);
  return (
    <nav className={`chronicle-index ${expanded ? "is-expanded" : ""}`} data-testid="chronicle-index" aria-label="Chronicle index" hidden={hidden}>
      <button className="chronicle-index__toggle" type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} aria-controls="chronicle-index-numbers" data-testid="chronicle-index-toggle" data-cursor="open">
        Index {expanded ? <Minus size={10} aria-hidden="true" /> : <Plus size={10} aria-hidden="true" />}
      </button>
      <div id="chronicle-index-numbers" className="chronicle-index__numbers" data-testid="chronicle-index-numbers" hidden={!expanded}>
        {Array.from({ length: total }, (_, i) => (
          <button key={i} type="button" onClick={() => onSelect(i)} className={index === i ? "is-active" : ""} aria-label={`Explore Chronicle ${pad(i + 1)}`} aria-current={index === i ? "true" : undefined} data-testid={`chronicle-index-${i + 1}`} data-cursor="open">{pad(i + 1)}</button>
        ))}
      </div>
    </nav>
  );
};