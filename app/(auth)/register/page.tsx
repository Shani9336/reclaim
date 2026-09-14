'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Loader2, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !email.trim() || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create account via registration API
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      toast({
        title: 'Account created successfully! 🎉',
        description: 'Signing you in now...',
      });

      // 2. Automatically log in user with the new credentials
      const signInRes = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl: '/browse',
      });

      if (signInRes?.ok) {
        router.push('/browse');
        router.refresh();
      } else {
        router.push('/login');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setLoading(false);
    }
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
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <CardDescription>Join FoundIt to report and track lost & found items</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Account created! Logging you in...</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Shani Yadav"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>

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
                <Label htmlFor="password">Password (min. 6 characters)</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <Button type="submit" className="w-full gap-2 mt-4" disabled={loading || success}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Create Account
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-muted-foreground pt-0">
            Already have an account?{' '}
            <Link href="/login" className="ml-1 text-primary font-medium hover:underline">
              Sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
