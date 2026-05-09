import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import Logo from '../components/Logo';
import { toast } from 'sonner';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isWriterSignup, setIsWriterSignup] = useState(false);
  const navigate = useNavigate();

  const handlePostAuthRedirect = async (user: any, signupRole?: string) => {
    try {
      const { data: userDoc, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      const userEmail = (user.email || '').toLowerCase();
      
      // Bootstrap Admin: If the supreme admin logs in, ensure they have the admin role in Supabase
      const BOOTSTRAP_ADMINS = ['danielajibade50@gmail.com', 'abdulrahmanadebambo@gmail.com'];
      if (BOOTSTRAP_ADMINS.includes(userEmail)) {
        if (!userDoc || userDoc.role !== 'admin') {
          await supabase.from('profiles').upsert({
            id: user.id,
            display_name: user.user_metadata?.full_name || fullName || 'Supreme Admin',
            email: user.email,
            role: 'admin',
            status: 'active',
            updated_at: new Date().toISOString()
          });
        }
        toast.success(`Welcome Supreme Admin, ${user.user_metadata?.full_name || 'Sir'}.`);
        navigate('/admin');
        return;
      }

      if (!userDoc && !error) {
         // Should not happen if trigger works, but just in case
      }

      // If they just signed up, update their role if they chose writer
      if (signupRole) {
        await supabase.from('profiles').upsert({
            id: user.id,
            display_name: user.user_metadata?.full_name || fullName || 'New Member',
            email: user.email,
            role: signupRole,
            status: signupRole === 'writer' ? 'pending' : 'active',
            updated_at: new Date().toISOString()
        });
        if (signupRole === 'writer') {
          toast.success('Application submitted! Your writer account is pending verification.');
          navigate('/dashboard');
        } else {
          toast.success('Welcome to Kwara Political Hangout!');
          navigate('/');
        }
        return;
      }

      if (userDoc) {
        const role = (userDoc.role || '').toLowerCase();
        const status = (userDoc.status || '').toLowerCase();

        if (status === 'suspended' || status === 'banned') {
          await supabase.auth.signOut();
          toast.error('Your account has been restricted. Please contact support.');
          return;
        }

        if (role === 'admin' || role === 'editor') {
          toast.success('Redirecting to Editorial Console...');
          navigate('/admin');
        } else if (role === 'writer') {
          if (status === 'pending') {
            toast.info('Your writer application is still pending review, but you can explore your studio.');
          }
          toast.success('Redirecting to Writer Studio...');
          navigate('/dashboard');
        } else {
          toast.success('Welcome back to Kwara Political Hangout.');
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Redirection error:', error);
      navigate('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        await handlePostAuthRedirect(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });
        if (error) throw error;
        // Use the selected role during signup
        if (data.user) {
            await handlePostAuthRedirect(data.user, isWriterSignup ? 'writer' : 'reader');
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      let message = 'Authentication failed. Please check your credentials.';
      
      const errorMessage = error.message || '';

      if (errorMessage.includes('User already registered')) {
        message = 'This email is already registered. We have moved you to the Sign In tab so you can proceed with your existing credentials.';
        setIsLogin(true);
      } else if (errorMessage.includes('Password should be')) {
        message = 'The password provided is too weak. Please use a stronger password.';
      } else if (errorMessage.includes('Invalid login credentials')) {
        message = 'Invalid email or password. Please try again.';
      }

      toast.error(message, { duration: 8000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
      // Note: With OAuth, the redirection handles the rest, but if it returns data we can redirect manually if needed.
    } catch (error: any) {
      console.error('Google Auth error:', error);
      toast.error('Google Sign-In failed.', { duration: 8000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex animate-fade-in">
      {/* Left Side - Visuals (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-kph-charcoal relative overflow-hidden items-center justify-center">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-kph-charcoal"></div>
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1575517111839-3a3843ee7f5d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
        
        <div className="relative z-10 p-16 text-white max-w-xl">
           <div className="mb-10">
             <Logo variant="light" className="scale-125 origin-left" />
           </div>
           <h1 className="text-5xl font-bold mb-6 leading-tight font-serif">
             Shape the Narrative of <span className="text-kph-red">Kwara State</span>
           </h1>
           <p className="text-xl text-gray-300 mb-10 leading-relaxed font-light">
             Join our premier network of political analysts, journalists, and community leaders. Gain access to exclusive insights and contribute to the discourse.
           </p>
           
           <div className="space-y-6">
              <div className="flex items-center space-x-4 group">
                 <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-kph-red group-hover:bg-kph-red group-hover:text-white transition-colors duration-300">
                    <CheckCircle size={24} />
                 </div>
                 <span className="font-medium text-lg">Publish articles to thousands of readers</span>
              </div>
              <div className="flex items-center space-x-4 group">
                 <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-kph-red group-hover:bg-kph-red group-hover:text-white transition-colors duration-300">
                    <CheckCircle size={24} />
                 </div>
                 <span className="font-medium text-lg">Access exclusive editorial tools</span>
              </div>
              <div className="flex items-center space-x-4 group">
                 <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-kph-red group-hover:bg-kph-red group-hover:text-white transition-colors duration-300">
                    <CheckCircle size={24} />
                 </div>
                 <span className="font-medium text-lg">Connect with policy makers</span>
              </div>
           </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="absolute top-6 right-6 lg:hidden">
            <Logo />
        </div>

        <div className="max-w-md w-full bg-white p-8 lg:p-10 rounded-3xl shadow-2xl border border-gray-100">
           
           <div className="mb-8 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-kph-charcoal mb-2 font-serif">
                {isLogin ? 'Welcome Back' : 'Join the Team'}
              </h2>
              <p className="text-gray-500">
                {isLogin ? 'Enter your credentials to access your dashboard.' : 'Create an account to start contributing.'}
              </p>
           </div>

           {/* Tabs */}
           <div className="flex p-1.5 bg-gray-100 rounded-xl mb-8">
              <button 
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-300 ${isLogin ? 'bg-white text-kph-charcoal shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Sign In
              </button>
              <button 
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-300 ${!isLogin ? 'bg-white text-kph-charcoal shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Create Account
              </button>
           </div>

           <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                 <div className="space-y-2 animate-slide-down">
                    <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                    <div className="relative group">
                       <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-kph-red transition-colors" size={20} />
                       <input 
                         type="text" 
                         className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-kph-red focus:bg-white focus:ring-4 focus:ring-red-50/50 transition-all font-medium"
                         placeholder="John Doe"
                         value={fullName}
                         onChange={(e) => setFullName(e.target.value)}
                         required={!isLogin}
                       />
                    </div>
                 </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
                <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-kph-red transition-colors" size={20} />
                    <input 
                        type="email" 
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-kph-red focus:bg-white focus:ring-4 focus:ring-red-50/50 transition-all font-medium"
                        placeholder="writer@kphnews.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                    <label className="text-sm font-bold text-gray-700">Password</label>
                    {isLogin && <a href="#" className="text-xs font-bold text-kph-red hover:underline">Forgot password?</a>}
                </div>
                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-kph-red transition-colors" size={20} />
                    <input 
                        type="password" 
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-kph-red focus:bg-white focus:ring-4 focus:ring-red-50/50 transition-all font-medium"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
              </div>

              {!isLogin && (
                  <div className="space-y-4 animate-slide-down">
                    <div className="flex items-center gap-3 p-4 bg-red-50/50 border border-red-100 rounded-xl cursor-pointer hover:bg-red-50 transition-colors" onClick={() => setIsWriterSignup(!isWriterSignup)}>
                        <input 
                          type="checkbox" 
                          checked={isWriterSignup}
                          onChange={(e) => setIsWriterSignup(e.target.checked)}
                          className="w-5 h-5 rounded text-kph-red focus:ring-kph-red border-gray-300"
                        />
                        <div>
                          <p className="text-sm font-bold text-kph-charcoal leading-none mb-1">Apply for Writer Portal</p>
                          <p className="text-[10px] text-gray-500 font-medium">Contribute articles and shape Kwara's political narrative.</p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-3 text-sm text-gray-500 px-1">
                      <input type="checkbox" className="mt-1 w-4 h-4 rounded text-kph-red focus:ring-kph-red border-gray-300" required />
                      <span>I agree to the <a href="#" className="text-kph-charcoal font-bold hover:underline">Terms of Service</a> and <a href="#" className="text-kph-charcoal font-bold hover:underline">Privacy Policy</a>.</span>
                    </div>
                  </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-kph-red text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:bg-red-900 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : (
                    <>
                        {isLogin ? 'Sign In' : 'Create Account'} 
                        {!isLoading && <ArrowRight size={20} />}
                    </>
                )}
              </button>
           </form>

           <div className="mt-8">
              <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
              </div>

              <div className="mt-6 flex gap-4 justify-center">
                 <button 
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-bold text-sm text-gray-700 group"
                 >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 group-hover:scale-110 transition-transform" alt="Google" />
                    Google
                 </button>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};

export default Auth;