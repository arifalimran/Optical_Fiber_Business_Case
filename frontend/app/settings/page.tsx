'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth/useAuth';
import { Shield, Users, Lock, Search, RefreshCw, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface UserListItem {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        toast.error('Failed to load users');
      }
    } catch (error) {
      toast.error('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setResetting(true);
    try {
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: selectedUser.id,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Password reset successfully', {
          description: `Password for ${selectedUser.fullName} has been updated`,
        });
        setSelectedUser(null);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.error || 'Failed to reset password');
      }
    } catch (error) {
      toast.error('Error resetting password');
    } finally {
      setResetting(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-6 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-amber-500" />
              <div>
                <CardTitle>Access Restricted</CardTitle>
                <CardDescription>Administrator privileges required</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You need administrator access to view this page. Please contact your system administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          Admin Settings
        </h1>
        <p className="text-muted-foreground mt-2">Manage users and reset passwords</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>User Management</CardTitle>
            </div>
            <CardDescription>Search and select users to manage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {users.length === 0 && (
              <Button onClick={fetchUsers} className="w-full gap-2" disabled={loading}>
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4" />
                    Load Users
                  </>
                )}
              </Button>
            )}

            {/* User List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedUser?.id === u.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{u.fullName}</p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-700'
                              : u.role === 'APPROVER'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {u.role}
                        </span>
                        {u.isActive ? (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-red-600">
                            <AlertCircle className="h-3 w-3" />
                            Disabled
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {users.length > 0 && filteredUsers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
            )}
          </CardContent>
        </Card>

        {/* Password Reset */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <CardTitle>Reset Password</CardTitle>
            </div>
            <CardDescription>Set a new password for selected user</CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedUser ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Select a user from the list to reset their password</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Selected User Info */}
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Resetting password for:</p>
                  <p className="font-semibold text-lg">{selectedUser.fullName}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password (min. 8 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={resetting}
                  />
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={resetting}
                  />
                </div>

                {/* Password Requirements */}
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                  <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">
                    Password Requirements:
                  </p>
                  <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-0.5">
                    <li className="flex items-center gap-1">
                      {newPassword.length >= 8 ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      ) : (
                        <span className="h-3 w-3">•</span>
                      )}
                      At least 8 characters
                    </li>
                    <li className="flex items-center gap-1">
                      {/[A-Z]/.test(newPassword) ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      ) : (
                        <span className="h-3 w-3">•</span>
                      )}
                      One uppercase letter
                    </li>
                    <li className="flex items-center gap-1">
                      {/[0-9]/.test(newPassword) ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      ) : (
                        <span className="h-3 w-3">•</span>
                      )}
                      One number
                    </li>
                    <li className="flex items-center gap-1">
                      {newPassword === confirmPassword && newPassword.length > 0 ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      ) : (
                        <span className="h-3 w-3">•</span>
                      )}
                      Passwords match
                    </li>
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleResetPassword}
                    className="flex-1 gap-2"
                    disabled={
                      resetting ||
                      !newPassword ||
                      !confirmPassword ||
                      newPassword !== confirmPassword ||
                      newPassword.length < 8
                    }
                  >
                    {resetting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Reset Password
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedUser(null)} disabled={resetting}>
                    Cancel
                  </Button>
                </div>

                {/* Email Notification Info */}
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      <strong>Note:</strong> The user will need to be notified manually about their new password.
                      Consider enabling email notifications in production.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
