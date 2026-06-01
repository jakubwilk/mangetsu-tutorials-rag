import { notifications } from '@mantine/notifications'
import { IconAlertTriangle, IconInfoCircle, IconXboxX } from '@tabler/icons-react'
import { createElement } from 'react'

const sharedStyles = {
  root: { padding: '0.5rem' },
  icon: { background: 'transparent', border: 'none' },
}

export const notifyError = (message: string) =>
  notifications.show({
    message,
    color: 'red',
    radius: 'sm',
    withBorder: true,
    icon: createElement(IconXboxX, { size: 20, stroke: 1.5, color: 'var(--mantine-color-red-5)' }),
    styles: sharedStyles,
  })

export const notifyInfo = (message: string) =>
  notifications.show({
    message,
    color: 'mangetsu',
    radius: 'sm',
    withBorder: true,
    icon: createElement(IconInfoCircle, { size: 20, stroke: 1.5, color: 'var(--mantine-color-mangetsu-5)' }),
    styles: sharedStyles,
  })

export const notifyWarning = (message: string) =>
  notifications.show({
    message,
    color: 'yellow',
    radius: 'sm',
    withBorder: true,
    icon: createElement(IconAlertTriangle, { size: 20, stroke: 1.5, color: 'var(--mantine-color-yellow-5)' }),
    styles: sharedStyles,
  })
