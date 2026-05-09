import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Lock, Mail, AlertCircle, Chrome } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const checkAdminAccess = async (user: any) => {
    const userEmail = (user.email || '').toLowerCase();
    
    // Bootstrap Admin check
    if (userEmail === 'danielajibade50@gmail.com') {
      const { data: userDoc } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (!userDoc || userDoc.role !== 'admin') {
        // Initialize/Sync bootstrap admin
        await supabase.from('profiles').upsert({
          id: user.id,
          display_name: user.user_metadata?.full_name || 'Supreme Admin',
          email: userEmail,
          role: 'admin',
          status: 'active',
          updated_at: new Date().toISOString()
        });
      }
      return true;
    }

    const { data: userDoc } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (userDoc) {
      const role = userDoc.role;
      if (role === 'admin' || role === 'editor') {
        return true;
      }
    }
    return false;
  };

  const onGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/admin'
        }
      });
      if (error) throw error;
      // the redirect handles the rest, but checkAdminAccess runs in auth state change listeners
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      toast.error('Google Sign-In failed. Please try again.', { duration: 8000 });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });
      if (error) throw error;

      const isAuthorized = await checkAdminAccess(authData.user);

      if (isAuthorized) {
        toast.success('Access Granted. Interface initialized.');
        navigate('/admin'); // or wherever the admin dashboard is
      } else {
        await supabase.auth.signOut();
        toast.error('Unauthorized: Account restricted from admin access.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let message = 'Verification failed. Credentials rejected.';
      
      const errorMessage = error.message || '';

      if (errorMessage.includes('Invalid login credentials')) {
        message = 'Invalid sequence. Authentication denied.';
      }
      
      toast.error(message, { duration: 8000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-4 text-white selection:bg-kph-red selection:text-white relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-kph-red/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="z-10 w-full max-w-md"
      >
        <Card className="border-white/10 bg-black/40 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
          <CardHeader className="space-y-4 text-center pb-8 border-b border-white/5 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-kph-red to-transparent" />
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-kph-red to-neutral-900 shadow-2xl shadow-kph-red/20 mb-2 border border-white/10">
              <span className="font-serif text-4xl font-black text-white italic">K</span>
            </div>
            <div>
              <CardTitle className="font-serif text-3xl tracking-tight text-white font-black italic">Eminent Console</CardTitle>
              <CardDescription className="text-white/40 uppercase tracking-[0.2em] text-[9px] font-black mt-2">
                Kwara Political Hangout — Restricted Access
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-8">
            <Button
              variant="outline"
              onClick={onGoogleSignIn}
              disabled={isLoading || isGoogleLoading}
              className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold h-12 transition-all flex gap-3 text-xs uppercase tracking-widest"
            >
              {isGoogleLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <Chrome className="h-4 w-4 text-sky-400" />
              )}
              Sign in with Corporate Google
            </Button>

            <div className="relative flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-white/5" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white/20">or credential bypass</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] uppercase tracking-[0.1em] text-white/40 font-black">Email Identity</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-kph-red transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@kph.ng"
                    className="bg-white/[0.03] border-white/10 pl-10 focus:border-kph-red/50 focus:ring-0 text-sm h-12 transition-all"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="flex items-center gap-1 text-[10px] text-destructive font-black uppercase tracking-tighter italic">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[10px] uppercase tracking-[0.1em] text-white/40 font-black">Secure Passphrase</Label>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-kph-red transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    className="bg-white/[0.03] border-white/10 pl-10 focus:border-kph-red/50 focus:ring-0 text-sm h-12 transition-all"
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="flex items-center gap-1 text-[10px] text-destructive font-black uppercase tracking-tighter italic">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full bg-white text-black hover:bg-neutral-200 transition-all font-black h-12 shadow-2xl shadow-white/5 disabled:opacity-50 text-xs uppercase tracking-widest mt-4"
              >
                {isLoading ? "Authenticating..." : "Establish Connection"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="pb-8 flex flex-col gap-4">
            <p className="text-center text-[10px] text-white/20 font-bold uppercase tracking-tighter">
              Authorized Access Logged: <span className="text-white/40 font-black">{new Date().toLocaleDateString()}</span>
            </p>
          </CardFooter>
        </Card>

        <div className="mt-8 flex justify-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/10">
          <span>Security v4.2</span>
          <span>•</span>
          <span>Encrypted Bridge</span>
          <span>•</span>
          <span>Protocol KPH</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
