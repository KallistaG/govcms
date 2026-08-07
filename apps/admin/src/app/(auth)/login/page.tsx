'use client';

import * as React from 'react';
import { useAuth } from '../../../context/auth-context';
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

  // Forgot Password Dialog state
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
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    const success = await login(email, password, rememberMe);
    setIsSubmitting(false);

    if (success) {
      router.push('/dashboard');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setForgotSubmitting(true);
    setForgotResult(null);

    try {
      const res = await forgotPassword(forgotEmail);
      setForgotResult(res);
    } catch (err: any) {
      setForgotResult({ message: err.message || 'Error requesting reset link' });
    } finally {
      setForgotSubmitting(false);
    }
  };

  const fillQuickCredential = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    clearError();
  };

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-background">
      {/* Left Column: Government Seal Branding & Security Banner */}
      <div className="relative flex flex-col justify-between p-8 lg:w-1/2 bg-primary text-primary-foreground overflow-hidden">
        {/* Background Decorative Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground shadow-lg font-black text-xl">
            <Building2 className="h-6 w-6 text-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">GovCMS</h1>
            <p className="text-xs text-primary-foreground/80 font-medium">Republic Government CMS Platform</p>
          </div>
        </div>

        <div className="relative z-10 my-12 max-w-lg space-y-4">
          <Badge variant="secondary" className="px-3 py-1 font-bold text-xs uppercase tracking-wider">
            Official Portal • ISO 27001 Certified
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            Secure Government Communications Engine
          </h2>
          <p className="text-sm text-primary-foreground/85 leading-relaxed">
            Authorized portal for managing official press releases, executive orders, public notices, and agency digital services with role-based governance.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4 text-xs font-semibold">
            <div className="flex items-center gap-2 rounded-lg bg-white/10 p-3 backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4 text-secondary" />
              <span>Multi-Factor Authentication</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/10 p-3 backdrop-blur-sm">
              <KeyRound className="h-4 w-4 text-secondary" />
              <span>Session Audit Logging</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-primary-foreground/60">
          © 2026 Republic Government Communications Platform. All rights reserved.
        </div>
      </div>

      {/* Right Column: Modern Login Form */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Sign In to GovCMS</h2>
            <p className="text-xs text-muted-foreground">
              Enter your official government email address and password to continue.
            </p>
          </div>

          {/* Quick Demo Role Selector Pills */}
          <div className="rounded-lg border bg-card p-3 space-y-2 text-xs">
            <span className="font-semibold text-muted-foreground text-[11px] block uppercase tracking-wider">
              ⚡ Demo Role Quick-Select:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] py-0"
                onClick={() => fillQuickCredential('superadmin@gov.ph')}
              >
                Super Admin
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] py-0"
                onClick={() => fillQuickCredential('admin@gov.ph')}
              >
                Administrator
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] py-0"
                onClick={() => fillQuickCredential('editor@gov.ph')}
              >
                Editor
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] py-0"
                onClick={() => fillQuickCredential('publisher@gov.ph')}
              >
                Publisher
              </Button>
            </div>
          </div>

          {/* Alert Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Official Government Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@gov.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotResult(null);
                    setShowForgotModal(true);
                  }}
                  className="text-xs text-primary font-medium hover:underline focus:outline-none"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-9"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(!!checked)}
              />
              <Label htmlFor="remember" className="font-normal text-xs text-muted-foreground cursor-pointer">
                Remember me on this trusted terminal (30 Days)
              </Label>
            </div>

            <Button type="submit" className="w-full h-10 font-bold" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying Credentials...
                </>
              ) : (
                'Sign In to Dashboard'
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal Dialog */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" /> Reset Credentials
              </CardTitle>
              <CardDescription>
                Enter your official email address to receive password reset instructions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {forgotResult ? (
                <div className="space-y-3">
                  <Alert variant="success">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Reset Link Issued</AlertTitle>
                    <AlertDescription>{forgotResult.message}</AlertDescription>
                  </Alert>

                  {forgotResult.resetUrl && (
                    <div className="p-3 bg-muted rounded-md text-xs space-y-1 font-mono">
                      <span className="font-bold text-foreground block font-sans">
                        🧪 Demo Local Reset Link:
                      </span>
                      <a
                        href={forgotResult.resetUrl}
                        className="text-primary underline break-all font-semibold"
                        onClick={() => setShowForgotModal(false)}
                      >
                        {forgotResult.resetUrl}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="forgotEmail">Official Email</Label>
                    <Input
                      id="forgotEmail"
                      type="email"
                      placeholder="name@gov.ph"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={forgotSubmitting}>
                    {forgotSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Requesting...
                      </>
                    ) : (
                      'Send Reset Instructions'
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotResult(null);
                }}
              >
                Close
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
