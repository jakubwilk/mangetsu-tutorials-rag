'use client'

import {
  ActionIcon,
  Button,
  Group,
  Modal,
  SegmentedControl,
  Stack,
  Textarea,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconPlus } from '@tabler/icons-react'
import { useState } from 'react'

import { submitSource } from 'common/api/sources'
import type { SourceMethod } from 'common/api/sources'
import { notifyError, notifyInfo } from 'common/utils/notifications'

export default function AddSourceModal() {
  const [opened, { open, close }] = useDisclosure(false)
  const [method, setMethod] = useState<SourceMethod>('URL')
  const [data, setData] = useState('')
  const [loading, setLoading] = useState(false)

  const handleClose = () => {
    close()
    setMethod('URL')
    setData('')
  }

  const handleMethodChange = (value: string) => {
    setMethod(value as SourceMethod)
    setData('')
  }

  const handleSubmit = async () => {
    if (!data.trim()) return

    setLoading(true)
    try {
      const message = await submitSource(method, data.trim())
      notifyInfo(message)
      handleClose()
    } catch (err) {
      notifyError(
        err instanceof Error ? err.message : 'Nie udało się dodać źródła. Spróbuj ponownie.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="subtle"
        color="gray"
        size="sm"
        leftSection={<IconPlus size={16} />}
        onClick={open}
        visibleFrom="md"
      >
        Dodaj źródło
      </Button>

      <Tooltip label="Dodaj źródło" hiddenFrom="md">
        <ActionIcon
          variant="subtle"
          color="gray"
          size="xl"
          aria-label="Dodaj źródło"
          onClick={open}
          hiddenFrom="md"
        >
          <IconPlus size={20} />
        </ActionIcon>
      </Tooltip>

      <Modal opened={opened} onClose={handleClose} title="Dodaj źródło" centered size="md">
        <Stack gap="md">
          <SegmentedControl
            fullWidth
            value={method}
            onChange={handleMethodChange}
            data={[
              { label: 'Link do forum (URL)', value: 'URL' },
              { label: 'Treść ręczna (Markdown)', value: 'CONTENT' },
            ]}
          />

          {method === 'URL' ? (
            <TextInput
              label="URL wątku"
              placeholder="https://mangetsu.pl/viewtopic.php?t=..."
              value={data}
              onChange={(e) => setData(e.currentTarget.value)}
              disabled={loading}
            />
          ) : (
            <Textarea
              label="Treść (Markdown)"
              placeholder={'# Tytuł poradnika\n\nTreść...'}
              value={data}
              onChange={(e) => setData(e.currentTarget.value)}
              autosize
              minRows={6}
              maxRows={14}
              disabled={loading}
            />
          )}

          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" color="gray" onClick={handleClose} disabled={loading}>
              Anuluj
            </Button>
            <Button onClick={handleSubmit} loading={loading} disabled={!data.trim()}>
              Zapisz
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
