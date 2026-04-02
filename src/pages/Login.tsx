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
    <div className="min-h-screen w-full relative bg-black overflow-hidden selection:bg-dash-purple/30 text-white">
      
      {/* Full Screen Spline 3D Background */}
      <div className="absolute inset-0 z-0 opacity-90 transition-opacity duration-1000 hover:opacity-100">
        <iframe 
          src="https://my.spline.design/ailandingpagewebdesign3danimation-0SEbEmw99pkiVgOVYQRvfXoj/" 
          frameBorder="0" 
          width="100%" 
          height="100%"
          title="NexDrive AI Visualization"
          className="w-full h-full pointer-events-auto"
        ></iframe>
      </div>
      
      {/* Gradient Overlays for Text Readability */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-black/10"></div>
      <div className="absolute inset-y-0 left-0 w-full lg:w-2/3 pointer-events-none z-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
      <div className="absolute inset-y-0 right-0 w-full lg:w-1/2 pointer-events-none z-0 bg-gradient-to-l from-black/80 via-black/30 to-transparent"></div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full min-h-screen flex flex-col lg:flex-row items-center justify-between px-6 lg:px-24">
        
        {/* Left Side: Typography */}
        <div className="w-full lg:w-1/2 pointer-events-none pt-24 lg:pt-0">
          <h1 className="text-5xl lg:text-[4.5rem] font-bold tracking-tight text-[#e0e0e0] leading-[1.1] mb-8 font-sans drop-shadow-lg">
            Welcome Back To<br />NexDrive Dashboard
          </h1>
          <p className="text-lg lg:text-xl text-[#b0b0b0] leading-relaxed font-light max-w-[480px]">
            Follow your fleet in real-time. Gain better insights, track vehicle performance, and manage operations seamlessly with our intelligent platform.
          </p>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full lg:w-[460px] mt-16 lg:mt-0 pb-24 lg:pb-0 pointer-events-auto">
          <Card className="w-full relative bg-[#121214]/40 backdrop-blur-3xl border border-white/10 shadow-[0_8px_40px_rgb(0,0,0,0.6)] rounded-3xl overflow-hidden transition-all duration-300">
            
            {/* Top highlight bar */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-dash-purple/60 to-transparent" />

            <CardHeader className="space-y-4 pt-10 pb-6">
              <div>
                <CardTitle className="text-3xl font-heading font-bold text-white tracking-tight mb-2 selection:bg-dash-purple/30 text-center">
                  Sign In
                </CardTitle>
                <CardDescription className="text-gray-400 text-sm text-center">
                  Access your NexDrive admin dashboard
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="px-8 pb-10">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {errorMessage && (
                  <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={18} className="flex-shrink-0" />
                    <span className="font-medium">{errorMessage}</span>
                  </div>
                )}

                <div className="space-y-2.5">
                  <Label htmlFor="email" className="text-gray-300 text-xs uppercase tracking-wider font-semibold ml-1">
                    Email
                  </Label>
                  <div className="relative group">
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@nexdrive.io"
                      className="h-12 bg-black/40 border-white/10 text-white placeholder:text-gray-600 focus:bg-black/60 focus:border-dash-purple/60 focus:ring-1 focus:ring-dash-purple/60 rounded-xl transition-all duration-200"
                      {...register('email')}
                    />
                    <div className="absolute inset-0 rounded-xl border border-dash-purple/0 group-hover:border-dash-purple/30 pointer-events-none transition-colors duration-300" />
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-xs mt-1.5 ml-1 font-medium flex items-center gap-1.5">
                      <AlertCircle size={12} /> {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between ml-1">
                    <Label htmlFor="password" className="text-gray-300 text-xs uppercase tracking-wider font-semibold">
                      Password
                    </Label>
                    <a href="#" className="text-xs text-dash-purple hover:text-dash-purple/80 transition-colors">
                      Forgot?
                    </a>
                  </div>
                  <div className="relative group">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="h-12 pr-12 bg-black/40 border-white/10 text-white placeholder:text-gray-500 focus:bg-black/60 focus:border-dash-purple/60 focus:ring-1 focus:ring-dash-purple/60 rounded-xl transition-all duration-200"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <div className="absolute inset-0 rounded-xl border border-dash-purple/0 group-hover:border-dash-purple/30 pointer-events-none transition-colors duration-300" />
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-xs mt-1.5 ml-1 font-medium flex items-center gap-1.5">
                      <AlertCircle size={12} /> {errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full h-12 mt-6 bg-white hover:bg-gray-100 text-black font-semibold rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 active:translate-y-0"
                >
                  {isLoggingIn ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin text-black" />
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    <span className="text-[15px]">Sign in to Dashboard</span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>



    </div>
  );
};

export default Login;
