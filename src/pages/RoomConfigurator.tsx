import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    ArrowRight, ChevronLeft, Layout, Maximize2, 
    Paintbrush, Grid, Sun, Info, Check, Sparkles
} from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, ContactShadows, OrbitControls } from '@react-three/drei';
import type { WallTexture } from '../components/3d/RoomGeometry';
import { RoomGeometry } from '../components/3d/RoomGeometry';
import { 
  type RoomConfig, 
  type LightingMode, 
  type LightPos,
  ROOMS, 
  LIGHTING_PRESETS 
} from '../services/designService';
import { LightingRig } from '../components/3d/LightingRig';

export default function RoomConfigurator() {
    const navigate = useNavigate();

    // ─── State ───────────────────────────────────────────────────────────────────
    const [selectedRoomId, setSelectedRoomId] = useState<string>(ROOMS[0].id);
    const [customWidth, setCustomWidth] = useState<number>(ROOMS[0].width);
    const [customDepth, setCustomDepth] = useState<number>(ROOMS[0].depth);
    const [wallColor, setWallColor] = useState<string>(ROOMS[0].wallColor);
    const [floorColor, setFloorColor] = useState<string>(ROOMS[0].floorColor);
    const [wallTexture, setWallTexture] = useState<WallTexture>('plain');
    const [lightingMode, setLightingMode] = useState<LightingMode>('natural');
    const [lightPos] = useState<LightPos>({ x: 5, y: 8, z: 5 });
    const [designName, setDesignName] = useState<string>('');

    // ─── Computed ────────────────────────────────────────────────────────────────
    const activeRoom = useMemo(() => 
        ROOMS.find((r: RoomConfig) => r.id === selectedRoomId) || ROOMS[0]
    , [selectedRoomId]);

    const handleRoomSelect = (room: RoomConfig) => {
        setSelectedRoomId(room.id);
        setCustomWidth(room.width);
        setCustomDepth(room.depth);
        setWallColor(room.wallColor);
        setFloorColor(room.floorColor);
    };

    const handleProceed = () => {
        if (!designName.trim()) return;

        const params = new URLSearchParams({
            roomId: selectedRoomId,
            width: customWidth.toString(),
            depth: customDepth.toString(),
            wallColor,
            floorColor,
            wallTexture,
            lightingMode,
            name: designName
        });
        navigate(`/designer?${params.toString()}`);
    };

    return (
        <div className="min-h-screen bg-cream flex flex-col font-sans text-charcoal overflow-hidden">
            {/* ─── Header ─── */}
            <header className="h-20 px-8 flex items-center justify-between border-b border-stone-light/50 bg-warm-white/50 backdrop-blur-md z-20">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-stone-light/30 rounded-full transition-colors group"
                    >
                        <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-xl font-serif tracking-tight">Room Configurator</h1>
                        <p className="text-[11px] text-charcoal/40 uppercase tracking-[0.2em] font-medium">Initial Setup • Phase 1 of 2</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Give your design a name..."
                            value={designName}
                            onChange={(e) => setDesignName(e.target.value)}
                            className="bg-stone-light/20 border border-stone-light/50 rounded-xl px-4 py-2 text-sm w-64 outline-none focus:border-sage/50 focus:ring-4 focus:ring-sage/5 transition-all text-charcoal font-medium placeholder:text-charcoal/20"
                        />
                        {!designName && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[10px] text-red-400 font-medium">
                                <Info size={10} />
                                Required
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleProceed}
                        disabled={!designName.trim()}
                        className={`group px-6 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-all duration-500
                            ${designName.trim() 
                                ? 'bg-charcoal text-white hover:bg-charcoal/90 hover:shadow-lg hover:shadow-charcoal/10 active:scale-95 cursor-pointer' 
                                : 'bg-stone-light/40 text-charcoal/30 cursor-not-allowed'
                            }`}
                    >
                        Start Designing
                        <ArrowRight size={16} className={`transition-transform duration-500 ${designName.trim() ? 'group-hover:translate-x-1' : ''}`} />
                    </button>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* ─── Left Panel: Controls ─── */}
                <aside className="w-[450px] border-r border-stone-light/50 bg-warm-white/80 overflow-y-auto scrollbar-none p-8 flex flex-col gap-10">
                    {/* Section 1: Room Type */}
                    <section>
                        <div className="flex items-center gap-2.5 mb-5">
                            <div className="p-2 bg-sage/10 rounded-lg text-sage-dark">
                                <Layout size={16} />
                            </div>
                            <h2 className="text-sm font-medium tracking-wide">Select Room Template</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {ROOMS.map(room => (
                                <button
                                    key={room.id}
                                    onClick={() => handleRoomSelect(room)}
                                    className={`relative p-4 rounded-2xl border text-left transition-all duration-300 group
                                        ${selectedRoomId === room.id 
                                            ? 'bg-white border-sage shadow-md ring-1 ring-sage/20' 
                                            : 'bg-white/40 border-stone-light/60 hover:border-charcoal/20 hover:bg-white/60'
                                        }`}
                                >
                                    <span className={`block text-[11px] uppercase tracking-widest font-bold mb-1 ${selectedRoomId === room.id ? 'text-sage-dark' : 'text-charcoal/30'}`}>
                                        {room.width}x{room.depth}m
                                    </span>
                                    <span className="text-sm font-serif">{room.name}</span>
                                    {selectedRoomId === room.id && (
                                        <div className="absolute top-4 right-4 text-sage">
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Section 2: Dimensions */}
                    <section>
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-charcoal/5 rounded-lg text-charcoal/60">
                                    <Maximize2 size={16} />
                                </div>
                                <h2 className="text-sm font-medium tracking-wide">Custom Dimensions</h2>
                            </div>
                            <div className="px-3 py-1 bg-charcoal text-white rounded-full text-[10px] font-bold tracking-widest uppercase">
                                {(customWidth * customDepth).toFixed(1)}m²
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1 flex flex-col gap-2">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-charcoal/40 ml-1">Width (m)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={customWidth}
                                        onChange={(e) => setCustomWidth(parseFloat(e.target.value) || 2)}
                                        min={2} max={20} step={0.5}
                                        className="w-full bg-white border border-stone-light/60 rounded-xl px-4 py-3 text-sm focus:border-sage outline-none transition-all"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-charcoal/20">WIDTH</span>
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col gap-2">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-charcoal/40 ml-1">Depth (m)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={customDepth}
                                        onChange={(e) => setCustomDepth(parseFloat(e.target.value) || 2)}
                                        min={2} max={20} step={0.5}
                                        className="w-full bg-white border border-stone-light/60 rounded-xl px-4 py-3 text-sm focus:border-sage outline-none transition-all"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-charcoal/20">DEPTH</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Palette */}
                    <section className="grid grid-cols-2 gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Paintbrush size={14} className="text-charcoal/40" />
                                <h3 className="text-xs uppercase tracking-widest font-bold text-charcoal/60">Walls</h3>
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                                {['#f5f0ea', '#ece7df', '#f0ebe3', '#eae5dd', '#f2ede5'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setWallColor(c)}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110
                                            ${wallColor === c ? 'border-charcoal ring-2 ring-charcoal/10' : 'border-transparent'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                                <input 
                                    type="color" value={wallColor} 
                                    onChange={(e) => setWallColor(e.target.value)}
                                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm cursor-pointer overflow-hidden p-0"
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Grid size={14} className="text-charcoal/40" />
                                <h3 className="text-xs uppercase tracking-widest font-bold text-charcoal/60">Floor</h3>
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                                {['#d4c9b8', '#c9bfb0', '#bfb5a5', '#c4baa9', '#cec4b2'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setFloorColor(c)}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110
                                            ${floorColor === c ? 'border-charcoal ring-2 ring-charcoal/10' : 'border-transparent'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                                <input 
                                    type="color" value={floorColor} 
                                    onChange={(e) => setFloorColor(e.target.value)}
                                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm cursor-pointer overflow-hidden p-0"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Section 4: Textures */}
                    <section>
                        <div className="flex items-center gap-2 mb-5">
                            <Sparkles size={16} className="text-charcoal/40" />
                            <h2 className="text-sm font-medium tracking-wide">Wall Finish</h2>
                        </div>
                        <div className="grid grid-cols-5 gap-3">
                            {(['plain', 'subtle-linen', 'brick', 'wood-panel', 'concrete'] as WallTexture[]).map(tex => (
                                <button
                                    key={tex}
                                    onClick={() => setWallTexture(tex)}
                                    className={`relative aspect-square rounded-xl border flex items-center justify-center transition-all duration-300
                                        ${wallTexture === tex 
                                            ? 'border-sage ring-4 ring-sage/10 bg-white' 
                                            : 'border-stone-light/60 bg-white/40 hover:border-charcoal/20'}`}
                                    title={tex}
                                >
                                    <div 
                                        className="w-8 h-8 rounded-md opacity-60"
                                        style={{
                                            backgroundImage: tex === 'subtle-linen' ? 'repeating-linear-gradient(rgba(0,0,0,0.1) 0 1px, transparent 0 4px), repeating-linear-gradient(90deg, rgba(0,0,0,0.1) 0 1px, transparent 0 4px)' :
                                                             tex === 'brick' ? 'repeating-linear-gradient(rgba(0,0,0,0.1) 0 1px, transparent 0 20px), repeating-linear-gradient(90deg, rgba(0,0,0,0.1) 0 1px, transparent 0 50px)' :
                                                             tex === 'wood-panel' ? 'repeating-linear-gradient(90deg, rgba(0,0,0,0.1) 0 1px, transparent 0 32px)' :
                                                             tex === 'concrete' ? 'radial-gradient(rgba(0,0,0,0.1) 0.5px, transparent 0)' : 'none',
                                            backgroundColor: tex === 'plain' ? 'rgba(0,0,0,0.05)' : 'transparent',
                                            backgroundSize: tex === 'concrete' ? '2px 2px' : 'auto'
                                        }}
                                    />
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Section 5: Lighting */}
                    <section>
                        <div className="flex items-center gap-2 mb-5">
                            <Sun size={16} className="text-charcoal/40" />
                            <h2 className="text-sm font-medium tracking-wide">Atmosphere</h2>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {(Object.keys(LIGHTING_PRESETS) as LightingMode[]).map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setLightingMode(mode)}
                                    className={`px-4 py-2 rounded-full border text-[11px] font-bold uppercase tracking-widest transition-all duration-300
                                        ${lightingMode === mode 
                                            ? 'bg-charcoal text-white border-charcoal shadow-md scale-105' 
                                            : 'bg-white/40 border-stone-light/60 text-charcoal/40 hover:border-charcoal/20 hover:text-charcoal/60'}`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </section>
                </aside>

                {/* ─── Right Panel: Preview ─── */}
                <section className="flex-1 relative bg-stone-light/20">
                    <div className="absolute inset-0 z-0">
                        <Canvas shadows>
                            <PerspectiveCamera makeDefault position={[6, 5, 8]} fov={45} />
                            <OrbitControls 
                                enablePan={false} 
                                minDistance={5} 
                                maxDistance={15} 
                                minPolarAngle={0} 
                                maxPolarAngle={Math.PI / 2.1} 
                            />
                            
                            <LightingRig mode={lightingMode} lightPos={lightPos} />
                            
                            <RoomGeometry
                                width={customWidth}
                                depth={customDepth}
                                height={activeRoom.height}
                                wallColor={wallColor}
                                floorColor={floorColor}
                                wallTexture={wallTexture}
                                onDeselect={() => {}}
                            />
                            
                            <ContactShadows 
                                opacity={0.4} 
                                scale={20} 
                                blur={2.4} 
                                far={4.5} 
                                resolution={256} 
                                color="#000000" 
                            />
                        </Canvas>
                    </div>

                    {/* Floating Info Overlay */}
                    <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end pointer-events-none">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white shadow-xl max-w-sm pointer-events-auto"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-sage/10 rounded-xl text-sage-dark shrink-0">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold tracking-tight mb-1">Live Preview</h3>
                                    <p className="text-xs text-charcoal/50 leading-relaxed">
                                        You are currently viewing a simplified configuration of your design.
                                        You'll be able to place furniture and fine-tune details in the next step.
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        <div className="flex flex-col items-end gap-2">
                            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-charcoal/20">Scene View</span>
                            <div className="flex gap-2">
                                <div className="w-12 h-1 bg-charcoal rounded-full" />
                                <div className="w-4 h-1 bg-charcoal/10 rounded-full" />
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
