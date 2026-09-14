'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogIn, Chrome, ShieldAlert, KeyRound, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/browse';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleCredentialsLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both your email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        setErrorMsg('Invalid email or password. Please try again.');
      } else if (res?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Helper for 1-click test credentials
  function fillDemoAccount(demoEmail: string) {
    setEmail(demoEmail);
    setPassword('password123');
    setErrorMsg('');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-red-500 flex items-center justify-center text-white shadow-sm">
              <span className="font-heading font-extrabold text-base">R</span>
            </div>
            <span className="font-heading font-extrabold text-2xl tracking-tight">
              Re<span className="text-red-500">Claim</span>
            </span>
          </Link>
        </div>

        <Card className="shadow-md">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Email & Password Form */}
            <form onSubmit={handleCredentialsLogin} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" className="w-full gap-2 mt-2" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                Sign In
              </Button>
            </form>

            {/* Quick Demo Accounts */}
            <div className="rounded-xl border bg-muted/40 p-3 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Quick Sign-In (Password: <code>password123</code>)</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-semibold"
                  onClick={() => fillDemoAccount('shaniyadav777am@gmail.com')}
                >
                  👑 Leader (Shani)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 font-semibold"
                  onClick={() => fillDemoAccount('alice@example.com')}
                >
                  👤 Alice (Student)
                </Button>
              </div>
            </div>

            {/* Optional Google Login */}
            {process.env.NEXT_PUBLIC_ENABLE_GOOGLE === 'true' && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  type="button"
                  className="w-full gap-2"
                  onClick={() => {
                    setGoogleLoading(true);
                    signIn('google', { callbackUrl });
                  }}
                  disabled={googleLoading}
                >
                  {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Chrome className="h-4 w-4" />}
                  Continue with Google
                </Button>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-muted-foreground pt-0">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="ml-1 text-primary font-medium hover:underline">
              Create an account
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
