import { Box, Button, Group, Text } from '@mantine/core'

import { loadNotices } from '@/app/notices-loader'
import NoticesPopover from '@/components/notices/NoticesPopover'

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
          <Button
            component="a"
            href={FORUM_URL}
            target="_blank"
            rel="noopener noreferrer"
            variant="light"
            color="mangetsu"
            size="sm"
          >
            Przejdź na forum ↗
          </Button>
        </Group>
      </Group>
    </Box>
  )
}
