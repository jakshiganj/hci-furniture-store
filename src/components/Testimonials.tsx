import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

const testimonials = [
    {
        quote: "The Bergen coffee table transformed our living room. The quality is extraordinary — you can feel the craftsmanship in every detail.",
        author: 'Anna Lindström',
        location: 'Stockholm, Sweden',
        rating: 5,
    },
    {
        quote: "I've furnished my entire home with NORDIQ pieces. Three years later, every item still looks and feels brand new.",
        author: 'Marcus Weber',
        location: 'Copenhagen, Denmark',
        rating: 5,
    },
    {
        quote: "The white glove delivery made the whole experience effortless. From browsing to setup — absolutely seamless.",
        author: 'Elena Sørensen',
        location: 'Oslo, Norway',
        rating: 5,
    },
];

export default function Testimonials() {
    const [current, setCurrent] = useState(0);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-100px' });

    const next = () => setCurrent((c) => (c + 1) % testimonials.length);
    const prev = () => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length);

    return (
        <section className="py-28 lg:py-40 bg-charcoal text-white">
            <div className="mx-auto max-w-4xl px-6 lg:px-10">
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7 }}
                    className="text-center"
                >
                    <p className="text-[12px] tracking-[0.3em] uppercase text-white/40 mb-12">
                        What Our Clients Say
                    </p>

                    {/* Stars */}
                    <div className="flex justify-center gap-1 mb-8">
                        {Array.from({ length: testimonials[current].rating }).map((_, i) => (
                            <Star key={i} size={14} fill="currentColor" className="text-sage" />
                        ))}
                    </div>

                    {/* Quote */}
                    <motion.blockquote
                        key={current}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="font-serif text-2xl md:text-3xl lg:text-4xl leading-snug text-white/90 mb-10 italic"
                    >
                        "{testimonials[current].quote}"
                    </motion.blockquote>

                    {/* Author */}
                    <motion.div
                        key={`author-${current}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <p className="text-sm text-white/80 font-medium">
                            {testimonials[current].author}
                        </p>
                        <p className="text-[12px] text-white/40 mt-1">
                            {testimonials[current].location}
                        </p>
                    </motion.div>

                    {/* Nav */}
                    <div className="flex items-center justify-center gap-6 mt-12">
                        <button
                            onClick={prev}
                            className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:border-white/50 transition-colors"
                            aria-label="Previous"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-[12px] tracking-[0.2em] text-white/40">
                            {String(current + 1).padStart(2, '0')} / {String(testimonials.length).padStart(2, '0')}
                        </span>
                        <button
                            onClick={next}
                            className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:border-white/50 transition-colors"
                            aria-label="Next"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
