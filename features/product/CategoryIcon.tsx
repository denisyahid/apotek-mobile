"use client";

import {
  Baby,
  Citrus,
  Dumbbell,
  Leaf,
  Package,
  Pill,
  Sparkles,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  pill: Pill,
  citrus: Citrus,
  dumbbell: Dumbbell,
  sparkles: Sparkles,
  baby: Baby,
  stethoscope: Stethoscope,
  leaf: Leaf,
  package: Package,
};

export function CategoryIcon({ icon, size = 22 }: { icon: string; size?: number }) {
  const Icon = ICONS[icon] ?? Pill;
  return <Icon size={size} aria-hidden />;
}
