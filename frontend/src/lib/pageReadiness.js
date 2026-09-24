import { gsap } from "@/lib/gsap";

const nextFrame = (signal) => new Promise((resolve) => {
  if (signal.aborted) return resolve();
  requestAnimationFrame(resolve);
});

const bounded = (promise, signal) => new Promise((resolve) => {
  const done = () => { clearTimeout(timer); signal.removeEventListener("abort", done); resolve(); };
  const timer = setTimeout(done, 7000);
  signal.addEventListener("abort", done, { once: true });
  Promise.resolve(promise).then(done, done);
});

export async function waitForPageReady(selector, signal) {
  await nextFrame(signal);
  if (signal.aborted) return;
  // Finish outgoing overlay exits only while the global sheet fully covers them.
  // Their ordinary menu-dismiss animations remain unchanged outside page navigation.
  document.querySelectorAll(".menu[aria-hidden='true'], .contact[aria-hidden='true']").forEach((overlay) => {
    const targets = [overlay, ...overlay.querySelectorAll(".menu__line-inner")];
    gsap.getTweensOf(targets).forEach((tween) => { tween.progress(1); tween.kill(); });
    gsap.set(overlay, { opacity: 0, pointerEvents: "none" });
  });
  const deadline = performance.now() + 7000;
  let page;
  // React's mounted/shown effects and incoming overlay opacity settle while covered.
  while (!signal.aborted) {
    page = document.querySelector(selector);
    if (page && page.getAttribute("aria-hidden") !== "true" && Number(getComputedStyle(page).opacity) >= 0.999) break;
    if (performance.now() > deadline) throw new Error(`Page did not become ready: ${selector}`);
    await nextFrame(signal);
  }
  if (signal.aborted) return;
  const visibleImages = [...page.querySelectorAll("img")].filter((image) => {
    const box = image.getBoundingClientRect();
    return box.width > 0 && box.bottom > 0 && box.top < window.innerHeight && box.right > 0 && box.left < window.innerWidth;
  });
  await Promise.all([
    bounded(document.fonts.ready, signal),
    ...visibleImages.map((image) => bounded(image.decode(), signal)),
  ]);
  // Two painted frames guarantee that decoded media/layout are ready before uncovering.
  await nextFrame(signal);
  await nextFrame(signal);
}