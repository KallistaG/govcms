'use client';

import * as React from 'react';
import { UserData, RoleEnum } from '../../hooks/use-users';
import { User, X } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardFooter, Input, Label } from '@govcms/ui';

const DEPARTMENTS = [
  'Public Information Office',
  'IT & Digital Services',
  'Legal & Compliance',
  'Executive Office',
  'Finance & Administration',
  'Policy & Planning',
];

const AVAILABLE_PERMISSIONS = [
  { id: 'content:create', label: 'Create Articles & Pages' },
  { id: 'content:publish', label: 'Publish / Unpublish Content' },
  { id: 'media:upload', label: 'Upload & Manage Media Assets' },
  { id: 'menu:manage', label: 'Configure Navigation Menus' },
  { id: 'theme:manage', label: 'Manage Website Theme' },
  { id: 'users:manage', label: 'User Account Management' },
];

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<UserData> & { password?: string }) => Promise<void>;
  initialData?: UserData | null;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState<RoleEnum>('EDITOR');
  const [department, setDepartment] = React.useState('Public Information Office');
  const [phone, setPhone] = React.useState('');
  const [avatarUrl, setAvatarUrl] = React.useState('');
  const [selectedPermissions, setSelectedPermissions] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (initialData) {
      setFirstName(initialData.firstName);
      setLastName(initialData.lastName);
      setEmail(initialData.email);
      setPassword('');
      setRole(initialData.role);
      setDepartment(initialData.department || 'Public Information Office');
      setPhone(initialData.phone || '');
      setAvatarUrl(initialData.avatarUrl || '');
      setSelectedPermissions(
        Array.isArray(initialData.permissions)
          ? initialData.permissions
          : typeof initialData.permissions === 'string'
          ? JSON.parse(initialData.permissions || '[]')
          : [],
      );
    } else {
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setRole('EDITOR');
      setDepartment('Public Information Office');
      setPhone('');
      setAvatarUrl('');
      setSelectedPermissions(['content:create', 'media:upload']);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleTogglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        firstName,
        lastName,
        email,
        password: password || undefined,
        role,
        department,
        phone: phone || null,
        avatarUrl: avatarUrl || null,
        permissions: selectedPermissions,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-lg shadow-2xl border bg-card max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {initialData ? 'Edit User Profile' : 'Create New Staff User'}
              </CardTitle>
              <CardDescription className="text-xs">
                Configure user account details, system roles, department tags, and permissions.
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Official Agency Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="e.g. maria.santos@dict.gov.ph"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {!initialData && (
            <div className="space-y-1.5">
              <Label htmlFor="password">Initial Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Leave blank for auto-generated password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>System Role</Label>
              <select
                className="border rounded-lg px-3 py-2 text-xs w-full bg-background"
                value={role}
                onChange={(e) => setRole(e.target.value as RoleEnum)}
              >
                <option value="SUPER_ADMIN">SUPER_ADMIN (Full System Access)</option>
                <option value="ADMINISTRATOR">ADMINISTRATOR (Agency Admin)</option>
                <option value="EDITOR">EDITOR (Content Author)</option>
                <option value="PUBLISHER">PUBLISHER (Approver & Publisher)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Agency Department</Label>
              <select
                className="border rounded-lg px-3 py-2 text-xs w-full bg-background"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+63 917 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="avatarUrl">Avatar Image URL</Label>
              <Input
                id="avatarUrl"
                placeholder="https://..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <Label className="text-xs font-bold">Custom Permission Overrides</Label>
            <div className="grid grid-cols-2 gap-2 border rounded-lg p-3 bg-muted/20">
              {AVAILABLE_PERMISSIONS.map((perm) => {
                const isChecked = selectedPermissions.includes(perm.id);
                return (
                  <label
                    key={perm.id}
                    className="flex items-center gap-2 text-xs cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded accent-primary"
                      checked={isChecked}
                      onChange={() => handleTogglePermission(perm.id)}
                    />
                    <span className="truncate">{perm.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <CardFooter className="px-0 pt-4 border-t flex justify-end gap-2 shrink-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="font-bold">
              {initialData ? 'Save User Profile' : 'Create Staff User'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
