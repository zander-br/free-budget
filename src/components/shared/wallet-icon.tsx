import {
  Wallet,
  CreditCard,
  Building2,
  PiggyBank,
  Banknote,
  Landmark,
  Coins,
  Briefcase,
  type LucideProps,
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  wallet: Wallet,
  'credit-card': CreditCard,
  'building-2': Building2,
  'piggy-bank': PiggyBank,
  banknote: Banknote,
  landmark: Landmark,
  coins: Coins,
  briefcase: Briefcase,
}

interface WalletIconProps extends LucideProps {
  icon?: string | null
}

export function WalletIcon({ icon, ...props }: WalletIconProps) {
  const Icon = iconMap[icon ?? 'wallet'] ?? Wallet
  return <Icon {...props} />
}
