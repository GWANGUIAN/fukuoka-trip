import { BedDouble, Beer, Camera, Coffee, Plane, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import type { Category } from '../data/types';

const ICONS = {
  food: UtensilsCrossed,
  cafe: Coffee,
  shopping: ShoppingBag,
  sight: Camera,
  hotel: BedDouble,
  transport: Plane,
  bar: Beer,
} as const;

export function CategoryIcon({ category, size = 16 }: { category: Category; size?: number }) {
  const Icon = ICONS[category];
  return <Icon size={size} strokeWidth={2} />;
}
