'use client'

import { LogOut } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'
import { signOut } from '@/actions/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { User } from '@supabase/supabase-js'

interface MobileHeaderProps {
  user: User
}

export function MobileHeader({ user }: MobileHeaderProps) {
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
    <header className="bg-card sticky top-0 z-40 flex h-14 items-center justify-between border-b px-4 md:hidden">
      <div className="flex items-center gap-2">
        <div className="bg-primary flex h-7 w-7 items-center justify-center rounded-lg">
          <span className="text-xs text-white">💰</span>
        </div>
        <span className="text-base font-bold">Free Budget</span>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Menu do usuário">
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarImage src={avatarUrl} alt={name ?? 'Usuário'} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{name ?? 'Usuário'}</p>
              <p className="text-muted-foreground text-xs">{user.email}</p>
            </div>
            <form action={signOut}>
              <DropdownMenuItem>
                <button type="submit" className="flex w-full cursor-pointer items-center">
                  <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                  Sair
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
