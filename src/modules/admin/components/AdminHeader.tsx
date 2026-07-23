import { Box, Button, Group } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { Logo } from 'common'
import Link from 'next/link'

export default function AdminHeader() {
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
        <Link href="/">
          <Button variant="subtle" color="gray" leftSection={<IconArrowLeft size={16} />}>
            Powrót do czatu
          </Button>
        </Link>
      </Group>
    </Box>
  )
}
