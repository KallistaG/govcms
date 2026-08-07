'use client';

import * as React from 'react';
import {
  useUsersList,
  useCreateUser,
  useUpdateUser,
  useResetPassword,
  useDeleteUser,
  UserData,
  RoleEnum,
} from '../../../hooks/use-users';
import { UserModal } from '../../../components/users/user-modal';
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  Key,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
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
  const [deptFilter, setDeptFilter] = React.useState('ALL');
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<UserData | null>(null);
  const [resetPassResult, setResetPassResult] = React.useState<{ email: string; pass: string } | null>(null);

  // Queries & Mutations
  const { data: users = [], isLoading } = useUsersList(search, roleFilter, deptFilter);
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const resetPasswordMutation = useResetPassword();
  const deleteUserMutation = useDeleteUser();

  const handleCreateUser = () => {
    setEditingUser(null);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user: UserData) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  const handleUserModalSubmit = async (formData: Partial<UserData> & { password?: string }) => {
    if (editingUser) {
      await updateUserMutation.mutateAsync({ id: editingUser.id, data: formData });
      toast.success(`Updated profile for ${formData.firstName} ${formData.lastName}`);
    } else {
      await createUserMutation.mutateAsync(formData);
      toast.success(`Created staff account for ${formData.firstName} ${formData.lastName}`);
    }
  };

  const handleToggleStatus = async (user: UserData) => {
    const nextState = !user.isActive;
    await updateUserMutation.mutateAsync({
      id: user.id,
      data: { isActive: nextState },
    });
    toast.info(`Account status for ${user.firstName} is now ${nextState ? 'Active' : 'Inactive'}`);
  };

  const handleResetPassword = async (user: UserData) => {
    if (confirm(`Reset password for ${user.firstName} ${user.lastName} (${user.email})?`)) {
      const res = await resetPasswordMutation.mutateAsync({ id: user.id });
      setResetPassResult({ email: user.email, pass: res.tempPassword });
      toast.success(`Temporary password generated for ${user.firstName}`);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Are you sure you want to delete this staff user account?')) {
      await deleteUserMutation.mutateAsync(id);
      toast.error('Staff account deleted');
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(users.map((u: UserData) => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const getRoleBadge = (role: RoleEnum) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Badge className="bg-purple-600 text-white font-bold text-[10px]">SUPER_ADMIN</Badge>;
      case 'ADMINISTRATOR':
        return <Badge className="bg-blue-600 text-white font-bold text-[10px]">ADMINISTRATOR</Badge>;
      case 'PUBLISHER':
        return <Badge className="bg-amber-600 text-white font-bold text-[10px]">PUBLISHER</Badge>;
      case 'EDITOR':
      default:
        return <Badge variant="outline" className="font-bold text-[10px]">EDITOR</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <UsersIcon className="h-6 w-6 text-primary" /> Agency User Management
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage staff accounts, assign RBAC roles, tag agency departments, and reset passwords.
          </p>
        </div>

        <Button onClick={handleCreateUser} className="font-bold gap-1 shadow-xs">
          <UserPlus className="h-4 w-4" /> Add Staff User
        </Button>
      </div>

      {/* Action & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card p-4 rounded-xl border shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <select
            className="border rounded-lg px-3 py-2 text-xs bg-background font-medium"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMINISTRATOR">Administrator</option>
            <option value="EDITOR">Editor</option>
            <option value="PUBLISHER">Publisher</option>
          </select>

          {/* Department Filter */}
          <select
            className="border rounded-lg px-3 py-2 text-xs bg-background font-medium"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="ALL">All Departments</option>
            <option value="Public Information Office">Public Info Office</option>
            <option value="IT & Digital Services">IT & Digital Services</option>
            <option value="Legal & Compliance">Legal & Compliance</option>
            <option value="Executive Office">Executive Office</option>
          </select>
        </div>
      </div>

      {/* Main Table Layout */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={selectedIds.length === users.length && users.length > 0}
                  onCheckedChange={(v) => handleSelectAll(!!v)}
                />
              </TableHead>
              <TableHead>User Name & Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                  Loading user accounts...
                </TableCell>
              </TableRow>
            ) : users.length > 0 ? (
              users.map((user: UserData) => {
                const isSelected = selectedIds.includes(user.id);
                const initials = `${user.firstName[0]}${user.lastName[0]}`;

                return (
                  <TableRow key={user.id} data-state={isSelected && 'selected'}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleSelect(user.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.firstName}
                            className="h-9 w-9 rounded-full object-cover border shrink-0"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs border">
                            {initials}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-xs text-foreground truncate">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="text-[11px] text-muted-foreground truncate">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground font-medium truncate">
                        {user.department || 'General Agency Staff'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className="cursor-pointer"
                        title="Click to toggle active status"
                      >
                        {user.isActive ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-bold gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-[10px] font-bold gap-1">
                            <XCircle className="h-3 w-3" /> Inactive
                          </Badge>
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleEditUser(user)}
                          title="Edit User Profile"
                        >
                          <Edit className="h-3.5 w-3.5 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-amber-600"
                          onClick={() => handleResetPassword(user)}
                          title="Reset User Password"
                        >
                          <Key className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-destructive"
                          onClick={() => handleDeleteUser(user.id)}
                          title="Delete User"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                  No staff user accounts match your search filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Password Reset Result Modal */}
      {resetPassResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border bg-card p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 font-bold">
              <Key className="h-5 w-5" /> Password Reset Generated
            </div>
            <p className="text-xs text-muted-foreground">
              A temporary login password has been set for <span className="font-bold text-foreground">{resetPassResult.email}</span>.
            </p>
            <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/30 font-mono text-sm font-bold text-primary">
              <span>{resetPassResult.pass}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => navigator.clipboard.writeText(resetPassResult.pass)}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setResetPassResult(null)} className="font-bold">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* User Edit / Create Modal */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSubmit={handleUserModalSubmit}
        initialData={editingUser}
      />
    </div>
  );
}
