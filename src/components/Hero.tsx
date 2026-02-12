import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
    return (
        <section id="top" className="relative min-h-screen flex items-end pb-20 lg:pb-28 overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0">
                <img
                    src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1920&q=80"
                    alt="Scandinavian living room with minimalist furniture"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-charcoal/20 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 w-full">
                <div className="max-w-2xl">
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="text-[12px] tracking-[0.3em] uppercase text-white/70 mb-6"
                    >
                        Scandinavian Design Studio
                    </motion.p>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="font-serif text-5xl md:text-7xl lg:text-8xl text-white leading-[0.95] mb-8"
                    >
                        Elevate
                        <br />
                        Your Living
                        <br />
                        <span className="italic">Space</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.7 }}
                        className="text-white/60 text-sm md:text-base leading-relaxed max-w-md mb-10"
                    >
                        Timeless pieces crafted with precision and care. Where Scandinavian
                        minimalism meets artisan craftsmanship.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.9 }}
                        className="flex items-center gap-6"
                    >
                        <a
                            href="#shop"
                            className="group inline-flex items-center gap-3 bg-white text-charcoal px-8 py-4 text-[13px] tracking-[0.15em] uppercase hover:bg-cream transition-colors duration-300"
                        >
                            Explore Collection
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                        </a>
                        <a
                            href="#about"
                            className="text-[13px] tracking-[0.15em] uppercase text-white/70 hover:text-white transition-colors duration-300 border-b border-white/30 pb-0.5"
                        >
                            Our Story
                        </a>
                    </motion.div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="absolute bottom-8 right-10 hidden lg:flex flex-col items-center gap-3"
            >
                <span className="text-[10px] tracking-[0.2em] uppercase text-white/40 [writing-mode:vertical-lr]">
                    Scroll
                </span>
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-px h-12 bg-gradient-to-b from-white/40 to-transparent"
                />
            </motion.div>
        </section>
    );
}
