'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Wallet, ArrowLeftRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/bolsos', label: 'Bolsos', icon: Wallet },
  { href: '/movimentacoes', label: 'Movimentações', icon: ArrowLeftRight },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="bg-card fixed right-0 bottom-0 left-0 z-50 flex h-16 items-center border-t md:hidden"
      aria-label="Navegação inferior"
    >
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors',
            pathname === href || pathname.startsWith(href + '/')
              ? 'text-primary'
              : 'text-muted-foreground'
          )}
          aria-current={pathname === href ? 'page' : undefined}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  )
}
