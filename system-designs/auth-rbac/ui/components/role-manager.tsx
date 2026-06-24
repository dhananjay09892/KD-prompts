'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

interface Role {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  rolePermissions: { permission: { id: string; action: string; resource: string } }[]
}

interface Permission {
  id: string
  action: string
  resource: string
  description: string | null
}

interface User {
  id: string
  name: string
  email: string
  isActive: boolean
  userRoles: { role: Role }[]
}

interface RoleManagerProps {
  accessToken: string
}

export function RoleManager({ accessToken }: RoleManagerProps) {
  const qc = useQueryClient()
  const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: () => fetch('/api/roles', { headers }).then((r) => r.json()),
  })

  const { data: permissions = [] } = useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: () => fetch('/api/permissions', { headers }).then((r) => r.json()),
  })

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users', { headers }).then((r) => r.json()),
  })

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createRole = useMutation({
    mutationFn: (data: { name: string; description: string }) =>
      fetch('/api/roles', { method: 'POST', headers, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  })

  const deleteRole = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/roles/${id}`, { method: 'DELETE', headers }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  })

  const assignPermissions = useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      fetch(`/api/roles/${roleId}/permissions`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ permissionIds }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  })

  const assignRoles = useMutation({
    mutationFn: ({ userId, roleIds }: { userId: string; roleIds: string[] }) =>
      fetch(`/api/users/${userId}/roles`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ roleIds }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  // ── Local State ──────────────────────────────────────────────────────────
  const [newRole, setNewRole] = useState({ name: '', description: '' })
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

      {/* ── Create Role ───────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Create Role</h2>
        <div className="space-y-3">
          <input
            placeholder="Role name (e.g. editor)"
            value={newRole.name}
            onChange={(e) => setNewRole((p) => ({ ...p, name: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
          />
          <input
            placeholder="Description (optional)"
            value={newRole.description}
            onChange={(e) => setNewRole((p) => ({ ...p, description: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
          />
          <button
            onClick={() => {
              createRole.mutate(newRole)
              setNewRole({ name: '', description: '' })
            }}
            disabled={!newRole.name || createRole.isPending}
            className="w-full rounded-lg bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-40 transition-colors"
          >
            {createRole.isPending ? 'Creating…' : 'Create role'}
          </button>
        </div>

        {/* Role list */}
        <div className="mt-5 space-y-2">
          {roles.map((role) => (
            <div
              key={role.id}
              onClick={() => setSelectedRole(role)}
              className={cn(
                'flex items-center justify-between rounded-lg border px-3 py-2 cursor-pointer transition-colors',
                selectedRole?.id === role.id ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:bg-gray-50'
              )}
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{role.name}</p>
                <p className="text-xs text-gray-400">
                  {role.rolePermissions.length} permission{role.rolePermissions.length !== 1 ? 's' : ''}
                </p>
              </div>
              {!role.isSystem && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteRole.mutate(role.id) }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              )}
              {role.isSystem && (
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">system</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Assign Permissions to Role ────────────────────────────────── */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-1 text-sm font-semibold text-gray-900">Role Permissions</h2>
        {!selectedRole ? (
          <p className="text-sm text-gray-400 mt-3">Select a role to manage permissions</p>
        ) : (
          <>
            <p className="mb-4 text-xs text-gray-500">
              Editing: <span className="font-medium text-gray-800">{selectedRole.name}</span>
            </p>
            <PermissionPicker
              allPermissions={permissions}
              currentIds={selectedRole.rolePermissions.map((rp) => rp.permission.id)}
              onSave={(ids) => assignPermissions.mutate({ roleId: selectedRole.id, permissionIds: ids })}
              saving={assignPermissions.isPending}
            />
          </>
        )}
      </div>

      {/* ── Assign Roles to User ──────────────────────────────────────── */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">User Roles</h2>
        <div className="space-y-2 mb-4">
          {users.map((user) => (
            <div
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className={cn(
                'flex items-center justify-between rounded-lg border px-3 py-2 cursor-pointer transition-colors',
                selectedUser?.id === user.id ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:bg-gray-50'
              )}
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
              <div className="flex flex-wrap gap-1 max-w-[120px] justify-end">
                {user.userRoles.map((ur) => (
                  <span key={ur.role.id} className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                    {ur.role.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {selectedUser && (
          <>
            <p className="mb-2 text-xs text-gray-500">
              Editing: <span className="font-medium text-gray-800">{selectedUser.name}</span>
            </p>
            <RolePicker
              allRoles={roles}
              currentIds={selectedUser.userRoles.map((ur) => ur.role.id)}
              onSave={(ids) => assignRoles.mutate({ userId: selectedUser.id, roleIds: ids })}
              saving={assignRoles.isPending}
            />
          </>
        )}
      </div>
    </div>
  )
}

// ─── Permission Picker ────────────────────────────────────────────────────────

function PermissionPicker({
  allPermissions,
  currentIds,
  onSave,
  saving,
}: {
  allPermissions: Permission[]
  currentIds: string[]
  onSave: (ids: string[]) => void
  saving: boolean
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(currentIds))

  // Group by resource
  const grouped = allPermissions.reduce<Record<string, Permission[]>>((acc, p) => {
    ;(acc[p.resource] ??= []).push(p)
    return acc
  }, {})

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([resource, perms]) => (
        <div key={resource}>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{resource}</p>
          {perms.map((p) => (
            <label key={p.id} className="flex items-center gap-2 py-0.5 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.has(p.id)}
                onChange={() => toggle(p.id)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 font-mono">{p.action.split(':')[1]}</span>
            </label>
          ))}
        </div>
      ))}
      <button
        onClick={() => onSave([...selected])}
        disabled={saving}
        className="mt-2 w-full rounded-lg bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-40 transition-colors"
      >
        {saving ? 'Saving…' : 'Save permissions'}
      </button>
    </div>
  )
}

// ─── Role Picker ──────────────────────────────────────────────────────────────

function RolePicker({
  allRoles,
  currentIds,
  onSave,
  saving,
}: {
  allRoles: Role[]
  currentIds: string[]
  onSave: (ids: string[]) => void
  saving: boolean
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(currentIds))

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <div className="space-y-2">
      {allRoles.map((role) => (
        <label key={role.id} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.has(role.id)}
            onChange={() => toggle(role.id)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">{role.name}</span>
          {role.description && (
            <span className="text-xs text-gray-400">— {role.description}</span>
          )}
        </label>
      ))}
      <button
        onClick={() => onSave([...selected])}
        disabled={saving}
        className="mt-2 w-full rounded-lg bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-40 transition-colors"
      >
        {saving ? 'Saving…' : 'Save roles'}
      </button>
    </div>
  )
}
