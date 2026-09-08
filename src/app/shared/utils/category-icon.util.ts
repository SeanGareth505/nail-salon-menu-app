const SLUG_ICON: Record<string, string> = {
  nails: 'droplet',
  manicure: 'droplet',
  pedicure: 'droplet',
  facials: 'leaf',
  facial: 'leaf',
  skincare: 'droplet',
  massage: 'droplet',
  body: 'massage',
  waxing: 'leaf',
  lashes: 'leaf',
  'brows-lashes': 'leaf',
  brows: 'leaf',
  spa: 'spa',
  wellness: 'spa',
  packages: 'star',
};

const LEGACY_ICON: Record<string, string> = {
  nail: 'droplet',
  facial: 'leaf',
  massage: 'droplet',
  waxing: 'leaf',
  lashes: 'leaf',
  droplet: 'droplet',
  scissors: 'scissors',
  star: 'star',
  leaf: 'leaf',
  brush: 'brush',
  spa: 'spa',
};

export function categorySfIcon(slug: string, icon: string): string {
  return SLUG_ICON[slug] ?? LEGACY_ICON[icon] ?? 'spa';
}

export function categoryMaterialIcon(slug: string, icon: string): string {
  const map: Record<string, string> = {
    droplet: 'water_drop',
    leaf: 'eco',
    massage: 'self_improvement',
    spa: 'spa',
    star: 'star',
    brush: 'brush',
    scissors: 'content_cut',
  };
  const sf = categorySfIcon(slug, icon);
  return map[sf] ?? 'spa';
}
