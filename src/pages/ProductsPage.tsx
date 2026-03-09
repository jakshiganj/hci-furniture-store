import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, ArrowUpRight, X, ShoppingBag, ChevronDown, Check } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../utils/supabase';
import type { Product } from '../types';

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name';

const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'price-asc', label: 'Price: Low → High' },
    { value: 'price-desc', label: 'Price: High → Low' },
    { value: 'name', label: 'Name A–Z' },
];

// --- CUSTOM SORT DROPDOWN ---
function SortDropdown({ value, onChange, className = '' }: { value: SortOption; onChange: (v: SortOption) => void; className?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const activeLabel = sortOptions.find(o => o.value === value)?.label || 'Sort';

    // Close on click outside
    const handleClickOutside = useCallback((e: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
            setIsOpen(false);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [handleClickOutside]);

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 bg-white border px-5 py-3 text-[13px] transition-all duration-300 cursor-pointer group
                    ${isOpen
                        ? 'border-sage shadow-sm'
                        : 'border-stone-light hover:border-charcoal/30'
                    }`}
                id="product-sort"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <span className="text-charcoal">{activeLabel}</span>
                <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="text-charcoal/40 group-hover:text-charcoal/60"
                >
                    <ChevronDown size={14} />
                </motion.span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute right-0 top-full mt-2 w-56 bg-white/95 backdrop-blur-xl border border-stone-light shadow-xl z-50 overflow-hidden"
                        role="listbox"
                    >
                        {sortOptions.map((option) => (
                            <button
                                key={option.value}
                                role="option"
                                aria-selected={value === option.value}
                                onClick={() => { onChange(option.value); setIsOpen(false); }}
                                className={`w-full text-left px-5 py-3 text-[13px] flex items-center justify-between transition-all duration-200
                                    ${value === option.value
                                        ? 'bg-cream text-charcoal font-medium'
                                        : 'text-charcoal/60 hover:bg-stone-light/30 hover:text-charcoal'
                                    }`}
                            >
                                {option.label}
                                {value === option.value && (
                                    <Check size={14} className="text-sage" strokeWidth={2.5} />
                                )}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- PRODUCT CARD ---
function ProductCard({ product, index }: { product: Product; index: number }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="group"
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
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/10 transition-colors duration-500" />
                    {/* Quick view CTA */}
                    <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                        <span className="w-full flex items-center justify-center gap-2 bg-white/95 backdrop-blur-sm text-charcoal py-3 text-[12px] tracking-[0.15em] uppercase">
                            View Details
                            <ArrowUpRight size={13} />
                        </span>
                    </div>
                </div>

                {/* Info */}
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-[11px] tracking-[0.2em] uppercase text-stone-dark mb-1">
                            {product.category}
                        </p>
                        <h3 className="font-serif text-lg text-charcoal group-hover:text-sage-dark transition-colors duration-300 truncate">
                            {product.name}
                        </h3>
                    </div>
                    <span className="text-sm text-charcoal/70 mt-1 shrink-0">${product.price.toLocaleString()}</span>
                </div>
            </Link>
        </motion.div>
    );
}


// --- MAIN PAGE ---
export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [showFilters, setShowFilters] = useState(false);
    const headerRef = useRef(null);
    const headerInView = useInView(headerRef, { once: true });

    // Fetch products from Supabase
    useEffect(() => {
        async function fetchProducts() {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setProducts(data as Product[]);
            }
            setLoading(false);
        }
        fetchProducts();
    }, []);

    // Derive unique categories from fetched products
    const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

    // Apply filters & sort
    const filteredProducts = products
        .filter(p => activeCategory === 'All' || p.category === activeCategory)
        .filter(p =>
            searchQuery.trim() === '' ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            switch (sortBy) {
                case 'price-asc': return a.price - b.price;
                case 'price-desc': return b.price - a.price;
                case 'name': return a.name.localeCompare(b.name);
                case 'newest':
                default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
        });

    return (
        <div className="min-h-screen flex flex-col pt-20 bg-warm-white">
            <Navbar />

            <main className="flex-grow w-full">
                {/* Hero Banner */}
                <section className="relative bg-cream py-16 lg:py-24 overflow-hidden">
                    {/* Subtle decorative element */}
                    <div className="absolute top-0 right-0 w-1/2 h-full opacity-[0.03]">
                        <svg viewBox="0 0 400 400" className="w-full h-full">
                            <circle cx="300" cy="200" r="300" fill="currentColor" className="text-charcoal" />
                        </svg>
                    </div>

                    <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
                        <motion.div
                            ref={headerRef}
                            initial={{ opacity: 0, y: 20 }}
                            animate={headerInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6 }}
                        >
                            <p className="text-[12px] tracking-[0.3em] uppercase text-stone-dark mb-4">
                                Our Collection
                            </p>
                            <h1 className="font-serif text-4xl md:text-6xl text-charcoal mb-4">
                                All <span className="italic">Products</span>
                            </h1>
                            <p className="text-charcoal/50 text-sm md:text-base max-w-lg leading-relaxed">
                                Discover our curated selection of handcrafted furniture pieces, designed to elevate every space in your home.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* Toolbar: Search, Filter, Sort */}
                <section className="sticky top-20 z-30 bg-warm-white/80 backdrop-blur-xl border-b border-stone-light/60">
                    <div className="mx-auto max-w-7xl px-6 lg:px-10 py-4">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            {/* Search */}
                            <div className="relative flex-grow max-w-md">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/30" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white border border-stone-light pl-11 pr-4 py-3 text-[13px] focus:outline-none focus:border-sage transition-colors"
                                    id="product-search"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/30 hover:text-charcoal"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Filter Toggle (mobile) */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="sm:hidden flex items-center justify-center gap-2 bg-white border border-stone-light px-4 py-3 text-[12px] uppercase tracking-wider text-charcoal/70"
                            >
                                <SlidersHorizontal size={14} />
                                Filters
                            </button>

                            {/* Sort Dropdown */}
                            <div className="hidden sm:flex items-center gap-3 ml-auto">
                                <span className="text-[11px] uppercase tracking-wider text-charcoal/40">Sort by</span>
                                <SortDropdown value={sortBy} onChange={setSortBy} />
                            </div>
                        </div>

                        {/* Mobile Filter Panel */}
                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="sm:hidden overflow-hidden"
                                >
                                    <div className="pt-4 pb-2 space-y-3">
                                        <div>
                                            <span className="text-[11px] uppercase tracking-wider text-charcoal/40 mb-2 block">Sort by</span>
                                            <SortDropdown value={sortBy} onChange={setSortBy} className="w-full" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </section>

                {/* Content Area */}
                <section className="mx-auto max-w-7xl px-6 lg:px-10 py-10 lg:py-14">
                    <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">

                        {/* Sidebar: Category Filters (desktop) */}
                        <aside className="hidden lg:block w-52 shrink-0">
                            <div className="sticky top-44">
                                <h3 className="text-[11px] uppercase tracking-[0.2em] text-charcoal/40 mb-5">Categories</h3>
                                <div className="space-y-1">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveCategory(cat)}
                                            className={`block w-full text-left px-3 py-2.5 text-[13px] transition-all duration-300 ${
                                                activeCategory === cat
                                                    ? 'bg-charcoal text-white font-medium'
                                                    : 'text-charcoal/60 hover:text-charcoal hover:bg-stone-light/40'
                                            }`}
                                        >
                                            {cat}
                                            {cat !== 'All' && (
                                                <span className="ml-2 text-[10px] opacity-50">
                                                    ({products.filter(p => p.category === cat).length})
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Count */}
                                <div className="mt-8 pt-6 border-t border-stone-light">
                                    <p className="text-[11px] uppercase tracking-wider text-charcoal/40">
                                        Showing {filteredProducts.length} of {products.length} products
                                    </p>
                                </div>
                            </div>
                        </aside>

                        {/* Mobile Category Pills */}
                        <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`shrink-0 px-4 py-2 text-[11px] uppercase tracking-wider border transition-all duration-300 ${
                                        activeCategory === cat
                                            ? 'bg-charcoal text-white border-charcoal'
                                            : 'bg-white text-charcoal/60 border-stone-light hover:border-charcoal/30'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Product Grid */}
                        <div className="flex-grow min-w-0">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-24">
                                    <div className="w-8 h-8 border-2 border-stone/30 border-t-sage rounded-full animate-spin mb-4" />
                                    <p className="text-[13px] text-charcoal/50 tracking-wider uppercase">Loading collection</p>
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-24 bg-white border border-dashed border-stone-light"
                                >
                                    <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center mx-auto mb-5 text-charcoal/20">
                                        <ShoppingBag size={28} strokeWidth={1} />
                                    </div>
                                    <h3 className="font-serif text-xl text-charcoal mb-2">No Products Found</h3>
                                    <p className="text-[13px] text-charcoal/50 mb-6 max-w-xs mx-auto">
                                        {searchQuery
                                            ? `No results for "${searchQuery}". Try a different keyword.`
                                            : 'No products match the selected filters.'
                                        }
                                    </p>
                                    <button
                                        onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                                        className="text-[12px] text-sage hover:text-sage-dark underline uppercase tracking-wider"
                                    >
                                        Clear all filters
                                    </button>
                                </motion.div>
                            ) : (
                                <>
                                    {/* Results Count (mobile) */}
                                    <p className="lg:hidden text-[11px] uppercase tracking-wider text-charcoal/40 mb-6">
                                        {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                                    </p>

                                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-10">
                                        {filteredProducts.map((product, i) => (
                                            <ProductCard key={product.id} product={product} index={i} />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
