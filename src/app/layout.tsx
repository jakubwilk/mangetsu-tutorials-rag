import './globals.css'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'

import type { MantineColorsTuple } from '@mantine/core'
import { ColorSchemeScript, createTheme, mantineHtmlProps, MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import type { Metadata } from 'next'
import { Geist_Mono, Inter, Plus_Jakarta_Sans } from 'next/font/google'

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-heading',
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const inter = Inter({
  variable: '--font-body',
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Mangetsu — Asystent poradnikowy',
  description: 'Asystent AI dla forum Mangetsu oparty na bazie poradników RP',
}

const mangetsu: MantineColorsTuple = [
  '#e3f7fb',
  '#b9eaf5',
  '#87d8ec',
  '#51c4e1',
  '#28afd4',
  '#1a9ab9',
  '#10718f',
  '#0d5a72',
  '#094457',
  '#062e3c',
]

const theme = createTheme({
  fontFamily: 'var(--font-body), system-ui, sans-serif',
  fontFamilyMonospace: 'var(--font-geist-mono), monospace',
  colors: { mangetsu },
  primaryColor: 'mangetsu',
  primaryShade: { light: 6, dark: 5 },
  defaultRadius: 'md',
  headings: {
    fontFamily: 'var(--font-heading), system-ui, sans-serif',
    fontWeight: '800',
    sizes: {
      h1: { fontSize: '3.5rem', lineHeight: '1.1' },
      h2: { fontSize: '2.25rem', lineHeight: '1.2' },
      h3: { fontSize: '1.5rem', lineHeight: '1.3' },
      h4: { fontSize: '1.125rem', lineHeight: '1.4' },
    },
  },
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pl"
      data-scroll-behavior="smooth"
      {...mantineHtmlProps}
      className={`${plusJakartaSans.variable} ${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>

      <body className="h-full overflow-hidden">
        <MantineProvider theme={theme} forceColorScheme="dark">
          <Notifications position="top-center" />
          {children}
        </MantineProvider>
      </body>
    </html>
  )
}
