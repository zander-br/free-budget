export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          name: string
          icon: string | null
          color: string | null
          initial_balance: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          icon?: string | null
          color?: string | null
          initial_balance?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          icon?: string | null
          color?: string | null
          initial_balance?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          type: 'INCOME' | 'EXPENSE'
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'INCOME' | 'EXPENSE'
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'INCOME' | 'EXPENSE'
          icon?: string | null
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
          amount: number
          date: string
          category_id: string | null
          wallet_id: string | null
          wallet_from_id: string | null
          wallet_to_id: string | null
          description: string | null
          notes: string | null
          is_paid: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
          amount: number
          date: string
          category_id?: string | null
          wallet_id?: string | null
          wallet_from_id?: string | null
          wallet_to_id?: string | null
          description?: string | null
          notes?: string | null
          is_paid?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'INCOME' | 'EXPENSE' | 'TRANSFER'
          amount?: number
          date?: string
          category_id?: string | null
          wallet_id?: string | null
          wallet_from_id?: string | null
          wallet_to_id?: string | null
          description?: string | null
          notes?: string | null
          is_paid?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      wallet_balances: {
        Row: {
          id: string
          user_id: string
          name: string
          icon: string | null
          color: string | null
          initial_balance: number
          is_active: boolean
          created_at: string
          updated_at: string
          balance: number
        }
      }
    }
    Functions: Record<string, never>
    Enums: {
      transaction_type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
      category_type: 'INCOME' | 'EXPENSE'
    }
  }
}
