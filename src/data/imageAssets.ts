// Local image asset management for Image Choice questions
// Images are stored in the public/images directory and referenced by their relative paths

export function getImageUrl(assetKey: string): string {
  // Asset key is now the direct path to the image in the public directory
  // e.g., "/images/crown.png" -> "/images/crown.png"
  return assetKey;
}