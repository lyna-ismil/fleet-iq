import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const { login, isLoggingIn, loginError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data: LoginFormData) => {
    login({ email: data.email, password: data.password });
  };

  const errorMessage =
    loginError && 'response' in (loginError as any)
      ? (loginError as any).response?.data?.error?.message || 'Login failed'
      : loginError?.message || '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-dash-bg px-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-dash-purple/5 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-dash-purple/3 blur-[100px]" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-dash-border shadow-lg">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-dash-purple flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg font-heading">N</span>
          </div>
          <CardTitle className="text-2xl font-heading font-bold text-dash-text">
            Welcome back
          </CardTitle>
          <CardDescription className="text-dash-muted text-sm">
            Sign in to your NexDrive admin dashboard
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-dash-danger/10 border border-dash-danger/20 text-dash-danger text-sm">
                <AlertCircle size={16} className="flex-shrink-0" />
                {errorMessage}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-dash-text text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@nexdrive.io"
                className="h-11 border-dash-border focus:border-dash-purple focus:ring-dash-purple/20"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-dash-danger text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-dash-text text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="h-11 pr-10 border-dash-border focus:border-dash-purple focus:ring-dash-purple/20"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dash-muted hover:text-dash-text transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-dash-danger text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoggingIn}
              className="w-full h-11 bg-dash-purple hover:bg-dash-purple/90 text-white font-semibold transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-dash-muted">
            NexDrive Admin Dashboard v{import.meta.env.VITE_APP_VERSION || '1.0.0'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
