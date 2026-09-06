'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Wallet, ArrowLeftRight, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './theme-toggle'
import { signOut } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import type { User } from '@supabase/supabase-js'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/bolsos', label: 'Bolsos', icon: Wallet },
  { href: '/movimentacoes', label: 'Movimentações', icon: ArrowLeftRight },
]

interface SidebarProps {
  user: User
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored !== null) setCollapsed(stored === 'true')
  }, [])

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    try {
      localStorage.setItem('sidebar-collapsed', String(next))
    } catch {}
  }

  const name = user.user_metadata?.full_name as string | undefined
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined
  const initials = name
    ? name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'FB'

  return (
    <aside
      className={cn(
        'bg-sidebar border-sidebar-border flex h-full flex-col border-r transition-[width] duration-200 ease-in-out',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'border-sidebar-border flex h-16 shrink-0 items-center border-b',
          collapsed ? 'justify-center px-0' : 'justify-between px-4'
        )}
      >
        <Link href="/dashboard" className={cn('flex items-center gap-3 hover:opacity-80 transition-opacity', collapsed && 'justify-center')}>
          <div className="bg-sidebar-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
            <span className="text-sm">💰</span>
          </div>
          {!collapsed && (
            <span className="text-sidebar-foreground text-lg font-semibold">Free Budget</span>
          )}
        </Link>

        {!collapsed && (
          <button
            onClick={toggleCollapsed}
            aria-label="Recolher menu"
            className="text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 p-3" aria-label="Navegação principal">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            title={collapsed ? label : undefined}
            className={cn(
              'flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors',
              collapsed ? 'justify-center px-0' : 'gap-3 px-3',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {!collapsed && label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-sidebar-border border-t p-3 space-y-1">
        {collapsed ? (
          <div className="flex flex-col items-center gap-1">
            <Avatar className="h-8 w-8" title={name ?? 'Usuário'}>
              <AvatarImage src={avatarUrl} alt={name ?? 'Usuário'} />
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="[&_button]:text-sidebar-foreground/65 [&_button:hover]:bg-sidebar-accent [&_button:hover]:text-sidebar-accent-foreground">
              <ThemeToggle />
            </div>
            <form action={signOut}>
              <Button
                variant="ghost"
                size="icon"
                type="submit"
                title="Sair"
                className="text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </Button>
            </form>
            <button
              onClick={toggleCollapsed}
              aria-label="Expandir menu"
              title="Expandir menu"
              className="text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex h-8 w-8 items-center justify-center rounded-md transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 rounded-lg px-3 py-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl} alt={name ?? 'Usuário'} />
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sidebar-foreground truncate text-sm font-medium">{name ?? 'Usuário'}</p>
                <p className="text-sidebar-foreground/50 truncate text-xs">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 [&_button]:text-sidebar-foreground/65 [&_button:hover]:bg-sidebar-accent [&_button:hover]:text-sidebar-accent-foreground">
              <ThemeToggle />
              <form action={signOut} className="flex-1">
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2" type="submit">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sair
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
