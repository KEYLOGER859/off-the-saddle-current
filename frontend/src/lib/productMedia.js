// Future product.images accepts URLs or { src, alt, caption } objects.
// The existing hero remains first; no duplicate or fabricated alternate views.
export const getProductPhotos = (product) => {
  const entries = [{ src: product.image, alt: product.name }, ...(product.images || [])];
  const seen = new Set();
  return entries.map((entry) => typeof entry === "string" ? { src: entry, alt: product.name } : entry)
    .filter((entry) => {
      if (!entry?.src || seen.has(entry.src)) return false;
      seen.add(entry.src);
      return true;
    });
};