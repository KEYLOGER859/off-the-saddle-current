# OFF THE SADDLE — OBJECTS

## Original problem statement
Build an original interactive marketplace ("OBJECTS") for the artisan jewellery brand OFF THE SADDLE that feels like an interactive digital exhibition rather than an ecommerce store. Near-black background, warm off-white type, terracotta accents from the logo, large photographic jewellery objects placed spatially (varied scale/rotation), horizontal drag navigation with inertia and depth parallax, hover refinement, cinematic full-screen product view with ADD TO BAG, minimal header (logo + MENU), bottom UI "01 / 08 — DRAG TO EXPLORE →". GSAP + Lenis. Only the marketplace for v1 (no homepage/about/journal/checkout/footer).

## User choices
- Static product data in frontend (`src/data/products.js`)
- ADD TO BAG = visual confirmation + bag count in header (no checkout)
- MENU = minimal full-screen overlay with placeholder links
- AI-generated editorial jewellery photography

## Architecture
- React (CRA/craco) frontend only; backend template untouched (no API used).
- `src/lib/gsap.js` registers Draggable + InertiaPlugin + ScrollTrigger.
- `src/components/Exhibition.js`: local GSAP Draggable/InertiaPlugin proxy (no document/Lenis coupling). Six persistent, identically aligned frames recycle via wrapped X positions. Image-in-frame parallax changes X only. No spatial scattering, rotation, depth or vertical parallax.
- `ExhibitionObject`, `Header`, `BottomUI`, `Cursor`, `ProductView` (frame-to-fullscreen transition), `MenuOverlay`.
- Logo processed to transparent PNG at `public/logo.png`.

## Implemented (June 2026)
- Full-screen spatial exhibition of 8 objects, drag + wheel navigation with inertia
- Depth parallax, image parallax, hover states (scale/rotate/dim others/reveal metadata)
- Custom cursor (VIEW / DRAG / link states)
- Cinematic product view with masked title reveal, specs, story, price, ADD TO BAG → header bag count
- Menu overlay, bottom counter + drag cue, intro animation

## Implemented (Sept 2026 — "Chronicle" film-reel redesign)
- Renamed exhibition concept "Objects" → "Chronicle" (ghost word, header title, menu link 01, product-view eyebrow)
- Aligned FILM-REEL layout: uniform tall portrait cards in a horizontal row, each framed with film-strip perforation borders (top & bottom sprocket holes) + bottom scrim; persistent top-left tag (number + place)
- Big elegant serif (Instrument Serif) product-name reveal on hover with masked slide-in animation + details fade-in; non-hovered cards dim
- Stronger multi-depth image parallax on horizontal scroll
- Bottom "chronicle pager" bar `[ 01 02 … 08 ]` highlighting active object (boxed) + progress line, updates on scroll
- Product view PREV / NEXT navigation (buttons + ArrowLeft/Right keys) — cyclic, swap-in animation, no full close; underlying exhibition glides (immediate) to keep close-morph on-screen
- BAG drawer: slide-in panel listing added items (thumb/name/place/price), Remove, running Total, Checkout (disabled when empty), empty state; Escape/backdrop/close to dismiss
- Keyboard exploration: Left/Right arrow keys glide the exhibition object-to-object with momentum (via Exhibition.glideTo imperative handle)
- Hardened ProductView.close against stale/detached sourceEl (graceful fade fallback)
- Verified via testing agent: iteration_2.json — 13/13 frontend flows passed (100%)

## Implemented (Sept 2026 — refinement round 2)
- Exhibition cards now TILTED (~-6°, uniform) and straighten upright on hover (elegant "align to view")
- Removed the film-reel perforation border → clean, boundary-less cards (more elegant per user)
- Removed the rotated "made by hand across India" caption (was overlapping the bottom bar)
- PRICE hidden on hover (hover reveals only big serif name + material); price shown ONLY in the product detail modal
- Fixed clipped/misaligned hover name (inline-block mask, no horizontal clipping) + product-view title descender clipping
- INFINITE horizontal loop: seamless wrap-around via drag, wheel and arrow keys (Lenis {infinite:true} + gsap.utils.wrap positioning; glideTo shortest-path centering)
- Cleaned up bottom chronicle pager bar
- NEW creative Contact page (full-screen overlay, on-theme) opened from Menu "Contact": big serif headline "Let's make something that lasts.", studio/email/instagram details, minimal underlined form with graceful visual thank-you state
- Verified via testing agent: iteration_3.json — 13/13 frontend flows passed (100%)

