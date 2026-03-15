import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Layout, 
    Download, 
    Maximize2, 
    X, 
    Loader2, 
    Package, 
    Calendar,
    ChevronRight,
    Search
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../utils/supabase';
import { getUser } from '../utils/auth';
import { mapFromSupabase, type Design } from '../services/designService';

export default function MyDesigns() {
    const [designs, setDesigns] = useState<Design[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const user = getUser();

    useEffect(() => {
        if (!user?.id) return;

        const fetchSharedDesigns = async () => {
            setIsLoading(true);
            try {
                // Fetch designs shared with the current user
                const { data, error } = await supabase
                    .from('design_shares')
                    .select('design_id, saved_designs(*)')
                    .eq('shared_with_user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data) {
                    const mappedDesigns = data
                        .filter(item => item.saved_designs)
                        .map(item => {
                            const designData = Array.isArray(item.saved_designs) ? item.saved_designs[0] : item.saved_designs;
                            return mapFromSupabase(designData as unknown as Parameters<typeof mapFromSupabase>[0]);
                        });
                    setDesigns(mappedDesigns);
                }
            } catch (err) {
                console.error("Error fetching shared designs:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSharedDesigns();
    }, [user?.id]);

    const handleDownload = (imageUrl: string, fileName: string) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `${fileName.replace(/\s+/g, '_')}_design.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredDesigns = designs.filter(d => 
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.roomType.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-warm-white flex flex-col font-inter">
            <Navbar />
            
            <main className="flex-1 pt-32 pb-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-10">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                        <div className="max-w-2xl">
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-3 text-sage mb-6"
                            >
                                <span className="w-12 h-px bg-sage/30"></span>
                                <span className="text-[11px] tracking-[0.4em] uppercase font-bold">Personal Gallery</span>
                            </motion.div>
                            <motion.h1 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-5xl md:text-7xl font-serif text-charcoal mb-6 leading-[1.1]"
                            >
                                Your Curated <span className="italic text-sage-dark">Spaces</span>
                            </motion.h1>
                            <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-charcoal/50 text-lg leading-relaxed"
                            >
                                Revisit and download the professional room configurations shared with you by our interior design experts.
                            </motion.p>
                        </div>

                        {/* Search Bar */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="relative group w-full md:w-80"
                        >
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/20 group-focus-within:text-sage transition-colors" size={18} />
                            <input 
                                type="text"
                                placeholder="Search designs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-white border border-stone-light/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-sage/5 focus:border-sage transition-all text-sm"
                            />
                        </motion.div>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-6">
                            <div className="relative">
                                <Loader2 size={48} className="animate-spin text-sage" />
                                <div className="absolute inset-0 blur-xl bg-sage/20 rounded-full animate-pulse"></div>
                            </div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-charcoal/30 font-bold">Assembling your collection</p>
                        </div>
                    ) : filteredDesigns.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                            {filteredDesigns.map((design, i) => (
                                <motion.div
                                    key={design.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: (i % 3) * 0.1 }}
                                    className="group relative"
                                >
                                    {/* Image Card */}
                                    <div className="relative aspect-[16/11] rounded-[2.5rem] overflow-hidden bg-stone-light/20 shadow-sm transition-all duration-700 group-hover:shadow-2xl group-hover:-translate-y-2 border border-white/50">
                                        {design.imageUrl ? (
                                            <>
                                                <img 
                                                    src={design.imageUrl} 
                                                    alt={design.name} 
                                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                                />
                                                {/* Overlay Actions */}
                                                <div className="absolute inset-0 bg-charcoal/40 opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-[2px] flex items-center justify-center gap-4">
                                                    <button 
                                                        onClick={() => setSelectedImage(design.imageUrl!)}
                                                        className="p-4 bg-white/90 hover:bg-white text-charcoal rounded-full shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-75"
                                                        title="View Fullscreen"
                                                    >
                                                        <Maximize2 size={20} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDownload(design.imageUrl!, design.name)}
                                                        className="p-4 bg-sage text-white rounded-full shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-150"
                                                        title="Download Design"
                                                    >
                                                        <Download size={20} />
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-charcoal/10 bg-stone-light/10">
                                                <Package size={64} strokeWidth={1} />
                                            </div>
                                        )}
                                        
                                        {/* Room Type Tag */}
                                        <div className="absolute top-6 left-6 px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[9px] font-bold uppercase tracking-widest text-charcoal shadow-sm border border-charcoal/5">
                                            {design.roomType}
                                        </div>
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="mt-8 px-4">
                                        <div className="flex items-center gap-4 text-charcoal/30 mb-2">
                                            <div className="flex items-center gap-1.5 grayscale opacity-50">
                                                <Calendar size={12} />
                                                <span className="text-[10px] font-semibold tracking-wider uppercase">{design.createdAt}</span>
                                            </div>
                                            <span className="w-1 h-1 bg-charcoal/10 rounded-full"></span>
                                            <span className="text-[10px] font-semibold tracking-wider uppercase">High res</span>
                                        </div>
                                        <h3 className="text-2xl font-serif text-charcoal group-hover:text-sage transition-colors duration-300">
                                            {design.name}
                                        </h3>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-40 px-10 rounded-[3rem] border-2 border-dashed border-stone-light/50 bg-white/50 text-center"
                        >
                            <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-sage/5 text-sage mb-10">
                                <Layout size={40} strokeWidth={1.5} />
                                <div className="absolute inset-0 border border-sage/10 rounded-full animate-ping opacity-20"></div>
                            </div>
                            <h3 className="text-3xl font-serif text-charcoal mb-4">No designs found</h3>
                            <p className="text-charcoal/40 text-sm max-w-sm mx-auto leading-relaxed mb-10">
                                {searchQuery 
                                    ? `We couldn't find any designs matching "${searchQuery}". Try a different term.`
                                    : "You haven't been shared any designs yet. As soon as a designer shares a customized layout with you, it will appear here."}
                            </p>
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="text-[11px] tracking-widest uppercase font-bold text-sage hover:text-sage-dark transition-colors flex items-center gap-2 mx-auto"
                                >
                                    Clear Search <ChevronRight size={14} />
                                </button>
                            )}
                        </motion.div>
                    )}
                </div>
            </main>

            {/* Lightbox / Fullscreen Viewer */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-charcoal/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12"
                        onClick={() => setSelectedImage(null)}
                    >
                        <motion.button 
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X size={24} />
                        </motion.button>

                        <motion.img 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", damping: 25 }}
                            src={selectedImage}
                            alt="Fullscreen preview"
                            className="max-w-full max-h-full object-contain rounded-xl shadow-[0_0_100px_rgba(0,0,0,0.5)]"
                            onClick={(e) => e.stopPropagation()}
                        />
                        
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-white/50 text-[10px] tracking-[0.3em] uppercase font-bold">
                            Click anywhere to close
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Footer />
        </div>
    );
}
