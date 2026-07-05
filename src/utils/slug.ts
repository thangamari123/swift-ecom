export function generateSlug(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/'/g, '') // remove apostrophes so "men's" -> "mens"
    .replace(/[^\w\s-]/g, '') // remove special characters
    .replace(/[\s_-]+/g, '-') // replace spaces, underscores with hyphen
    .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
}

export function getProductUrl(product: any): string {
  if (!product || !product.id) return '/shop';
  
  // Use database slug if available
  if (product.slug) {
    return `/product/${product.slug}/${product.id}`;
  }
  
  // Fallback to generated slug for backward compatibility
  const generatedSlug = generateSlug(product.name || 'product');
  return `/product/${generatedSlug}/${product.id}`;
}
