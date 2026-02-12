import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const collections = [
    {
        title: 'Living Room',
        subtitle: 'Comfort meets elegance',
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80',
        span: 'lg:col-span-2 lg:row-span-2',
        aspect: 'aspect-[4/3] lg:aspect-auto lg:h-full',
    },
    {
        title: 'Bedroom',
        subtitle: 'Restful sanctuaries',
        image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80',
        span: '',
        aspect: 'aspect-[4/3]',
    },
    {
        title: 'Workspace',
        subtitle: 'Focused design',
        image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&q=80',
        span: '',
        aspect: 'aspect-[4/3]',
    },
];

function CollectionCard({ col, index }: { col: typeof collections[0], index: number }) {
    const cardRef = useRef(null);
    const cardInView = useInView(cardRef, { once: true, margin: '-80px' });

    return (
        <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 40 }}
            animate={cardInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: index * 0.12 }}
            className={`relative overflow-hidden group cursor-pointer ${col.span} ${col.aspect}`}
        >
            <img
                src={col.image}
                alt={col.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/50 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 lg:bottom-8 lg:left-8">
                <p className="text-[11px] tracking-[0.2em] uppercase text-white/60 mb-1">
                    {col.subtitle}
                </p>
                <h3 className="font-serif text-2xl lg:text-3xl text-white">
                    {col.title}
                </h3>
            </div>
        </motion.div>
    );
}

export default function Collections() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <section id="collections" className="py-28 lg:py-40 bg-cream">
            <div className="mx-auto max-w-7xl px-6 lg:px-10">
                {/* Header */}
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7 }}
                    className="text-center mb-16" // Adjusted margin to match original visual if needed, but keeping logic same
                >
                    <p className="text-[12px] tracking-[0.3em] uppercase text-stone-dark mb-4">
                        Browse by Space
                    </p>
                    <h2 className="font-serif text-3xl md:text-5xl text-charcoal">
                        Our <span className="italic">Collections</span>
                    </h2>
                </motion.div>

                {/* Grid */}
                <div className="grid lg:grid-cols-2 gap-4 lg:grid-rows-2 lg:h-[700px]">
                    {collections.map((col, i) => (
                        <CollectionCard key={col.title} col={col} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}
