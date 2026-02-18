import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { login } from '../utils/auth';

export default function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        setTimeout(() => {
            const success = login(email, password);
            if (success) {
                navigate('/');
            } else {
                setError('Invalid email or password. Please try again.');
            }
            setIsLoading(false);
        }, 600);
    };

    return (
        <div className="min-h-screen flex">
            {/* Left — Hero Image */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80"
                    alt="Modern interior design"
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
                            Welcome Back
                        </p>
                        <h2 className="font-serif text-4xl xl:text-5xl text-white leading-tight mb-4">
                            Your Space,<br />
                            Your <span className="italic">Story</span>
                        </h2>
                        <p className="text-white/50 text-sm leading-relaxed max-w-sm">
                            Sign in to explore curated collections and manage your personalized design journey.
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
                        NORDIQ
                    </Link>
                    <p className="text-[12px] tracking-[0.2em] uppercase text-charcoal/40 mb-10">
                        Sign in to your account
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
                                    placeholder="Enter your password"
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

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group w-full flex items-center justify-center gap-3 bg-charcoal text-white px-8 py-4 text-[13px] tracking-[0.15em] uppercase hover:bg-charcoal-light transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                        >
                            {isLoading ? (
                                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Demo Credentials */}
                    <div className="mt-8 px-4 py-3 bg-stone-light border border-stone text-[12px] text-charcoal/50 rounded">
                        <span className="font-medium text-charcoal/70">Demo:</span>{' '}
                        admin@gmail.com / 1234
                    </div>

                    {/* Register Link */}
                    <p className="mt-8 text-center text-[13px] text-charcoal/50">
                        Don't have an account?{' '}
                        <Link
                            to="/register"
                            className="text-charcoal font-medium hover:underline underline-offset-4 transition-colors"
                        >
                            Create one
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
