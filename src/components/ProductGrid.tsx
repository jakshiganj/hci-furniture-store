import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const products = [
    {
        name: 'Oslo Lounge Chair',
        price: '$1,290',
        category: 'Seating',
        image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&q=80',
    },
    {
        name: 'Bergen Coffee Table',
        price: '$890',
        category: 'Tables',
        image: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=800&q=80',
    },
    {
        name: 'Fjord Pendant Light',
        price: '$420',
        category: 'Lighting',
        image: 'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=800&q=80',
    },
    {
        name: 'Nordic Sideboard',
        price: '$1,650',
        category: 'Storage',
        image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
    },
    {
        name: 'Scandic Dining Chair',
        price: '$540',
        category: 'Seating',
        image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&q=80',
    },
    {
        name: 'Timber Floor Lamp',
        price: '$380',
        category: 'Lighting',
        image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80',
    },
];

function ProductCard({ product, index }: { product: typeof products[0]; index: number }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="group cursor-pointer"
        >
            <Link to={`/product/${index + 1}`} className="block">
            {/* Image */}
            <div className="relative overflow-hidden bg-stone-light aspect-[3/4] mb-5">
                <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/10 transition-colors duration-500" />
                {/* Quick view button */}
                <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                    <button className="w-full bg-white/95 backdrop-blur-sm text-charcoal py-3 text-[12px] tracking-[0.15em] uppercase hover:bg-white transition-colors">
                        Quick View
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[11px] tracking-[0.2em] uppercase text-stone-dark mb-1">
                        {product.category}
                    </p>
                    <h3 className="font-serif text-lg text-charcoal group-hover:text-sage-dark transition-colors duration-300">
                        {product.name}
                    </h3>
                </div>
                <span className="text-sm text-charcoal/70 mt-1">{product.price}</span>
            </div>
            </Link>
        </motion.div>
    );
}

export default function ProductGrid() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <section id="shop" className="py-28 lg:py-40 bg-warm-white">
            <div className="mx-auto max-w-7xl px-6 lg:px-10">
                {/* Section Header */}
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7 }}
                    className="flex flex-col md:flex-row md:items-end md:justify-between mb-16"
                >
                    <div>
                        <p className="text-[12px] tracking-[0.3em] uppercase text-stone-dark mb-4">
                            Featured Pieces
                        </p>
                        <h2 className="font-serif text-3xl md:text-5xl text-charcoal">
                            Curated <span className="italic">Collection</span>
                        </h2>
                    </div>
                    <a
                        href="#shop"
                        className="mt-6 md:mt-0 inline-flex items-center gap-2 text-[13px] tracking-[0.15em] uppercase text-charcoal/70 hover:text-charcoal transition-colors group"
                    >
                        View All
                        <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                    </a>
                </motion.div>

                {/* Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                    {products.map((product, i) => (
                        <ProductCard key={product.name} product={product} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}
