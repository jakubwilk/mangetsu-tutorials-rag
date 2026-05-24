'use client'

import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Indicator,
  Popover,
  Stack,
  Text,
} from '@mantine/core'
import { IconAlertTriangleFilled, IconBell, IconInfoCircleFilled } from '@tabler/icons-react'
import type { Notice } from 'app/notices-loader'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { dismissedNoticesStore } from 'store'

const NOTICE_COLOR: Record<Notice['type'], string> = {
  info: 'rgba(106, 125, 173, 1)',
  warning: 'rgba(176, 137, 107, 1)',
}

interface NoticesPopoverProps {
  notices: Notice[]
}

export default function NoticesPopover({ notices }: NoticesPopoverProps) {
  const dismissed = useSyncExternalStore(
    dismissedNoticesStore.subscribe,
    dismissedNoticesStore.getSnapshot,
    dismissedNoticesStore.getServerSnapshot,
  )
  const [opened, setOpened] = useState(false)

  const active = notices.filter((n) => !dismissed.includes(n.id))
  const count = active.length

  useEffect(() => {
    dismissedNoticesStore.init()
  }, [])

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom-end"
      withArrow
      shadow="md"
      width={360}
    >
      <Popover.Target>
        <Indicator disabled={count === 0} label={count} size={18} color="red" offset={4}>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="xl"
            aria-label="Ogłoszenia"
            onClick={() => setOpened((o) => !o)}
          >
            <IconBell size={24} />
          </ActionIcon>
        </Indicator>
      </Popover.Target>

      <Popover.Dropdown p={0}>
        <Box px="md" py="sm" style={{ borderBottom: '1px solid var(--mantine-color-dark-4)' }}>
          <Text size="sm" fw={600}>
            Ogłoszenia
          </Text>
        </Box>

        {notices.length === 0 ? (
          <Text size="sm" c="dimmed" p="md">
            Brak ogłoszeń.
          </Text>
        ) : active.length === 0 ? (
          <Stack p="md" gap="xs">
            <Text size="sm" c="dimmed">
              Wszystkie ogłoszenia zostały odrzucone.
            </Text>
            <Button variant="subtle" size="xs" onClick={dismissedNoticesStore.reset}>
              Pokaż wszystkie
            </Button>
          </Stack>
        ) : (
          <Stack p="sm" gap="sm">
            {active.map((notice) => (
              <Alert
                key={notice.id}
                color={NOTICE_COLOR[notice.type]}
                variant="light"
                icon={
                  notice.type === 'warning' ? (
                    <IconAlertTriangleFilled size={24} />
                  ) : (
                    <IconInfoCircleFilled size={24} />
                  )
                }
                withCloseButton
                closeButtonLabel="Odrzuć ogłoszenie"
                onClose={() => dismissedNoticesStore.dismiss(notice.id)}
              >
                <Text size="sm" style={{ lineHeight: 1.6 }}>
                  {notice.message}
                </Text>
              </Alert>
            ))}

            {dismissed.length > 0 && (
              <Button variant="subtle" size="xs" color="gray" onClick={dismissedNoticesStore.reset}>
                Pokaż odrzucone ({dismissed.length})
              </Button>
            )}
          </Stack>
        )}
      </Popover.Dropdown>
    </Popover>
  )
}
