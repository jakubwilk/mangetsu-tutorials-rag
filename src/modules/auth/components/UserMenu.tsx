'use client'

import { Avatar, Group, Menu, Text, UnstyledButton } from '@mantine/core'
import { IconChevronDown, IconLogout, IconShieldLock } from '@tabler/icons-react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'

import { ROLE_LABELS, type UserRole } from '../types'

interface UserMenuProps {
  name: string | null
  image: string | null
  role: UserRole
}

export default function UserMenu({ name, image, role }: UserMenuProps) {
  return (
    <Menu position="bottom-end" withArrow>
      <Menu.Target>
        <UnstyledButton>
          <Group gap="xs">
            <Avatar src={image} alt={name ?? 'Użytkownik'} size="sm" radius="xl" />
            <div>
              <Text size="sm" fw={500} lh={1.2}>
                {name ?? 'Użytkownik'}
              </Text>
              <Text size="xs" c="dimmed" lh={1.2}>
                {ROLE_LABELS[role]}
              </Text>
            </div>
            <IconChevronDown size={14} />
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
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
