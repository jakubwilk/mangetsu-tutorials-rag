import { ActionIcon, Box, Group } from '@mantine/core'
import { IconExternalLink } from '@tabler/icons-react'
import { UserMenu } from 'auth'
import { NoticesPopover } from 'notices'
import { auth } from 'server/auth'
import { loadNotices } from 'server/notices'

import AddSourceModal from '../modals/AddSourceModal'
import Logo from '../Logo'

const FORUM_URL = process.env.NEXT_PUBLIC_FORUM_URL ?? '#'

export default async function Topbar() {
  const [notices, session] = await Promise.all([loadNotices(), auth()])
  const canEdit = session?.user.role === 'EDITOR' || session?.user.role === 'ROOT'

  return (
    <Box
      component="header"
      px="md"
      className="flex h-15 shrink-0 items-center"
      style={{
        borderBottom: '1px solid var(--mantine-color-dark-5)',
        background: 'var(--mantine-color-dark-8)',
      }}
    >
      <Group justify="space-between" className="w-full">
        <Logo />
        <Group gap="xs">
          {canEdit && <AddSourceModal />}
          <NoticesPopover notices={notices} />
          <ActionIcon
            component="a"
            href={FORUM_URL}
            target="_blank"
            rel="noopener noreferrer"
            variant="subtle"
            color="gray"
            size="xl"
            aria-label="Przejdź na forum"
            title="Przejdź na forum"
          >
            <IconExternalLink size={20} />
          </ActionIcon>
          {session && (
            <UserMenu
              name={session.user.name ?? null}
              image={session.user.image ?? null}
              role={session.user.role}
            />
          )}
        </Group>
      </Group>
    </Box>
  )
}
