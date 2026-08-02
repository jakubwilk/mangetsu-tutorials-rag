'use client'

import {
  ActionIcon,
  Avatar,
  Badge,
  Group,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core'
import {
  IconArrowDown,
  IconArrowsSort,
  IconArrowUp,
  IconSearch,
  IconTrash,
} from '@tabler/icons-react'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { ROLE_LABELS } from 'auth'
import { notifyError, notifyInfo, notifyWarning } from 'common/utils'
import { useMemo, useState } from 'react'

import { deleteUser, updateUserRole } from '../api'
import type { AdminUser } from '../types'
import { maskEmail } from '../utils'
import DeleteUserModal from './DeleteUserModal'

const ROLE_OPTIONS = [
  { value: 'GUEST', label: 'Gość' },
  { value: 'USER', label: 'Użytkownik' },
  { value: 'EDITOR', label: 'Redaktor' },
]

const ROLE_FILTER_OPTIONS = [...ROLE_OPTIONS, { value: 'ROOT', label: 'Administrator' }]

const matchesSearch = (row: { original: AdminUser }, _columnId: string, filterValue: string) => {
  const query = filterValue.trim().toLowerCase()
  if (!query) return true
  const { name, email } = row.original
  return (name ?? '').toLowerCase().includes(query) || (email ?? '').toLowerCase().includes(query)
}

interface UsersTableProps {
  users: AdminUser[]
}

export default function UsersTable({ users: initialUsers }: UsersTableProps) {
  const [users, setUsers] = useState(initialUsers)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [deleting, setDeleting] = useState(false)

  const columnFilters = useMemo(
    () => (roleFilter ? [{ id: 'role', value: roleFilter }] : []),
    [roleFilter],
  )

  const handleRoleChange = async (userId: string, role: string | null) => {
    if (!role || role === 'ROOT') return

    setPendingId(userId)
    try {
      const { webhookOk } = await updateUserRole(userId, role as Exclude<AdminUser['role'], 'ROOT'>)
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: role as AdminUser['role'] } : u)),
      )
      notifyInfo(`Zmieniono rolę na „${ROLE_LABELS[role as Exclude<AdminUser['role'], 'ROOT'>]}”.`)
      if (!webhookOk) {
        notifyWarning('Rola została zmieniona, ale powiadomienie webhooka nie zostało wysłane.')
      }
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Nie udało się zmienić roli.')
    } finally {
      setPendingId(null)
    }
  }

  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        id: 'name',
        header: 'Użytkownik',
        accessorFn: (u) => u.name ?? u.email ?? '',
        sortingFn: 'text',
        cell: ({ row }) => (
          <Group gap="sm">
            <Avatar
              src={row.original.image ?? undefined}
              alt={row.original.name ?? row.original.email ?? ''}
              radius="xl"
              size="sm"
            />
            <div>
              <Text size="sm" fw={500}>
                {row.original.name ?? 'Bez nazwy'}
              </Text>
              <Text size="xs" c="dimmed">
                {maskEmail(row.original.email)}
              </Text>
            </div>
          </Group>
        ),
      },
      {
        id: 'role',
        header: 'Rola',
        accessorFn: (u) => u.role,
        filterFn: (row, columnId, filterValue: string) =>
          !filterValue || row.getValue(columnId) === filterValue,
        cell: ({ row }) => {
          const user = row.original
          return user.role === 'ROOT' ? (
            <Badge color="mangetsu">Administrator</Badge>
          ) : (
            <Select
              data={ROLE_OPTIONS}
              value={user.role}
              onChange={(value) => handleRoleChange(user.id, value)}
              disabled={pendingId === user.id}
              size="xs"
              w={160}
              allowDeselect={false}
            />
          )
        },
      },
      {
        id: 'createdAt',
        header: 'Dołączył',
        accessorFn: (u) => u.createdAt,
        sortingFn: 'datetime',
        cell: ({ row }) => (
          <Text size="sm" c="dimmed">
            {new Date(row.original.createdAt).toLocaleDateString('pl-PL')}
          </Text>
        ),
      },
      {
        id: 'actions',
        header: 'Akcje',
        enableSorting: false,
        cell: ({ row }) => {
          const user = row.original
          if (user.role === 'ROOT') return null
          return (
            <Tooltip label="Usuń użytkownika">
              <ActionIcon color="red" variant="subtle" onClick={() => setDeleteTarget(user)}>
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          )
        },
      },
    ],
    [pendingId],
  )

  const table = useReactTable({
    data: users,
    columns,
    state: { sorting, columnFilters, globalFilter: search },
    onSortingChange: setSorting,
    onColumnFiltersChange: (updater) => {
      const next = typeof updater === 'function' ? updater(columnFilters) : updater
      setRoleFilter((next.find((f) => f.id === 'role')?.value as string | undefined) ?? null)
    },
    onGlobalFilterChange: setSearch,
    globalFilterFn: matchesSearch,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const handleDeleteConfirm = async (userId: string, notify: boolean) => {
    setDeleting(true)
    try {
      const { webhookOk } = await deleteUser(userId, notify)
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      notifyInfo('Użytkownik został usunięty.')
      if (!webhookOk) {
        notifyWarning('Użytkownik został usunięty, ale powiadomienie webhooka nie zostało wysłane.')
      }
      setDeleteTarget(null)
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Nie udało się usunąć użytkownika.')
    } finally {
      setDeleting(false)
    }
  }

  const sortIcon = (direction: false | 'asc' | 'desc') => {
    if (direction === 'asc') return <IconArrowUp size={14} />
    if (direction === 'desc') return <IconArrowDown size={14} />
    return <IconArrowsSort size={14} />
  }

  return (
    <div>
      <Group mb="md" gap="sm">
        <TextInput
          placeholder="Szukaj po imieniu lub e-mailu…"
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
          w={280}
        />
        <Select
          placeholder="Wszystkie role"
          data={ROLE_FILTER_OPTIONS}
          value={roleFilter}
          onChange={setRoleFilter}
          w={180}
          clearable
        />
      </Group>
      <Table verticalSpacing="sm" visibleFrom="md">
        <Table.Thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Table.Th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className={header.column.getCanSort() ? 'cursor-pointer select-none' : undefined}
                >
                  <Group gap={4} wrap="nowrap">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && sortIcon(header.column.getIsSorted())}
                  </Group>
                </Table.Th>
              ))}
            </Table.Tr>
          ))}
        </Table.Thead>
        <Table.Tbody>
          {table.getRowModel().rows.map((row) => (
            <Table.Tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <Table.Td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Stack hiddenFrom="md" gap="sm">
        {table.getRowModel().rows.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="md">
            Brak wyników.
          </Text>
        ) : (
          table.getRowModel().rows.map((row) => {
            const user = row.original
            return (
              <Paper key={user.id} withBorder p="sm" radius="md">
                <Group justify="space-between" wrap="nowrap" align="flex-start">
                  <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                    <Avatar
                      src={user.image ?? undefined}
                      alt={user.name ?? user.email ?? ''}
                      radius="xl"
                      size="sm"
                    />
                    <div style={{ minWidth: 0 }}>
                      <Text size="sm" fw={500} truncate="end">
                        {user.name ?? 'Bez nazwy'}
                      </Text>
                      <Text size="xs" c="dimmed" truncate="end">
                        {maskEmail(user.email)}
                      </Text>
                    </div>
                  </Group>
                  {user.role !== 'ROOT' && (
                    <Tooltip label="Usuń użytkownika">
                      <ActionIcon color="red" variant="subtle" onClick={() => setDeleteTarget(user)}>
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Group>
                <Group justify="space-between" align="center" mt="sm">
                  {user.role === 'ROOT' ? (
                    <Badge color="mangetsu">Administrator</Badge>
                  ) : (
                    <Select
                      data={ROLE_OPTIONS}
                      value={user.role}
                      onChange={(value) => handleRoleChange(user.id, value)}
                      disabled={pendingId === user.id}
                      size="xs"
                      w={160}
                      allowDeselect={false}
                    />
                  )}
                  <Text size="xs" c="dimmed">
                    {new Date(user.createdAt).toLocaleDateString('pl-PL')}
                  </Text>
                </Group>
              </Paper>
            )
          })
        )}
      </Stack>

      <DeleteUserModal
        key={deleteTarget?.id}
        user={deleteTarget}
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
