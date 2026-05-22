import { Box, Button, Group, Text } from '@mantine/core'

const FORUM_URL = process.env.NEXT_PUBLIC_FORUM_URL ?? '#'

export default function Topbar() {
  return (
    <Box
      component="header"
      px="md"
      className="h-[60px] shrink-0 flex items-center"
      style={{
        borderBottom: '1px solid var(--mantine-color-dark-5)',
        background: 'var(--mantine-color-dark-8)',
      }}
    >
      <Group justify="space-between" className="w-full">
        <Text c="mangetsu.4" className="select-none leading-none">
          <span style={{ fontFamily: 'Times New Roman, serif' }} className="font-normal text-[1.75rem]">
            mangetsu
          </span>
          <span className="font-bold text-[0.85rem] text-white tracking-[0.05em]">
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