## Governing scope — September 24, 2026 (supersedes earlier spatial/film-reel directions)
- User explicitly APPROVED the clean horizontal composition: exactly six objects, equal large 4:5 frames, one aligned horizontal axis, consistent generous gaps. Never scatter, rotate, add depths or vertical parallax again.
- Latest approved pass: visible horizontal in-frame parallax, minimal expandable 01–06 index, GSAP editorial hover typography, subtle hover scale/quiet surroundings, cinematic source-card-to-story detail and exact-position return, existing Add to Bag, future multi-photo support, 600–900ms physical page wipes, small circle-to-action-pill cursor.
- Current single photo per product is explicitly approved. User will provide alternate photographs later; do not fabricate or duplicate alternates.
- Header, logo, menu design, homepage and footer must remain unchanged. User approved wrapping existing page-change callbacks for wipes and refining the custom cursor.
- Existing six images are 848×1264, below previously requested 2400×3600 minimum. Preserved without artificial upscaling; high-resolution replacements remain pending user assets.

## Current Chronicles implementation (preserved during latest refinements)
- `Chronicle.js` selects first six existing products; shared `products.js` remains untouched with 8 historical entries.
- `Exhibition.js` retains six elements; `chronicleField.js` recycles their X positions offscreen and only updates photograph X for parallax. No Lenis/document scroll coupling, no cloned strip.
- `chronicleMotion.js` uses existing GSAP Draggable/InertiaPlugin on a local proxy; wheel, horizontal touch/mouse drag, keyboard and explicit index navigation. Free movement does not snap. Paused throughout detail state to preserve return position.
- `chronicleHover.js` owns hover scale/contrast, quieter surrounding images, masked name reveals and enhanced horizontal image drift. Approved frame geometry is untouched.
- `BottomUI.js` now a small expandable editorial index with text numbers and hairline active mark, not boxed pagination.
- `ProductView.js`, `ProductStoryInfo.js`, `useProductTransition.js`: full-viewport editorial story with a hero animated from the exact source rectangle/crop and back. Existing in-memory bag receives Add to Bag.
- `productMedia.js` supports future `product.images` array (URLs or `{src, alt, caption}`); deduplicates the hero, renders actual additional media only, no placeholder alternate photos.
- `PageWipe.js` wraps existing Home ↔ Chronicles and Contact callbacks; latest vertical cover/readiness/reveal implementation is documented below.
- `Cursor.js` now has a small nucleus, a restrained object hover circle, and GSAP action-pill morphs.
- Regression validation (iteration_4.json): six aligned objects, no cloning, hover text reveal, product details, Add to Bag count/drawer and Escape/return passed. Current user-approved compact 01–06 index remains intact.

## Latest approved refinements — September 24, 2026
### User requirements and hard scope boundaries
- Fix navigation timing as one global VERTICAL sheet: 450–600ms cover, swap only when fully covered, await rendered content/media, 450–600ms reveal. Lock navigation during the transition; no flash, premature page change, fade-to-black or overlapping transitions.
- Fullscreen menu keeps its structure; use exact supplied OFF THE SADDLE logo image prominently, never substitute typed branding. Remove all Chronicles link underlines and add official Instagram.
- Instrument Serif display + Manrope utility/metadata on menu/homepage. Homepage-only bright #F5F3EE foundation; preserve hero composition/animation and footer structure.
- User approved using the supplied photograph as an explicitly replaceable hero asset. No image generation or invented imagery.
- Do not change Chronicles composition/parallax/hover/detail, product data, Add to Bag, navigation destinations, footer component/structure, header/logo component or other pages.

