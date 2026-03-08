import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';

function ProductCard({ product, index }: { product: any; index: number }) {
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
            <Link to={`/product/${product.id}`} className="block">
            {/* Image */}
            <div className="relative overflow-hidden bg-stone-light aspect-[3/4] mb-5">
                <img
                    src={product.image_url || 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&q=80'}
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
                <span className="text-sm text-charcoal/70 mt-1">${product.price.toLocaleString()}</span>
            </div>
            </Link>
        </motion.div>
    );
}

export default function ProductGrid() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-100px' });
    const [products, setProducts] = useState<any[]>([]);

    useEffect(() => {
        async function fetchProducts() {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: true });
                
            if (!error && data) {
                setProducts(data);
            }
        }
        fetchProducts();
    }, []);

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
                        <ProductCard key={product.id} product={product} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}
