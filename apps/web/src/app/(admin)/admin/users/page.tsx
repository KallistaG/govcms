'use client';

import * as React from 'react';
import {
  useUsersList,
  useCreateUser,
  useUpdateUser,
  useResetUserPassword,
  useToggleUserStatus,
  UserData,
  RoleEnum,
} from '../../../../hooks/use-users';
import { UserModal } from '../../../../components/users/user-modal';
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  Key,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Input,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Checkbox,
} from '@govcms/ui';

export default function UserManagementPage() {
  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('ALL');

  const [isUserModalOpen, setIsUserModalOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<UserData | null>(null);

  const { data: users = [], isLoading } = useUsersList(search, roleFilter);
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const resetPasswordMutation = useResetUserPassword();
  const toggleStatusMutation = useToggleUserStatus();

  const handleCreateUser = () => {
    setEditingUser(null);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user: UserData) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  const handleUserFormSubmit = async (formData: Partial<UserData> & { password?: string }) => {
    if (editingUser) {
      const updated: any = await updateUserMutation.mutateAsync({ id: editingUser.id, data: formData });
      toast.success(`Updated staff profile for ${formData.firstName} ${formData.lastName}`);
      if (updated?.temporaryPassword) {
        toast.info(`Temporary password: ${updated.temporaryPassword}`);
      }
    } else {
      const created: any = await createUserMutation.mutateAsync(formData);
      toast.success(`Created new user account for ${formData.email}`);
      if (created?.temporaryPassword) {
        toast.info(`Temporary password: ${created.temporaryPassword}`);
      }
    }
  };

  const handleResetPassword = async (user: UserData) => {
    if (confirm(`Reset security password for ${user.firstName} ${user.lastName} (${user.email})?`)) {
      const result: any = await resetPasswordMutation.mutateAsync({ id: user.id });
      toast.info(`Password reset instructions issued for ${user.email}`);
      if (result?.temporaryPassword) {
        toast.info(`Temporary password: ${result.temporaryPassword}`);
      }
    }
  };

  const handleToggleStatus = async (user: UserData) => {
    const nextState = !user.isActive;
    await toggleStatusMutation.mutateAsync({ id: user.id, isActive: nextState });
    toast.success(`User status updated to ${nextState ? 'Active' : 'Suspended'}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <UsersIcon className="h-6 w-6 text-primary" /> Staff User Management & Role Access
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage government staff accounts, RBAC roles (SUPER_ADMIN, ADMINISTRATOR, EDITOR, PUBLISHER), and status.
          </p>
        </div>

        <Button onClick={handleCreateUser} className="font-bold gap-1 shadow-xs">
          <UserPlus className="h-4 w-4" /> Add Staff Account
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search user name, email, or department..."
              className="pl-9 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-semibold"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            <option value="ADMINISTRATOR">ADMINISTRATOR</option>
            <option value="EDITOR">EDITOR</option>
            <option value="PUBLISHER">PUBLISHER</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>User Profile</TableHead>
              <TableHead>System Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-xs text-muted-foreground">
                  Loading user directory...
                </TableCell>
              </TableRow>
            ) : users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-foreground">
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">{user.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={user.role === 'SUPER_ADMIN' ? 'destructive' : 'default'} className="text-[10px] font-bold">
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{user.department || 'Public Information Office'}</TableCell>
                <TableCell>
                  {user.isActive ? (
                    <Badge variant="success" className="text-[10px] gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] gap-1 text-rose-500 border-rose-500/40">
                      <XCircle className="h-3 w-3" /> Suspended
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                      <Edit className="h-3.5 w-3.5 mr-1 text-primary" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleResetPassword(user)}>
                      <Key className="h-3.5 w-3.5 text-amber-500" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(user)}>
                      {user.isActive ? <XCircle className="h-3.5 w-3.5 text-destructive" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSubmit={handleUserFormSubmit}
        initialData={editingUser}
      />
    </div>
  );
}
