import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';

export default function Newsletter() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-100px' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) setSubmitted(true);
    };

    return (
        <section className="py-28 lg:py-40 bg-stone-light">
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7 }}
                className="mx-auto max-w-2xl px-6 text-center"
            >
                <p className="text-[12px] tracking-[0.3em] uppercase text-stone-dark mb-4">
                    Stay Connected
                </p>
                <h2 className="font-serif text-3xl md:text-4xl text-charcoal mb-4">
                    Join the <span className="italic">CeylonVista</span> World
                </h2>
                <p className="text-charcoal/50 text-sm leading-relaxed mb-10 max-w-md mx-auto">
                    Be the first to discover new collections, design insights, and
                    exclusive offers delivered to your inbox.
                </p>

                {!submitted ? (
                    <form onSubmit={handleSubmit} className="flex max-w-md mx-auto">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Your email address"
                            required
                            className="flex-1 bg-white px-5 py-4 text-[13px] text-charcoal placeholder:text-charcoal/30 border border-stone focus:outline-none focus:border-charcoal/30 transition-colors"
                        />
                        <button
                            type="submit"
                            className="bg-charcoal text-white px-6 py-4 hover:bg-charcoal-light transition-colors flex items-center gap-2 text-[13px] tracking-[0.1em] uppercase"
                        >
                            <span className="hidden sm:inline">Subscribe</span>
                            <ArrowRight size={16} />
                        </button>
                    </form>
                ) : (
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sage-dark text-sm font-medium"
                    >
                        Thank you! You'll hear from us soon.
                    </motion.p>
                )}
            </motion.div>
        </section>
    );
}
