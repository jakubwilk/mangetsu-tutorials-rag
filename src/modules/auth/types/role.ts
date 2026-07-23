export type UserRole = 'GUEST' | 'USER' | 'EDITOR' | 'ROOT'

export const ROLE_LABELS: Record<UserRole, string> = {
  GUEST: 'Gość',
  USER: 'Użytkownik',
  EDITOR: 'Redaktor',
  ROOT: 'Administrator',
}
