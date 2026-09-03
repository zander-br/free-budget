import {
  Briefcase,
  Laptop,
  TrendingUp,
  Percent,
  RotateCcw,
  Gift,
  CirclePlus,
  Utensils,
  Home,
  Car,
  HeartPulse,
  GraduationCap,
  Gamepad2,
  ShoppingBag,
  Repeat,
  FileText,
  Receipt,
  Plane,
  PawPrint,
  CircleMinus,
  Tag,
  type LucideProps,
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  briefcase: Briefcase,
  laptop: Laptop,
  'trending-up': TrendingUp,
  percent: Percent,
  'rotate-ccw': RotateCcw,
  gift: Gift,
  'circle-plus': CirclePlus,
  utensils: Utensils,
  home: Home,
  car: Car,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  'gamepad-2': Gamepad2,
  'shopping-bag': ShoppingBag,
  repeat: Repeat,
  'file-text': FileText,
  receipt: Receipt,
  plane: Plane,
  'paw-print': PawPrint,
  'circle-minus': CircleMinus,
}

interface CategoryIconProps extends LucideProps {
  icon?: string | null
}

export function CategoryIcon({ icon, ...props }: CategoryIconProps) {
  const Icon = iconMap[icon ?? 'tag'] ?? Tag
  return <Icon {...props} />
}
