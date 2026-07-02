import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data: any) => {
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast.success('Logged in successfully!');
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setAuthError('Invalid email or password.');
      } else if (error.code === 'auth/operation-not-allowed') {
        setAuthError('Email/Password sign-in is not enabled. Please enable it in the Firebase console.');
      } else {
        setAuthError(error.message || 'Failed to log in.');
      }
      toast.error('Failed to log in');
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setIsGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          role: 'customer',
          displayName: user.displayName,
          createdAt: new Date().toISOString()
        });
      }

      toast.success('Logged in successfully with Google!');
      navigate('/');
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        setAuthError('Login cancelled.');
      } else if (error.code === 'auth/operation-not-allowed') {
        setAuthError('Google sign-in is not enabled. Please enable it in the Firebase console.');
      } else {
        setAuthError(error.message || 'Google Authentication failed.');
      }
      toast.error('Failed to log in with Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        
        {/* Tabs */}
        <div className="flex border-b border-slate-100 mb-8">
          <Link to="/login" className="flex-1 pb-3 text-center font-bold text-[#6157d6] border-b-2 border-[#6157d6]">
            Login
          </Link>
          <Link to="/register" className="flex-1 pb-3 text-center font-medium text-slate-500 hover:text-slate-800">
            Register
          </Link>
        </div>
        
        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-[22px] font-bold text-slate-900 mb-1.5 flex items-center justify-center gap-2">
            Welcome Back <span className="text-xl">👋</span>
          </h1>
          <p className="text-[13px] text-slate-500 font-medium">Login to continue to your account</p>
        </div>
        
        {/* Google Button */}
        <button 
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          type="button" 
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-bold text-slate-700 text-sm mb-6"
        >
          {isGoogleLoading ? (
            <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          Continue with Google
        </button>
        
        {/* Divider */}
        <div className="flex items-center mb-6">
          <div className="flex-1 h-[1px] bg-slate-100"></div>
          <span className="px-4 text-[11px] font-semibold text-slate-400">or continue with</span>
          <div className="flex-1 h-[1px] bg-slate-100"></div>
        </div>
        
        {authError && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">
            {authError}
          </div>
        )}

        {/* Input Fields */}
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
           <div className="relative">
             <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
             <input 
               type="email" 
               placeholder="Email Address" 
               className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-[13px] font-medium focus:outline-none focus:border-[#6157d6] focus:ring-1 focus:ring-[#6157d6] placeholder-slate-400 transition-colors"
               {...register('email', { required: 'Email is required' })}
             />
             {errors.email && <p className="text-red-500 text-xs mt-1 pl-1 font-medium">{errors.email.message as string}</p>}
           </div>

           <div className="relative">
             <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
             <input 
               type={showPassword ? "text" : "password"} 
               placeholder="Password" 
               className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl text-[13px] font-medium focus:outline-none focus:border-[#6157d6] focus:ring-1 focus:ring-[#6157d6] placeholder-slate-400 transition-colors"
               {...register('password', { required: 'Password is required' })}
             />
             <button 
               type="button" 
               onClick={() => setShowPassword(!showPassword)}
               className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
             >
               {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
             </button>
             {errors.password && <p className="text-red-500 text-xs mt-1 pl-1 font-medium">{errors.password.message as string}</p>}
           </div>
           
           <button 
             type="submit"
             disabled={isSubmitting}
             className="w-full py-3.5 bg-[#6157d6] text-white rounded-xl font-bold text-[15px] shadow-lg shadow-[#6157d6]/20 hover:bg-[#534ac0] transition-colors mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
           >
             {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
             ) : 'Login'}
           </button>
        </form>
        
        <div className="mt-8 text-center text-[13px] font-medium text-slate-600">
          Don't have an account? <Link to="/register" className="font-bold text-[#6157d6] hover:text-[#4d45a9] transition-colors">Register</Link>
        </div>
      </div>
    </div>
  );
}
