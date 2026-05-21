import { Box, Button, Group, Text } from '@mantine/core'

const FORUM_URL = process.env.NEXT_PUBLIC_FORUM_URL ?? '#'

export default function Topbar() {
  return (
    <Box
      component="header"
      px="md"
      style={{
        height: 60,
        flexShrink: 0,
        borderBottom: '1px solid var(--mantine-color-dark-5)',
        background: 'var(--mantine-color-dark-8)',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Group justify="space-between" style={{ width: '100%' }}>
        <Text c="mangetsu.4" style={{ userSelect: 'none', lineHeight: 1 }}>
          <span style={{ fontFamily: 'Times New Roman, serif', fontWeight: 400, fontSize: '1.75rem' }}>
            mangetsu
          </span>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'white', letterSpacing: '0.05em' }}>
            {' '}RAG
          </span>
        </Text>
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
    </Box>
  )
}
