'use client'

import { LogOut, Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import { signOut } from '@/actions/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { User } from '@supabase/supabase-js'

interface MobileHeaderProps {
  user: User
}

export function MobileHeader({ user }: MobileHeaderProps) {
  const { setTheme } = useTheme()
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

      <DropdownMenu>
        <DropdownMenuTrigger aria-label="Menu do usuário" className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar className="h-8 w-8 cursor-pointer">
            <AvatarImage src={avatarUrl} alt={name ?? 'Usuário'} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{name ?? 'Usuário'}</p>
            <p className="text-muted-foreground text-xs">{user.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">Tema</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setTheme('light')}>
            <Sun className="mr-2 h-4 w-4" aria-hidden="true" />
            Claro
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('dark')}>
            <Moon className="mr-2 h-4 w-4" aria-hidden="true" />
            Escuro
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('system')}>
            <Monitor className="mr-2 h-4 w-4" aria-hidden="true" />
            Sistema
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={() => signOut()}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
