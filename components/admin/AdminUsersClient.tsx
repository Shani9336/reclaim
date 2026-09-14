'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';
import {
  Users, ShieldCheck, ShieldAlert, Crown, Search,
  Loader2, UserCheck, UserX, AlertCircle, Sparkles
} from 'lucide-react';

interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  createdAt: string | Date;
  _count: {
    items: number;
    claims: number;
  };
}

interface AdminUsersClientProps {
  initialUsers: UserRecord[];
  currentUserEmail: string;
}

export function AdminUsersClient({ initialUsers, currentUserEmail }: AdminUsersClientProps) {
  const [users, setUsers] = useState<UserRecord[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | 'ADMINS' | 'USERS'>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Statistics
  const totalCount = users.length;
  const adminCount = users.filter((u) => ['ADMIN', 'SUPER_ADMIN'].includes(u.role)).length;
  const memberCount = users.filter((u) => !['ADMIN', 'SUPER_ADMIN'].includes(u.role)).length;

  // Filtered list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterRole === 'ADMINS') {
      return ['ADMIN', 'SUPER_ADMIN'].includes(u.role);
    }
    if (filterRole === 'USERS') {
      return !['ADMIN', 'SUPER_ADMIN'].includes(u.role);
    }
    return true;
  });

  async function handleRoleChange(targetUserId: string, newRole: 'ADMIN' | 'USER') {
    const target = users.find((u) => u.id === targetUserId);
    if (!target) return;

    if (target.email.toLowerCase() === 'shaniyadav777am@gmail.com' || target.role === 'SUPER_ADMIN') {
      toast({
        title: 'Action Prohibited',
        description: 'You cannot change the role of the Project Leader.',
        variant: 'destructive',
      });
      return;
    }

    setUpdatingId(targetUserId);

    try {
      const res = await fetch('/api/admin/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, role: newRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user role');
      }

      // Optimistically update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, role: newRole } : u))
      );

      toast({
        title: newRole === 'ADMIN' ? '🛡️ Admin Promoted' : '👤 Admin Revoked',
        description: `${target.name || target.email} is now set to ${newRole}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error updating role',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Crown className="h-6 w-6 text-amber-500" />
          <h1 className="font-heading text-3xl font-bold">User Role Management</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          As the Project Leader, you have exclusive control to appoint or revoke administrator privileges for students and staff.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card">
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Users</p>
              <p className="text-2xl font-heading font-extrabold mt-1">{totalCount}</p>
            </div>
            <div className="p-3 rounded-2xl bg-muted/60 text-foreground">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-red-200/50 dark:border-red-900/30">
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-red-500 uppercase tracking-wider">Admins / Staff</p>
              <p className="text-2xl font-heading font-extrabold mt-1 text-red-600 dark:text-red-400">{adminCount}</p>
            </div>
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-500">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Students & Members</p>
              <p className="text-2xl font-heading font-extrabold mt-1">{memberCount}</p>
            </div>
            <div className="p-3 rounded-2xl bg-muted/60 text-muted-foreground">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            {/* Role filter buttons */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <Button
                type="button"
                variant={filterRole === 'ALL' ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs font-semibold"
                onClick={() => setFilterRole('ALL')}
              >
                All ({users.length})
              </Button>
              <Button
                type="button"
                variant={filterRole === 'ADMINS' ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs font-semibold"
                onClick={() => setFilterRole('ADMINS')}
              >
                Admins ({adminCount})
              </Button>
              <Button
                type="button"
                variant={filterRole === 'USERS' ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs font-semibold"
                onClick={() => setFilterRole('USERS')}
              >
                Members ({memberCount})
              </Button>
            </div>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Current Role</th>
                  <th className="px-4 py-3 text-center">Items Reported</th>
                  <th className="px-4 py-3">Joined Date</th>
                  <th className="px-4 py-3 text-right">Admin Control</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No users match your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSuperAdmin =
                      u.role === 'SUPER_ADMIN' ||
                      u.email.toLowerCase() === 'shaniyadav777am@gmail.com';
                    const isAdmin = u.role === 'ADMIN';
                    const isSelf = u.email.toLowerCase() === currentUserEmail.toLowerCase();
                    const isUpdating = updatingId === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                        {/* User info */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {u.image ? (
                              <Image
                                src={u.image}
                                alt={u.name || ''}
                                width={36}
                                height={36}
                                className="rounded-full ring-1 ring-border shrink-0"
                              />
                            ) : (
                              <div className="h-9 w-9 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-300 font-bold text-xs flex items-center justify-center shrink-0">
                                {u.name?.[0]?.toUpperCase() || u.email[0]?.toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-sm truncate">{u.name || 'Anonymous User'}</span>
                                {isSuperAdmin && (
                                  <Crown className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" title="Project Leader" />
                                )}
                                {isSelf && (
                                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                                    You
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role badge */}
                        <td className="px-4 py-3">
                          {isSuperAdmin ? (
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 gap-1 font-semibold">
                              <Crown className="h-3 w-3" /> Project Leader
                            </Badge>
                          ) : isAdmin ? (
                            <Badge variant="info" className="gap-1 font-semibold">
                              <ShieldCheck className="h-3 w-3" /> Staff Admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Member</Badge>
                          )}
                        </td>

                        {/* Reports count */}
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold">{u._count.items}</span>
                        </td>

                        {/* Joined Date */}
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(u.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {isSuperAdmin ? (
                            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                              Permanent Leader
                            </span>
                          ) : isAdmin ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isUpdating}
                              onClick={() => handleRoleChange(u.id, 'USER')}
                              className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40 gap-1.5 font-medium"
                            >
                              {isUpdating ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <UserX className="h-3.5 w-3.5" />
                              )}
                              Revoke Admin
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isUpdating}
                              onClick={() => handleRoleChange(u.id, 'ADMIN')}
                              className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/5 gap-1.5 font-medium"
                            >
                              {isUpdating ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ShieldCheck className="h-3.5 w-3.5" />
                              )}
                              Make Admin
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
