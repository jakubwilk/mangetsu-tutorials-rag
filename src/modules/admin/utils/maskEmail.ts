export const maskEmail = (email: string | null): string => {
  if (!email) return ''

  const atIndex = email.indexOf('@')
  if (atIndex === -1) return email

  const local = email.slice(0, atIndex)
  const domain = email.slice(atIndex + 1)
  const dotIndex = domain.lastIndexOf('.')
  const domainName = dotIndex === -1 ? domain : domain.slice(0, dotIndex)
  const tld = dotIndex === -1 ? '' : domain.slice(dotIndex)

  return `${local[0] ?? ''}****@${domainName[0] ?? ''}****${tld}`
}
