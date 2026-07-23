import { Text } from '@mantine/core'

export default function Logo() {
  return (
    <Text c="mangetsu.4" className="leading-none select-none">
      <span style={{ fontFamily: 'Times New Roman, serif' }} className="text-[1.75rem] font-normal">
        mangetsu
      </span>
      <span className="text-[0.85rem] font-bold tracking-wider text-white"> RAG</span>
    </Text>
  )
}
