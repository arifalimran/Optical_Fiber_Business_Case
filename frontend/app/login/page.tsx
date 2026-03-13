'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Cable, AlertCircle, Loader2, ShieldAlert, Mail, Lock, CheckCircle2, HelpCircle, UserCog, MessageSquare } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const [errorField, setErrorField] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  
  // Email validation
  const validateEmail = (value: string) => {
    setEmail(value);
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    setEmailValid(isValid && value.length > 0);
  };
  
  // Password validation
  const validatePassword = (value: string) => {
    setPassword(value);
    setPasswordValid(value.length >= 6);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setHint('');
    setErrorField('');
    setLoading(true);

    try {
      await login(email, password, rememberMe);
    } catch (err: any) {
      try {
        const errorData = JSON.parse(err.message);
        setError(errorData.error || 'Login failed. Please try again.');
        setHint(errorData.hint || '');
        setErrorField(errorData.field || '');
      } catch {
        setError(err.message || 'Login failed. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <Card className="w-full max-w-md shadow-2xl border-2 backdrop-blur-sm bg-background/95 relative z-10">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-600 rounded-2xl blur-xl opacity-50 animate-pulse" />
              <div className="relative p-4 bg-gradient-to-br from-primary via-blue-600 to-purple-600 rounded-2xl shadow-lg">
                <Cable className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center text-base">
            Sign in to your Optical Fiber Business Case account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border-2 border-red-200 dark:border-red-900 shadow-md">
                  <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold text-red-800 dark:text-red-300">{error}</p>
                    {hint && (
                      <p className="text-xs text-red-600 dark:text-red-400">{hint}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold">
                <div className="p-1 rounded-md bg-primary/10">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                </div>
                Email Address
              </Label>
              <div className="relative group">
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@opticalfiber.com"
                  value={email}
                  onChange={(e) => validateEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading}
                  className={`pr-10 transition-all duration-200 ${
                    errorField === 'email' 
                      ? 'border-red-500 focus:ring-red-500 bg-red-50/50 dark:bg-red-950/20' 
                      : emailValid 
                      ? 'border-green-500 focus:ring-green-500 bg-green-50/50 dark:bg-green-950/20' 
                      : 'group-hover:border-primary/50'
                  }`}
                />
                {emailValid && !loading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle2 className="h-4 w-4 text-green-600 animate-in zoom-in duration-200" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold">
                <div className="p-1 rounded-md bg-primary/10">
                  <Lock className="h-3.5 w-3.5 text-primary" />
                </div>
                Password
              </Label>
              <div className="relative group">
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => validatePassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  className={`pr-10 transition-all duration-200 ${
                    errorField === 'password' 
                      ? 'border-red-500 focus:ring-red-500 bg-red-50/50 dark:bg-red-950/20' 
                      : passwordValid 
                      ? 'border-green-500 focus:ring-green-500 bg-green-50/50 dark:bg-green-950/20' 
                      : 'group-hover:border-primary/50'
                  }`}
                />
                {passwordValid && !loading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle2 className="h-4 w-4 text-green-600 animate-in zoom-in duration-200" />
                  </div>
                )}
              </div>
              {password && !passwordValid && (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 animate-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="h-3 w-3" />
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remember" 
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                disabled={loading}
              />
              <label
                htmlFor="remember"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Remember me for 30 days
              </label>
            </div>

            <Button 
              type="submit" 
              className="w-full gap-2 h-11 bg-gradient-to-r from-primary via-blue-600 to-purple-600 hover:from-primary/90 hover:via-blue-600/90 hover:to-purple-600/90 text-white font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              disabled={loading || !emailValid || !passwordValid}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Sign In</span>
                </>
              )}
            </Button>

            {/* Forgot Password */}
            <div className="text-center">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="link" className="text-sm gap-2 text-muted-foreground hover:text-foreground">
                    <HelpCircle className="h-3 w-3" />
                    Forgot your password?
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-primary" />
                      Password Recovery
                    </DialogTitle>
                    <DialogDescription>
                      Need help accessing your account? Contact your administrator.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {/* Admin Contact */}
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                      <div className="flex items-start gap-3">
                        <UserCog className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                            Contact System Administrator
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                            Your administrator can reset your password from the Settings page.
                          </p>
                          <div className="space-y-1">
                            <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              admin@opticalfiber.com
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
                              <MessageSquare className="h-3 w-3" />
                              Contact via internal messaging
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="p-4 rounded-lg bg-muted border border-border">
                      <p className="font-medium text-sm mb-2">What to include in your request:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>Your full name and registered email address</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>Department or team you belong to</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>Reason for password reset (if security concern, mention it)</span>
                        </li>
                      </ul>
                    </div>

                    {/* Security Tip */}
                    <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                      <div className="flex items-start gap-2">
                        <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 dark:text-amber-300">
                          <strong>Security Tip:</strong> Never share your password with anyone, including administrators. 
                          Your new password will be set securely by the system.
                        </p>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="mt-6 pt-6 border-t border-border/50">
              <div className="text-sm text-center space-y-3">
                <div className="font-semibold text-foreground flex items-center justify-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  Test Credentials
                </div>
                <div className="space-y-2">
                  {[
                    { role: 'Admin', email: 'admin@opticalfiber.com', pass: 'admin123', color: 'purple' },
                    { role: 'Analyst', email: 'analyst@opticalfiber.com', pass: 'analyst123', color: 'green' },
                    { role: 'Approver', email: 'approver@opticalfiber.com', pass: 'approver123', color: 'blue' }
                  ].map((cred) => (
                    <div key={cred.role} className="p-2.5 rounded-lg bg-muted/50 hover:bg-muted/80 border border-border/50 transition-all duration-200 hover:shadow-md hover:border-primary/30">
                      <p className="text-xs">
                        <span className="font-semibold text-primary">{cred.role}:</span>{' '}
                        <span className="text-muted-foreground">{cred.email} / {cred.pass}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
