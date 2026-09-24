import { useCallback, useRef, useState } from "react";
import "@/App.css";
import { Header } from "@/components/Header";
import { Home } from "@/components/Home";
import { Chronicle } from "@/components/Chronicle";
import { Cursor } from "@/components/Cursor";
import { MenuOverlay } from "@/components/MenuOverlay";
import { BagDrawer } from "@/components/BagDrawer";
import { ContactOverlay } from "@/components/ContactOverlay";
import { PageWipe } from "@/components/PageWipe";

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [chronicleOpen, setChronicleOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [bag, setBag] = useState([]);
  const wipeRef = useRef(null);
  const transition = useCallback((change, selector) => {
    if (wipeRef.current) return wipeRef.current.transition(change, selector);
    return false;
  }, []);

  const addToBag = useCallback((product) => setBag((b) => [...b, product]), []);
  const removeFromBag = useCallback((idx) => setBag((b) => b.filter((_, i) => i !== idx)), []);
  const openChronicle = useCallback(() => {
    if (wipeRef.current?.isRunning) return;
    if (chronicleOpen && !contactOpen) { setMenuOpen(false); return; }
    transition(() => { setChronicleOpen(true); setContactOpen(false); setMenuOpen(false); }, ".chronicle.is-open");
  }, [chronicleOpen, contactOpen, transition]);
  const closeChronicle = useCallback(() => {
    if (!chronicleOpen && !contactOpen) return;
    transition(() => { setChronicleOpen(false); setContactOpen(false); setMenuOpen(false); }, "[data-testid='home-view']");
  }, [chronicleOpen, contactOpen, transition]);
  const openContact = useCallback(() => transition(() => { setContactOpen(true); setMenuOpen(false); }, "[data-testid='contact-overlay']"), [transition]);
  const closeContact = useCallback(() => transition(() => setContactOpen(false), chronicleOpen ? ".chronicle.is-open" : "[data-testid='home-view']"), [chronicleOpen, transition]);

  return (
    <div className="app" data-testid="objects-marketplace" data-page={contactOpen ? "contact" : chronicleOpen ? "chronicles" : "home"}>
      <Header
        bagCount={bag.length}
        menuOpen={menuOpen}
        chronicleOpen={chronicleOpen}
        onMenu={() => setMenuOpen(true)}
        onBag={() => setBagOpen(true)}
        onHome={closeChronicle}
      />
      <Home onExplore={openChronicle} />
      <Chronicle
        open={chronicleOpen}
        overlayDimmed={menuOpen || bagOpen || contactOpen}
        onAddToBag={addToBag}
        onClose={closeChronicle}
        onDragChange={setDragging}
      />
      <MenuOverlay
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onContact={openContact}
        onChronicles={openChronicle}
      />
      <BagDrawer open={bagOpen} bag={bag} onClose={() => setBagOpen(false)} onRemove={removeFromBag} />
      <ContactOverlay open={contactOpen} onClose={closeContact} />
      <PageWipe ref={wipeRef} />
      <Cursor dragging={dragging} />
    </div>
  );
}
