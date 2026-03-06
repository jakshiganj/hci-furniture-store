import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { register } from '../utils/auth';
import SuccessOverlay from '../components/SuccessOverlay';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    // Track successful registration to show animated success message
    const [success, setSuccess] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password.length < 4) {
            setError('Password must be at least 4 characters.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);

        setTimeout(() => {
            const result = register(name, email, password);
            if (result.success) {
                // Show full-screen success overlay, then redirect to login after 2 seconds
                setSuccess('Account created successfully');
                setIsLoading(false);
                // Redirect to login page after 2 seconds
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setError(result.message);
                setIsLoading(false);
            }
        }, 600);
    };

    return (
        <>
            {/* Full-screen success overlay — appears on top after successful registration */}
            <AnimatePresence>
                {success && <SuccessOverlay message={success} />}
            </AnimatePresence>

            <div className="min-h-screen flex">
                {/* Left — Hero Image */}
                <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                    <img
                        src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80"
                        alt="Scandinavian furniture interior"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-charcoal/30" />
                    <div className="absolute inset-0 flex flex-col justify-end p-14">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                        >
                            <p className="text-[11px] tracking-[0.3em] uppercase text-white/60 mb-4">
                                Join Us
                            </p>
                            <h2 className="font-serif text-4xl xl:text-5xl text-white leading-tight mb-4">
                                Begin Your<br />
                                Design <span className="italic">Journey</span>
                            </h2>
                            <p className="text-white/50 text-sm leading-relaxed max-w-sm">
                                Create an account to save your favorites, track orders, and get exclusive design inspiration.
                            </p>
                        </motion.div>
                    </div>
                </div>

                {/* Right — Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center bg-cream px-6 py-12">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="w-full max-w-md"
                    >
                        {/* Back to Home */}
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 text-[12px] tracking-[0.15em] uppercase text-charcoal/50 hover:text-charcoal transition-colors duration-300 mb-12"
                        >
                            <ArrowLeft size={14} />
                            Back to Home
                        </Link>

                        {/* Brand */}
                        <Link to="/" className="block text-2xl tracking-[0.3em] font-serif text-charcoal mb-2">
                            CeylonVista
                        </Link>
                        <p className="text-[12px] tracking-[0.2em] uppercase text-charcoal/40 mb-10">
                            Create your account
                        </p>



                        {/* Error */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-[13px] rounded"
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-[11px] tracking-[0.15em] uppercase text-charcoal/60 mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="Your full name"
                                    className="w-full bg-white px-4 py-3.5 text-[13px] text-charcoal placeholder:text-charcoal/25 border border-stone focus:outline-none focus:border-charcoal/40 transition-colors duration-300"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] tracking-[0.15em] uppercase text-charcoal/60 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="you@example.com"
                                    className="w-full bg-white px-4 py-3.5 text-[13px] text-charcoal placeholder:text-charcoal/25 border border-stone focus:outline-none focus:border-charcoal/40 transition-colors duration-300"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] tracking-[0.15em] uppercase text-charcoal/60 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="At least 4 characters"
                                        className="w-full bg-white px-4 py-3.5 pr-12 text-[13px] text-charcoal placeholder:text-charcoal/25 border border-stone focus:outline-none focus:border-charcoal/40 transition-colors duration-300"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/30 hover:text-charcoal/60 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] tracking-[0.15em] uppercase text-charcoal/60 mb-2">
                                    Confirm Password
                                </label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="Re-enter your password"
                                    className="w-full bg-white px-4 py-3.5 text-[13px] text-charcoal placeholder:text-charcoal/25 border border-stone focus:outline-none focus:border-charcoal/40 transition-colors duration-300"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group w-full flex items-center justify-center gap-3 bg-charcoal text-white px-8 py-4 text-[13px] tracking-[0.15em] uppercase hover:bg-charcoal-light transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                            >
                                {isLoading ? (
                                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Create Account
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Login Link */}
                        <p className="mt-8 text-center text-[13px] text-charcoal/50">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="text-charcoal font-medium hover:underline underline-offset-4 transition-colors"
                            >
                                Sign in
                            </Link>
                        </p>
                    </motion.div>
                </div>
            </div>
        </>
    );
}
