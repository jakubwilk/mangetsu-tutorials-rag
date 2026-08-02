import { Button, type CSSProperties } from '@mantine/core'
import { IconBrandDiscord } from '@tabler/icons-react'

import { signInWithDiscord } from '../api'

const hoverVars = {
  '--button-hover': '#E0E3FF',
  '--button-hover-color': 'var(--mantine-color-black)',
} as CSSProperties

// A real <form> submission (Server Action) is required here rather than the client-side
// signIn() helper: signIn() does an async CSRF fetch before navigating, which breaks the
// synchronous user-gesture chain that mobile browsers need to hand off to the Discord app
// via Universal Links / App Links — without it, the OAuth flow always opens in-browser.
export default function DiscordSignInButton() {
  return (
    <form action={signInWithDiscord}>
      <Button
        type="submit"
        size="lg"
        radius="md"
        color="discord"
        fz="1rem"
        fw={500}
        style={hoverVars}
        leftSection={<IconBrandDiscord size={20} />}
      >
        Zaloguj przez Discord
      </Button>
    </form>
  )
}
