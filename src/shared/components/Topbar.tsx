import { ActionIcon, Box, Group, Text } from '@mantine/core'
import { IconExternalLink } from '@tabler/icons-react'
import { loadNotices, NoticesPopover } from '@/modules/notices'

const FORUM_URL = process.env.NEXT_PUBLIC_FORUM_URL ?? '#'

export default async function Topbar() {
  const notices = await loadNotices()

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
        <Text c="mangetsu.4" className="leading-none select-none">
          <span
            style={{ fontFamily: 'Times New Roman, serif' }}
            className="text-[1.75rem] font-normal"
          >
            mangetsu
          </span>
          <span className="text-[0.85rem] font-bold tracking-wider text-white"> RAG</span>
        </Text>
        <Group gap="xs">
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
        </Group>
      </Group>
    </Box>
  )
}
