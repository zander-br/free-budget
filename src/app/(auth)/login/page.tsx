import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoginForm } from '@/components/shared/login-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  const params = await searchParams
  const error = params.error

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="bg-primary mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
            <span className="text-3xl text-white">💰</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Free Budget</h1>
          <p className="text-muted-foreground mt-2">Controle suas finanças de forma simples</p>
        </div>

        <LoginForm error={error} />

        <p className="text-muted-foreground text-center text-sm">
          Ao continuar, você concorda com nossos termos de uso.
        </p>
      </div>
    </div>
  )
}
