import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, PenTool } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { getDesigns, deleteDesign, mapFromSupabase, type Design } from '../services/designService';
import { isLoggedIn, getUser } from '../utils/auth';
import { supabase } from '../utils/supabase';

export default function SavedDesigns() {
    const navigate = useNavigate();
    const [designs, setDesigns] = useState<Design[]>(() => getDesigns());
    const sectionRef = useRef(null);
    const inView = useInView(sectionRef, { once: true, margin: '-80px' });
    const loggedIn = isLoggedIn();

    // Load saved designs from localStorage and Supabase on mount
    useEffect(() => {
        if (!loggedIn) return;

        const loadDesigns = async () => {
            // 1. Start with local designs
            const localDesigns = getDesigns();
            setDesigns(localDesigns);

            // 2. Fetch from Supabase
            const user = getUser();
            if (!user?.id) return;

            const { data, error } = await supabase
                .from('saved_designs')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (!error && data) {
                const supabaseDesigns = data.map(mapFromSupabase);
                
                setDesigns((prev: Design[]) => {
                    // Merge: local storage is prioritized for current session, 
                    // but database is the source of truth for IDs.
                    // We remove local duplicates if a Supabase entry with same ID exists.
                    const merged = [...supabaseDesigns];
                    prev.forEach((p: Design) => {
                        if (!merged.find(m => m.id === p.id)) {
                            merged.push(p);
                        }
                    });
                    return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                });
            }
        };

        loadDesigns();
    }, [loggedIn]);

    // Open a saved design by navigating to the designer with its ID
    const handleOpen = (id: string) => {
        navigate(`/designer?designId=${id}`);
    };

    // Delete a design and refresh the list
    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        
        // 1. Delete from local storage
        deleteDesign(id);
        
        // 2. Delete from Supabase if it's a UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (isUUID) {
            await supabase.from('saved_designs').delete().eq('id', id);
        }

        // 3. Update local state
        setDesigns((prev: Design[]) => prev.filter(d => d.id !== id));
    };

    return (
        <section ref={sectionRef} className="py-28 lg:py-40 bg-cream">
            <div className="mx-auto max-w-7xl px-6 lg:px-10">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7 }}
                    className="text-center mb-20"
                >
                    <p className="text-[12px] tracking-[0.3em] uppercase text-stone-dark mb-4">
                        Continue Working
                    </p>
                    <h2 className="font-serif text-3xl md:text-5xl text-charcoal text-balance">
                        Saved <span className="italic">Designs</span>
                    </h2>
                </motion.div>

                {/* Empty state — no saved designs yet */}
                {designs.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.15 }}
                        className="text-center py-16 px-8 rounded-2xl border border-dashed border-stone-light bg-warm-white/50"
                    >
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-stone-light/60 mb-6">
                            <PenTool size={22} strokeWidth={1.3} className="text-charcoal/40" />
                        </div>
                        <h3 className="font-serif text-xl text-charcoal/70 mb-2">No saved designs yet</h3>
                        <p className="text-sm text-charcoal/40 mb-8 max-w-md mx-auto">
                            Select a room type above to start designing, then save your work to see it here.
                        </p>
                        <button
                            onClick={() => document.getElementById('create-design')?.scrollIntoView({ behavior: 'smooth' })}
                            className="inline-flex items-center gap-2 text-[12px] tracking-[0.15em] uppercase text-sage-dark hover:text-charcoal transition-colors duration-300 border-b border-sage-dark/30 pb-0.5"
                        >
                            Start Designing
                            <ArrowRight size={13} strokeWidth={1.5} />
                        </button>
                    </motion.div>
                ) : (
                    /* Designs Grid */
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {designs.map((design: Design, i: number) => (
                            <motion.div
                                key={design.id}
                                initial={{ opacity: 0, y: 40 }}
                                animate={inView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                                onClick={() => handleOpen(design.id)}
                                className="group relative text-left px-8 py-8 rounded-2xl border border-stone-light bg-warm-white
                                           hover:border-stone-dark/40 hover:bg-stone-light/40 transition-all duration-500 cursor-pointer"
                            >
                                {/* Design Name */}
                                <h3 className="font-serif text-xl text-charcoal mb-2">
                                    {design.name || 'Untitled Room'}
                                </h3>

                                {/* Room Type */}
                                <p className="text-sm text-charcoal/50 mb-1">
                                    Room: <span className="text-charcoal/70 capitalize">{design.roomType}</span>
                                </p>

                                {/* Furniture Count */}
                                <p className="text-sm text-charcoal/40 mb-1">
                                    Items: {design.furniture?.length ?? 0}
                                </p>

                                {/* Creation Date */}
                                <p className="text-sm text-charcoal/40 mb-5">
                                    Created: {design.createdAt}
                                </p>

                                {/* Action Row */}
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1.5 text-xs tracking-wide uppercase text-sage-dark opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        Open <ArrowRight size={12} strokeWidth={1.5} />
                                    </span>

                                    <button
                                        type="button"
                                        onClick={(e) => handleDelete(e, design.id)}
                                        className="inline-flex items-center gap-1.5 text-xs text-charcoal/30 hover:text-red-500 transition-colors duration-300 cursor-pointer"
                                    >
                                        <Trash2 size={14} strokeWidth={1.3} />
                                        Delete
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
