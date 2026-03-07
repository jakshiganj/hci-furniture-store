/**
 * DesignerWorkspace Page
 *
 * Placeholder page for the furniture designer workspace.
 * This page will later integrate:
 *   - 2D Canvas editor (Member 3)
 *   - Three.js 3D renderer (Member 2)
 *   - Save/load persistence system (Member 4)
 *
 * For now it reads the selected roomType from localStorage
 * and displays placeholder panels for each future module.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PenTool, Box, SlidersHorizontal } from 'lucide-react';

export default function DesignerWorkspace() {
    const navigate = useNavigate();

    // Lazy initialization: read roomType from localStorage once (avoids setState in useEffect)
    const [roomType, setRoomType] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('roomType') || '';
        }
        return '';
    });

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

                    {/* Spacer to center the title */}
                    <div className="w-[110px]" />
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
