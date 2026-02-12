import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function Marquee() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-50px' });
    const items = ['Handcrafted', '·', 'Sustainable', '·', 'Scandinavian', '·', 'Timeless', '·', 'Premium', '·'];
    const repeated = [...items, ...items, ...items];

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.7 }}
            className="py-8 bg-cream overflow-hidden border-y border-stone/50"
        >
            <div className="flex animate-[marquee_25s_linear_infinite] whitespace-nowrap">
                {repeated.map((item, i) => (
                    <span
                        key={i}
                        className={`mx-4 text-[13px] tracking-[0.2em] uppercase ${item === '·' ? 'text-sage' : 'text-charcoal/40'
                            }`}
                    >
                        {item}
                    </span>
                ))}
            </div>
        </motion.div>
    );
}