### Implemented and verified
- `PageWipe.js` now awaits GSAP's 520ms vertical cover (`power2.inOut`), resets both pixel/percentage transforms, verifies actual full viewport coverage, then calls the only React content-swap point. It waits for destination opacity/render, visible image decoding, fonts and two animation frames before a 520ms vertical reveal.
- `pageReadiness.js` completes outgoing menu/contact exit animations only while the global panel covers them, preventing a second fade over the destination. Pointer interception, keyboard locking and re-entry guard prevent overlapping navigation.
- `MenuOverlay.js` no longer closes the menu before page navigation; page state and menu closure change together underneath the panel. Same-page selection still just dismisses the menu. Existing destinations are preserved.
- Exact supplied logo downloaded WITHOUT modification to `public/images/menu-logo.png` (988×1280 RGBA), SHA256 `9b13015a99347d837deadaf0b9848f5ee3d93b39a9058860bab81927eee0c8d6`. Header logo untouched.
- `MenuOverlay.css`: large logo, non-overlapping responsive logo/nav regions, Instrument Serif titles and Manrope UI. Link text-decoration/borders/pseudo-underlines removed in all states; colour hover/active state retained.
- Official menu Instagram: `https://www.instagram.com/offthesaddle_/`, opens safely in a new tab.
- `Home.css`: scoped #F5F3EE background, bright photographic wash, Instrument Serif headline, Manrope support/home header/footer utility text. Dark Chronicles typography/styles untouched.
- Exact supplied photograph at `public/images/home-hero.jpg` (1600×900), SHA256 `c1980fc98fb5686ff4123910361b9d309a98b7f1a4b6daf0993298c9740aad42`. Hero asset/focal positions configured in `src/data/home.js`; replace `HOME_HERO.src` or the file without restructuring Hero.
- `Header.js`, `Footer.js`, Contact, Cursor, Bag, product data and ALL Chronicles files remained byte-identical during this latest pass (19-file checksum baseline `/tmp/refinement-protected-baseline.json`). App changes only wrap navigation callbacks/add page-specific theme metadata.

### Testing / fixes
- Production build and scoped hook lint passed. Homepage smoke confirmed #F5F3EE, supplied photograph loaded, Instrument Serif heading.
- Full frontend report `/app/test_reports/iteration_4.json`: overall functional regressions passed; found residual CSS/GSAP pixel-Y offset causing early page swap and oversized nav bounding box intersecting logo region.
- Fixed residual offset by resetting x/y AND xPercent/yPercent, removed initial CSS transform and gated swap on actual panel coverage. Interrupted cover tweens cannot commit a destination.
- Fixed menu bounds with content-width navigation, more-specific responsive padding and explicit vertical separation from the logo on mobile.
- Post-fix browser checks: ALL FIVE swaps (Home→Chronicles, Chronicles→Home, menu→Chronicles, menu→Contact, Contact→Chronicles) recorded panel rect `(0,0,1920,800)` at the app page mutation. No uncovered swaps.
- Post-fix menu bounding-box checks passed at 320, 768, 1024, 1440 and 1920px: no logo/nav intersection and no horizontal overflow. See `/app/test_reports/iteration_4_followup.json`.
- Visual acceptance by user is still pending; do not infer acceptance from test results.

## Prioritized next actions / backlog
- P0: No remaining bugs from iteration 4; await user visual review of the latest scoped refinements.
- P1: User-supplied final/high-resolution hero and product photography, alternate views. Current 848×1264 product images are retained as explicitly approved; multi-photo detail layout is ready.
- P2: Persistent bag/backend product API/admin and real checkout (not implemented). Existing contact and newsletter confirmations are MOCKED, with no submission service. Makers/Journal/About menu links remain existing placeholders; unchanged by this pass.
- Optional enhancement: choose a dedicated mobile focal crop when final hero photography is supplied, using `HOME_HERO.mobilePosition`.
