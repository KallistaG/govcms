'use client';

import * as React from 'react';
import { useAuth } from '../../../../context/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Label,
  Alert,
  AlertTitle,
  AlertDescription,
} from '@govcms/ui';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const { resetPassword } = useAuth();
  const router = useRouter();

  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setStatusMessage({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await resetPassword(token, newPassword);
      setStatusMessage({ type: 'success', text: res.message || 'Password successfully updated!' });
      setTimeout(() => {
        router.push('/admin/login');
      }, 2000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to update password.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl border-white/10 bg-card/95 backdrop-blur-xl">
      <CardHeader className="text-center space-y-1">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
          <KeyRound className="h-6 w-6" />
        </div>
        <CardTitle className="text-xl font-bold">Reset Your Password</CardTitle>
        <CardDescription className="text-xs">
          Set up a secure new password for your government account.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {statusMessage && (
            <Alert variant={statusMessage.type === 'success' ? 'default' : 'destructive'}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle className="text-xs font-bold">
                {statusMessage.type === 'success' ? 'Success' : 'Error'}
              </AlertTitle>
              <AlertDescription className="text-xs">{statusMessage.text}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="newPassword"
                type="password"
                placeholder="At least 8 characters"
                className="pl-9"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter new password"
                className="pl-9"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <Button type="submit" className="w-full font-bold" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating Credentials...
              </>
            ) : (
              'Save New Password'
            )}
          </Button>
          <Button type="button" variant="ghost" className="w-full text-xs" onClick={() => router.push('/admin/login')}>
            Return to Login
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-4">
      <React.Suspense fallback={<div className="text-white text-xs">Loading form...</div>}>
        <ResetPasswordContent />
      </React.Suspense>
    </div>
  );
}
