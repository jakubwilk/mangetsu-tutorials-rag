import type { UserRole } from 'auth'

export interface AdminUser {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: UserRole
  createdAt: string
}
