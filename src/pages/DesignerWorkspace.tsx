

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PenTool, Box, SlidersHorizontal, Save } from 'lucide-react';
// Persistence: import saveDesign to store the current design in localStorage
import { saveDesign } from '../services/designService';

export default function DesignerWorkspace() {
    const navigate = useNavigate();
    const [roomType] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('roomType') || '';
        }
        return '';
    });

    // Track save-confirmation state for the Save Design button
    const [saved, setSaved] = useState(false);

    // Persistence: save the current workspace state to localStorage
    const handleSave = () => {
        saveDesign({ name: 'My Room Design', roomType, furniture: [] });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="min-h-screen bg-cream">
            {/* Top Bar */}
            <header className="border-b border-stone-light bg-warm-white">
                <div className="mx-auto max-w-7xl px-6 lg:px-10 py-5 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="inline-flex items-center gap-2 text-sm text-charcoal/60 hover:text-charcoal transition-colors duration-300 cursor-pointer"
                    >
                        <ArrowLeft size={16} strokeWidth={1.5} />
                        Back to Home
                    </button>

                    <div className="text-center">
                        <p className="text-[11px] tracking-[0.25em] uppercase text-stone-dark">
                            Designer Workspace
                        </p>
                        {roomType && (
                            <h1 className="font-serif text-xl text-charcoal mt-1">
                                Designing: <span className="italic">{roomType}</span>
                            </h1>
                        )}
                    </div>

                    {/* Save Design button — persists the current design to localStorage */}
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saved}
                        className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer
                            ${saved
                                ? 'bg-sage/20 text-sage-dark'
                                : 'bg-sage text-warm-white hover:bg-sage-dark'
                            }`}
                    >
                        <Save size={15} strokeWidth={1.5} />
                        {saved ? 'Saved ✓' : 'Save Design'}
                    </button>
                </div>
            </header>

            {/* Workspace Panels */}
            <main className="mx-auto max-w-7xl px-6 lg:px-10 py-10">
                <div className="grid lg:grid-cols-[1fr_340px] gap-6">
                    {/* Left Column: Canvas + 3D View stacked */}
                    <div className="flex flex-col gap-6">
                        {/*
                         * Room Canvas Area — Placeholder for 2D editor
                         * Will be implemented by Member 3 using a canvas-based room layout editor
                         */}
                        <div className="rounded-2xl border border-stone-light bg-warm-white flex flex-col items-center justify-center min-h-[400px]">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-stone-light mb-5">
                                <PenTool size={22} strokeWidth={1.3} className="text-charcoal/50" />
                            </div>
                            <h3 className="font-serif text-lg text-charcoal mb-2">Room Canvas Area</h3>
                            <p className="text-charcoal/40 text-sm max-w-xs text-center leading-relaxed">
                                2D room layout editor will be rendered here.
                                <br />
                                <span className="text-[11px] tracking-wide uppercase text-stone-dark mt-2 inline-block">
                                    Member 3 — Canvas Editor
                                </span>
                            </p>
                        </div>

                        {/*
                         * 3D View Panel — Placeholder for Three.js renderer
                         * Will be implemented by Member 2 using Three.js for real-time 3D preview
                         */}
                        <div className="rounded-2xl border border-stone-light bg-warm-white flex flex-col items-center justify-center min-h-[300px]">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-stone-light mb-5">
                                <Box size={22} strokeWidth={1.3} className="text-charcoal/50" />
                            </div>
                            <h3 className="font-serif text-lg text-charcoal mb-2">3D View Panel</h3>
                            <p className="text-charcoal/40 text-sm max-w-xs text-center leading-relaxed">
                                Three.js 3D room preview will be rendered here.
                                <br />
                                <span className="text-[11px] tracking-wide uppercase text-stone-dark mt-2 inline-block">
                                    Member 2 — Three.js Renderer
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Furniture Controls */}
                    <div className="flex flex-col gap-6">
                        {/*
                         * Furniture Controls Panel — Placeholder for furniture management
                         * Will later integrate with the save/load system by Member 4
                         */}
                        <div className="rounded-2xl border border-stone-light bg-warm-white flex flex-col items-center justify-center min-h-[300px] lg:min-h-0 lg:h-full">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-stone-light mb-5">
                                <SlidersHorizontal size={22} strokeWidth={1.3} className="text-charcoal/50" />
                            </div>
                            <h3 className="font-serif text-lg text-charcoal mb-2">Furniture Controls</h3>
                            <p className="text-charcoal/40 text-sm max-w-xs text-center leading-relaxed">
                                Add, move, and customize furniture items.
                                <br />
                                <span className="text-[11px] tracking-wide uppercase text-stone-dark mt-2 inline-block">
                                    Member 4 — Save/Load System
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
