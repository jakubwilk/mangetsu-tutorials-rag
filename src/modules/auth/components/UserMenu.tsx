'use client'

import { Avatar, Group, Menu, Text, UnstyledButton } from '@mantine/core'
import { IconChevronDown, IconExternalLink, IconLogout, IconShieldLock } from '@tabler/icons-react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'

import { ROLE_LABELS, type UserRole } from '../types'

interface UserMenuProps {
  name: string | null
  image: string | null
  role: UserRole
  forumUrl?: string
  children?: React.ReactNode
}

export default function UserMenu({ name, image, role, forumUrl, children }: UserMenuProps) {
  return (
    <Menu position="bottom-end" withArrow>
      <Menu.Target>
        <UnstyledButton>
          <Group gap="xs" wrap="nowrap">
            <Avatar src={image} alt={name ?? 'Użytkownik'} size="sm" radius="xl" />
            <div style={{ maxWidth: 120, minWidth: 0 }}>
              <Text size="sm" fw={500} lh={1.2} truncate="end">
                {name ?? 'Użytkownik'}
              </Text>
              <Text size="xs" c="dimmed" lh={1.2} truncate="end">
                {ROLE_LABELS[role]}
              </Text>
            </div>
            <IconChevronDown size={14} />
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        {children}
        {forumUrl && (
          <Menu.Item
            component="a"
            href={forumUrl}
            target="_blank"
            rel="noopener noreferrer"
            leftSection={<IconExternalLink size={16} />}
            hiddenFrom="md"
          >
            Przejdź na forum
          </Menu.Item>
        )}
        {(children || forumUrl) && <Menu.Divider />}
        {role === 'ROOT' && (
          <>
            <Menu.Item component={Link} href="/admin" leftSection={<IconShieldLock size={16} />}>
              Panel administracyjny
            </Menu.Item>
            <Menu.Divider />
          </>
        )}
        <Menu.Item
          color="red"
          leftSection={<IconLogout size={16} />}
          onClick={() => signOut({ redirectTo: '/login' })}
        >
          Wyloguj
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
