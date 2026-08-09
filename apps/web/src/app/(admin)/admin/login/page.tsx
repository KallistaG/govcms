'use client';

import * as React from 'react';
import { useAuth } from '../../../../context/auth-context';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
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
  Checkbox,
  Alert,
  AlertTitle,
  AlertDescription,
  Badge,
} from '@govcms/ui';

export default function LoginPage() {
  const { login, forgotPassword, isAuthenticated, isLoading, error, clearError } = useAuth();
  const router = useRouter();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [showForgotModal, setShowForgotModal] = React.useState(false);
  const [forgotEmail, setForgotEmail] = React.useState('');
  const [forgotSubmitting, setForgotSubmitting] = React.useState(false);
  const [forgotResult, setForgotResult] = React.useState<{
    message: string;
    resetToken?: string;
    resetUrl?: string;
  } | null>(null);

  React.useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/admin/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    clearError();

    const success = await login(email, password, rememberMe);
    setIsSubmitting(false);

    if (success) {
      router.push('/admin/dashboard');
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setForgotSubmitting(true);
    try {
      const res = await forgotPassword(forgotEmail);
      setForgotResult(res);
    } finally {
      setForgotSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-white/10 text-white border border-white/20 backdrop-blur-md shadow-xl mb-2">
            <Building2 className="h-7 w-7 text-amber-400" />
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <Badge variant="outline" className="text-[10px] font-bold text-amber-300 border-amber-400/40 bg-amber-400/10">
              <ShieldCheck className="h-3 w-3 mr-1" /> Official Government Portal
            </Badge>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">GovCMS Admin Portal</h1>
          <p className="text-xs text-slate-300">Unified Government Management System Engine</p>
        </div>

        <Card className="shadow-2xl border-white/10 bg-card/95 backdrop-blur-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-bold">Sign In to Dashboard</CardTitle>
            <CardDescription className="text-xs">
              Enter your official government credentials to manage portal content.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleLoginSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="py-2.5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="text-xs font-bold">Authentication Error</AlertTitle>
                  <AlertDescription className="text-[11px]">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">Official Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@gov.ph"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    className="text-xs text-primary font-semibold hover:underline"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotResult(null);
                      setShowForgotModal(true);
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="pl-9 pr-10"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(c) => setRememberMe(!!c)}
                  />
                  <Label htmlFor="remember" className="text-xs cursor-pointer">
                    Remember session
                  </Label>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex-col space-y-4 pt-2">
              <Button type="submit" className="w-full font-bold h-10 shadow-lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying Security Credentials...
                  </>
                ) : (
                  'Sign In to Admin Portal'
                )}
              </Button>

              <div className="w-full border-t pt-4">
                <p className="text-[11px] font-bold text-muted-foreground mb-2 text-center">
                  Demo Fast Credentials
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-[11px] h-8"
                    onClick={() => handleQuickLogin('superadmin@gov.ph')}
                  >
                    Super Admin
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-[11px] h-8"
                    onClick={() => handleQuickLogin('admin@gov.ph')}
                  >
                    Agency Admin
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-[11px] h-8"
                    onClick={() => handleQuickLogin('editor@gov.ph')}
                  >
                    Content Editor
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-[11px] h-8"
                    onClick={() => handleQuickLogin('publisher@gov.ph')}
                  >
                    Publisher
                  </Button>
                </div>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Modal: Forgot Password */}
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <Card className="w-full max-w-md shadow-2xl border bg-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-primary" /> Password Recovery Request
                </CardTitle>
                <CardDescription className="text-xs">
                  Enter your registered government email to receive password reset authorization links.
                </CardDescription>
              </CardHeader>

              {forgotResult ? (
                <CardContent className="space-y-3">
                  <Alert variant="default" className="border-emerald-500/50 bg-emerald-500/10">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <AlertTitle className="text-xs font-bold text-emerald-600">Request Sent</AlertTitle>
                    <AlertDescription className="text-xs text-foreground">
                      {forgotResult.message}
                    </AlertDescription>
                  </Alert>

                  {forgotResult.resetUrl && (
                    <div className="p-3 bg-muted rounded border space-y-1">
                      <p className="text-[11px] font-bold text-muted-foreground">Demo Reset URL:</p>
                      <a
                        href={forgotResult.resetUrl}
                        className="text-xs text-primary font-mono font-bold break-all hover:underline"
                        onClick={() => setShowForgotModal(false)}
                      >
                        {forgotResult.resetUrl}
                      </a>
                    </div>
                  )}

                  <CardFooter className="px-0 pt-2 flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => setShowForgotModal(false)}>
                      Close
                    </Button>
                  </CardFooter>
                </CardContent>
              ) : (
                <form onSubmit={handleForgotSubmit}>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="forgotEmail">Official Email</Label>
                      <Input
                        id="forgotEmail"
                        type="email"
                        placeholder="user@gov.ph"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>

                  <CardFooter className="flex justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowForgotModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="font-bold" disabled={forgotSubmitting}>
                      {forgotSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Submit Recovery
                    </Button>
                  </CardFooter>
                </form>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
