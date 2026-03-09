import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight } from 'lucide-react';
// Persistence: import CRUD functions to read and delete designs from localStorage
import { getDesigns, deleteDesign, type Design } from '../services/designService';

export default function SavedDesigns() {
    const navigate = useNavigate();
    // Persistence: load saved designs from localStorage on mount
    const [designs, setDesigns] = useState<Design[]>(() => getDesigns());

    // Persistence: open a saved design by storing its ID and navigating to /designer
    const handleOpen = (id: string) => {
        localStorage.setItem('currentDesign', id);
        navigate('/designer');
    };

    // Persistence: delete a design and refresh the displayed list
    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // prevent card click from firing
        deleteDesign(id);
        setDesigns(getDesigns());
    };

    // Don't render the section if there are no saved designs
    if (designs.length === 0) return null;

    return (
        <section className="py-28 lg:py-40 bg-cream">
            <div className="mx-auto max-w-7xl px-6 lg:px-10">
                {/* Section Header — matches the existing "Create New Design" style */}
                <div className="text-center mb-20">
                    <p className="text-[12px] tracking-[0.3em] uppercase text-stone-dark mb-4">
                        Continue Working
                    </p>
                    <h2 className="font-serif text-3xl md:text-5xl text-charcoal text-balance">
                        Saved <span className="italic">Designs</span>
                    </h2>
                </div>

                {/* Designs Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {designs.map((design) => (
                        <div
                            key={design.id}
                            onClick={() => handleOpen(design.id)}
                            className="group relative text-left px-8 py-8 rounded-2xl border border-stone-light bg-warm-white
                                       hover:border-stone-dark/40 hover:bg-stone-light/40 transition-all duration-500 cursor-pointer"
                        >
                            {/* Design Name */}
                            <h3 className="font-serif text-xl text-charcoal mb-2">
                                {design.name}
                            </h3>

                            {/* Room Type */}
                            <p className="text-sm text-charcoal/50 mb-1">
                                Room: <span className="text-charcoal/70">{design.roomType}</span>
                            </p>

                            {/* Creation Date */}
                            <p className="text-sm text-charcoal/40 mb-5">
                                Created: {design.createdAt}
                            </p>

                            {/* Action Row */}
                            <div className="flex items-center justify-between">
                                {/* Open indicator */}
                                <span className="inline-flex items-center gap-1.5 text-xs tracking-wide uppercase text-sage-dark opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    Open <ArrowRight size={12} strokeWidth={1.5} />
                                </span>

                                {/* Delete button */}
                                <button
                                    type="button"
                                    onClick={(e) => handleDelete(e, design.id)}
                                    className="inline-flex items-center gap-1.5 text-xs text-charcoal/30 hover:text-red-500 transition-colors duration-300 cursor-pointer"
                                >
                                    <Trash2 size={14} strokeWidth={1.3} />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
