// Image asset mapping for Image Choice questions
export const IMAGE_ASSETS: Record<string, string> = {
  // B04 - Symbol inspiration
  key: 'https://images.pexels.com/photos/1232594/pexels-photo-1232594.jpeg?auto=compress&cs=tinysrgb&w=400',
  crown: 'https://images.pexels.com/photos/8828678/pexels-photo-8828678.jpeg?auto=compress&cs=tinysrgb&w=400',
  compass: 'https://images.pexels.com/photos/1906794/pexels-photo-1906794.jpeg?auto=compress&cs=tinysrgb&w=400',
  flame: 'https://images.pexels.com/photos/266487/pexels-photo-266487.jpeg?auto=compress&cs=tinysrgb&w=400',
  heart: 'https://images.pexels.com/photos/1557652/pexels-photo-1557652.jpeg?auto=compress&cs=tinysrgb&w=400',

  // B10 - House styles
  minimalist_mansion: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=400',
  rustic_cabin: 'https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=400',
  grand_estate: 'https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg?auto=compress&cs=tinysrgb&w=400',
  vibrant_loft: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=400',

  // C03 - Clarifier symbols
  spark: 'https://images.pexels.com/photos/1363876/pexels-photo-1363876.jpeg?auto=compress&cs=tinysrgb&w=400'
};

export function getImageUrl(assetKey: string): string {
  return IMAGE_ASSETS[assetKey] || 'https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=400';
}