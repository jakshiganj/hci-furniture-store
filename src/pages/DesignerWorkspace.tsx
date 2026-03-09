import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft, Box as BoxIcon, Move, RotateCw, X, Check,
    AlertCircle, LayoutTemplate, Trash2, Plus, Save, FilePlus, Armchair
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import {
    OrthographicCamera, PerspectiveCamera, OrbitControls,
    Grid, Environment, TransformControls
} from '@react-three/drei';
import * as THREE from 'three';
import { supabase } from '../utils/supabase';
import { getUser } from '../utils/auth';

// ─── Types ───────────────────────────────────────────────────────────────────
type FurnitureType = {
    id: string;
    type: string;
    name: string;
    position: [number, number, number];
    rotation: [number, number, number];
};

type RoomConfig = {
    id: string;
    name: string;
    width: number;
    depth: number;
    height: number;
    wallColor: string;
    floorColor: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────
const ROOMS: RoomConfig[] = [
    { id: 'living', name: 'Living Room', width: 10, depth: 8, height: 3, wallColor: '#f5f0ea', floorColor: '#d4c9b8' },
    { id: 'bedroom', name: 'Bedroom', width: 8, depth: 6, height: 3, wallColor: '#ece7df', floorColor: '#c9bfb0' },
    { id: 'kitchen', name: 'Kitchen', width: 8, depth: 8, height: 3, wallColor: '#f0ebe3', floorColor: '#bfb5a5' },
    { id: 'office', name: 'Office', width: 7, depth: 6, height: 3, wallColor: '#eae5dd', floorColor: '#c4baa9' },
];

const CATALOG = [
    { type: 'sofa', name: 'Sofa', color: '#8B7355', size: [2, 0.8, 1] as [number, number, number] },
    { type: 'table', name: 'Table', color: '#A0522D', size: [1.2, 0.75, 0.8] as [number, number, number] },
    { type: 'plant', name: 'Plant', color: '#6B8E23', size: [0.5, 1, 0.5] as [number, number, number] },
    { type: 'bed', name: 'Bed', color: '#BC8F8F', size: [2, 0.6, 1.8] as [number, number, number] },
    { type: 'shelf', name: 'Shelf', color: '#DEB887', size: [1, 1.8, 0.4] as [number, number, number] },
    { type: 'chair', name: 'Chair', color: '#CD853F', size: [0.6, 0.9, 0.6] as [number, number, number] },
];

function getSizeForType(type: string): [number, number, number] {
    return CATALOG.find(c => c.type === type)?.size ?? [1, 1, 1];
}
function getColorForType(type: string): string {
    return CATALOG.find(c => c.type === type)?.color ?? '#999';
}

// ─── 3D Sub-Components ──────────────────────────────────────────────────────

function RoomGeometry({ room, onDeselect }: { room: RoomConfig; onDeselect: () => void }) {
    const { width, depth, height, wallColor, floorColor } = room;
    const hw = width / 2;
    const hd = depth / 2;

    return (
        <group>
            <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}
                onClick={(e) => { e.stopPropagation(); onDeselect(); }}>
                <planeGeometry args={[width, depth]} />
                <meshStandardMaterial color={floorColor} />
            </mesh>
            <mesh receiveShadow position={[0, height / 2, -hd]}>
                <planeGeometry args={[width, height]} />
                <meshStandardMaterial color={wallColor} side={THREE.DoubleSide} />
            </mesh>
            <mesh receiveShadow position={[-hw, height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[depth, height]} />
                <meshStandardMaterial color={wallColor} side={THREE.DoubleSide} />
            </mesh>
            <mesh receiveShadow position={[hw, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
                <planeGeometry args={[depth, height]} />
                <meshStandardMaterial color={wallColor} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}

function Model({
    item, isSelected, onSelect, transformMode, updateItem, setIsDragging
}: {
    item: FurnitureType;
    isSelected: boolean;
    onSelect: () => void;
    transformMode: 'translate' | 'rotate';
    updateItem: (id: string, updates: Partial<FurnitureType>) => void;
    setIsDragging: (v: boolean) => void;
}) {
    const meshRef = useRef<THREE.Mesh>(null!);
    const size = getSizeForType(item.type);
    const color = getColorForType(item.type);

    return (
        <group>
            <mesh
                ref={meshRef} castShadow receiveShadow
                position={item.position} rotation={item.rotation}
                onClick={(e) => { e.stopPropagation(); onSelect(); }}
            >
                <boxGeometry args={size} />
                <meshStandardMaterial
                    color={color}
                    emissive={isSelected ? '#ffd700' : '#000000'}
                    emissiveIntensity={isSelected ? 0.15 : 0}
                />
            </mesh>
            {isSelected && meshRef.current && (
                <TransformControls
                    object={meshRef.current}
                    mode={transformMode}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => {
                        setIsDragging(false);
                        if (meshRef.current) {
                            updateItem(item.id, {
                                position: meshRef.current.position.toArray() as [number, number, number],
                                rotation: [meshRef.current.rotation.x, meshRef.current.rotation.y, meshRef.current.rotation.z],
                            });
                        }
                    }}
                />
            )}
        </group>
    );
}

// ─── Main Page Component ─────────────────────────────────────────────────────
export default function DesignerWorkspace() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const designIdFromUrl = searchParams.get('designId');

    const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');
    const [transformMode, setTransformMode] = useState<'translate' | 'rotate'>('translate');
    const [placedItems, setPlacedItems] = useState<FurnitureType[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedRoomId, setSelectedRoomId] = useState<string>(ROOMS[0].id);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [currentDesignId, setCurrentDesignId] = useState<string | null>(null);
    const [designName, setDesignName] = useState('');
    const [isNewDesignModalOpen, setIsNewDesignModalOpen] = useState(false);
    const [newDesignName, setNewDesignName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);

    const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const activeRoom = ROOMS.find(r => r.id === selectedRoomId) || ROOMS[0];
    const selectedItem = placedItems.find(i => i.id === selectedId);

    // --- Backend Sync ---
    useEffect(() => {
        const loadDesigns = async () => {
            const user = getUser();
            if (!user?.id) return;

            let query = supabase.from('saved_designs').select('*');

            if (designIdFromUrl) {
                query = query.eq('id', designIdFromUrl);
            } else {
                query = query.eq('user_id', user.id).order('created_at', { ascending: false }).limit(1);
            }

            const { data, error } = await query;

            if (data && data.length > 0 && !error) {
                const design = data[0];
                setCurrentDesignId(design.id);
                setDesignName(design.name || 'Untitled Room');
                setSelectedRoomId(design.room_type);
                setPlacedItems(design.furniture_layout || []);
            }
        };
        loadDesigns();
    }, [designIdFromUrl]);

    // Handlers
    const addItem = (catalogItem: typeof CATALOG[0]) => {
        const newItem: FurnitureType = {
            id: Math.random().toString(36).substr(2, 9),
            type: catalogItem.type,
            name: catalogItem.name,
            position: [placedItems.length * 0.5, 0, 0],
            rotation: [0, 0, 0],
        };
        setPlacedItems((prev) => [...prev, newItem]);
        setSelectedId(newItem.id);
    };

    const updateItem = (id: string, updates: Partial<FurnitureType>) => {
        setPlacedItems((prev) => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    };

    const deleteSelected = () => {
        if (selectedId) {
            setPlacedItems((prev) => prev.filter(item => item.id !== selectedId));
            setSelectedId(null);
        }
    };

    const handleCreateNew = () => {
        setNewDesignName('');
        setIsNewDesignModalOpen(true);
    };

    const confirmCreateNew = () => {
        const name = newDesignName.trim() || `Room Design - ${new Date().toLocaleDateString()}`;
        setCurrentDesignId(null);
        setDesignName(name);
        setPlacedItems([]);
        setSelectedId(null);
        setSelectedRoomId(ROOMS[0].id);
        setIsNewDesignModalOpen(false);
        setSearchParams({});
        showToastMessage(`New design "${name}" created`);
    };

    const handleSave = async () => {
        const user = getUser();
        if (!user?.id) {
            showToastMessage('Please sign in to save your designs.', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                user_id: user.id,
                name: designName || 'Untitled Room',
                room_type: selectedRoomId,
                furniture_layout: placedItems,
            };

            if (currentDesignId) {
                const { error } = await supabase.from('saved_designs').update(payload).eq('id', currentDesignId);
                if (error) throw error;
                showToastMessage('Design saved successfully!');
            } else {
                const { data, error } = await supabase.from('saved_designs').insert(payload).select().single();
                if (error) throw error;
                if (data) {
                    setCurrentDesignId(data.id);
                    setSearchParams({ designId: data.id });
                }
                showToastMessage('Design created successfully!');
            }
        } catch (err) {
            console.error('Save failed:', err);
            showToastMessage('Failed to save. Please try again.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-cream flex flex-col h-screen overflow-hidden">

            {/* ─── Top Header Bar ─── */}
            <motion.header
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="border-b border-stone-light bg-warm-white/90 backdrop-blur-lg flex-shrink-0 z-20"
            >
                <div className="mx-auto px-6 lg:px-8 py-3.5 flex items-center justify-between">

                    {/* Left: Back + Design Name */}
                    <div className="flex items-center gap-5">
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="group inline-flex items-center gap-2 text-[12px] tracking-[0.12em] uppercase text-charcoal/50 hover:text-charcoal transition-colors duration-300"
                        >
                            <ArrowLeft size={14} strokeWidth={1.5} className="group-hover:-translate-x-0.5 transition-transform duration-300" />
                            Back
                        </button>

                        <div className="w-px h-7 bg-stone-light" />

                        <div>
                            {isEditingName ? (
                                <input
                                    autoFocus
                                    value={designName}
                                    onChange={(e) => setDesignName(e.target.value)}
                                    onBlur={() => setIsEditingName(false)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingName(false); }}
                                    className="font-serif text-xl text-charcoal bg-transparent border-b-2 border-sage outline-none py-0.5 px-1 -ml-1 min-w-[200px]"
                                />
                            ) : (
                                <button
                                    onClick={() => setIsEditingName(true)}
                                    className="font-serif text-xl text-charcoal hover:text-sage-dark transition-colors duration-300 cursor-text flex items-center gap-2.5 group"
                                    title="Click to rename"
                                >
                                    {designName || 'Untitled Room'}
                                    <span className="text-[9px] text-charcoal/20 group-hover:text-sage font-sans uppercase tracking-[0.15em] transition-colors duration-300">
                                        rename
                                    </span>
                                </button>
                            )}
                            <p className="text-[10px] text-charcoal/35 uppercase tracking-[0.2em] mt-0.5 font-medium">
                                {currentDesignId ? '● Saved' : '○ Unsaved draft'}
                            </p>
                        </div>
                    </div>

                    {/* Center: View Toggle */}
                    <div className="flex items-center bg-stone-light/30 border border-stone-light/60 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('2d')}
                            className={`px-5 py-2 rounded-md text-[11px] tracking-[0.1em] uppercase font-medium flex items-center gap-2 transition-all duration-300 ${viewMode === '2d'
                                    ? 'bg-white shadow-sm text-charcoal border border-stone-light/50'
                                    : 'text-charcoal/45 hover:text-charcoal border border-transparent'
                                }`}
                        >
                            <LayoutTemplate size={14} strokeWidth={1.5} />
                            2D Plan
                        </button>
                        <button
                            onClick={() => setViewMode('3d')}
                            className={`px-5 py-2 rounded-md text-[11px] tracking-[0.1em] uppercase font-medium flex items-center gap-2 transition-all duration-300 ${viewMode === '3d'
                                    ? 'bg-white shadow-sm text-charcoal border border-stone-light/50'
                                    : 'text-charcoal/45 hover:text-charcoal border border-transparent'
                                }`}
                        >
                            <BoxIcon size={14} strokeWidth={1.5} />
                            3D View
                        </button>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCreateNew}
                            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[11px] tracking-[0.12em] uppercase font-medium
                                       border border-stone-light text-charcoal/60 hover:text-charcoal hover:border-charcoal/30 hover:bg-stone-light/20
                                       transition-all duration-300"
                        >
                            <FilePlus size={14} strokeWidth={1.5} className="group-hover:scale-110 transition-transform duration-300" />
                            New
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-[11px] tracking-[0.12em] uppercase font-medium
                                       bg-charcoal text-white hover:bg-charcoal-light
                                       disabled:opacity-40 disabled:cursor-not-allowed
                                       transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                            <Save size={14} strokeWidth={1.5} className={isSaving ? 'animate-pulse' : 'group-hover:scale-110 transition-transform duration-300'} />
                            {isSaving ? 'Saving…' : 'Save Design'}
                        </button>
                    </div>
                </div>
            </motion.header>

            {/* ─── New Design Modal ─── */}
            <AnimatePresence>
                {isNewDesignModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 20 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="bg-warm-white w-full max-w-md rounded-2xl p-10 shadow-2xl relative border border-stone-light/50"
                        >
                            <button
                                onClick={() => setIsNewDesignModalOpen(false)}
                                className="absolute top-6 right-6 text-charcoal/30 hover:text-charcoal transition-colors duration-300 p-1 rounded-md hover:bg-stone-light/40"
                            >
                                <X size={18} strokeWidth={1.5} />
                            </button>

                            <div className="mb-8">
                                <p className="text-[10px] tracking-[0.3em] uppercase text-stone-dark mb-3">Start Fresh</p>
                                <h3 className="text-3xl font-serif text-charcoal">
                                    New <span className="italic">Design</span>
                                </h3>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); confirmCreateNew(); }}>
                                <label className="block text-[10px] tracking-[0.2em] uppercase text-charcoal/50 mb-2.5 font-medium">
                                    Design Name
                                </label>
                                <input
                                    type="text"
                                    autoFocus
                                    value={newDesignName}
                                    onChange={(e) => setNewDesignName(e.target.value)}
                                    placeholder="e.g. My Living Room"
                                    className="w-full border border-stone-light bg-white rounded-lg px-4 py-3.5 text-sm text-charcoal placeholder:text-charcoal/25
                                               focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/10 transition-all duration-300 mb-8"
                                />

                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsNewDesignModalOpen(false)}
                                        className="px-6 py-3 rounded-lg text-[11px] tracking-[0.12em] uppercase font-medium
                                                   text-charcoal/50 hover:text-charcoal hover:bg-stone-light/30 transition-all duration-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="group bg-charcoal text-white px-8 py-3 rounded-lg text-[11px] tracking-[0.12em] uppercase font-medium
                                                   hover:bg-charcoal-light transition-all duration-300 shadow-sm hover:shadow-md
                                                   inline-flex items-center gap-2"
                                    >
                                        <Plus size={14} strokeWidth={2} />
                                        Create Design
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Main Content ─── */}
            <main className="flex-1 flex overflow-hidden">

                {/* ─── Left Sidebar ─── */}
                <motion.aside
                    initial={{ x: -40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="w-72 border-r border-stone-light bg-warm-white/80 backdrop-blur-sm flex flex-col h-full z-10 shadow-sm"
                >
                    {/* ─ Room Selector ─ */}
                    <div className="p-5 border-b border-stone-light/70">
                        <p className="text-[10px] tracking-[0.25em] uppercase text-charcoal/40 mb-3 font-medium">Room Type</p>
                        <div className="grid grid-cols-2 gap-2">
                            {ROOMS.map((room) => (
                                <button
                                    key={room.id}
                                    onClick={() => setSelectedRoomId(room.id)}
                                    className={`px-3 py-2 rounded-lg text-[11px] tracking-wide font-medium transition-all duration-300
                                        ${selectedRoomId === room.id
                                            ? 'bg-sage/15 text-sage-dark border border-sage/30'
                                            : 'text-charcoal/50 border border-transparent hover:bg-stone-light/40 hover:text-charcoal/70'
                                        }`}
                                >
                                    {room.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ─ Tools ─ */}
                    <div className="p-5 border-b border-stone-light/70">
                        <p className="text-[10px] tracking-[0.25em] uppercase text-charcoal/40 mb-3 font-medium">Transform</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setTransformMode('translate')}
                                className={`flex-1 flex flex-col items-center justify-center py-3.5 rounded-xl border transition-all duration-300 group
                                    ${transformMode === 'translate'
                                        ? 'border-sage/40 bg-sage/10 text-sage-dark shadow-sm'
                                        : 'border-stone-light/60 text-charcoal/40 hover:bg-stone-light/30 hover:text-charcoal/60 hover:border-stone-light'
                                    }`}
                            >
                                <Move size={18} strokeWidth={1.5} className="mb-1.5" />
                                <span className="text-[10px] tracking-wide font-medium uppercase">Move</span>
                            </button>
                            <button
                                onClick={() => setTransformMode('rotate')}
                                className={`flex-1 flex flex-col items-center justify-center py-3.5 rounded-xl border transition-all duration-300 group
                                    ${transformMode === 'rotate'
                                        ? 'border-sage/40 bg-sage/10 text-sage-dark shadow-sm'
                                        : 'border-stone-light/60 text-charcoal/40 hover:bg-stone-light/30 hover:text-charcoal/60 hover:border-stone-light'
                                    }`}
                            >
                                <RotateCw size={18} strokeWidth={1.5} className="mb-1.5" />
                                <span className="text-[10px] tracking-wide font-medium uppercase">Rotate</span>
                            </button>
                        </div>
                    </div>

                    {/* ─ Catalog ─ */}
                    <div className="p-5 flex-1 overflow-y-auto scrollbar-none">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] tracking-[0.25em] uppercase text-charcoal/40 font-medium">Furniture</p>
                            <div className="flex items-center gap-1.5 text-[9px] tracking-wider uppercase text-charcoal/25">
                                <Armchair size={10} strokeWidth={1.5} />
                                {CATALOG.length} items
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                            {CATALOG.map((item) => (
                                <motion.button
                                    key={item.name}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => addItem(item)}
                                    className="aspect-square flex flex-col items-center justify-center
                                               bg-cream/60 border border-stone-light/50 rounded-xl
                                               hover:border-sage/40 hover:bg-sage/5
                                               transition-colors duration-300 group cursor-pointer"
                                >
                                    <div
                                        className="w-9 h-9 rounded-lg mb-2.5 shadow-sm group-hover:shadow-md transition-shadow duration-300 border border-black/5"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-[10px] font-medium text-charcoal/55 group-hover:text-charcoal/80 tracking-wide transition-colors duration-300">
                                        {item.name}
                                    </span>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* ─ Selected Item Actions ─ */}
                    <AnimatePresence>
                        {selectedItem && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="border-t border-stone-light/70 overflow-hidden"
                            >
                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[10px] tracking-[0.25em] uppercase text-charcoal/40 font-medium">Selected</p>
                                        <span className="text-[11px] font-serif text-charcoal/70">{selectedItem.name}</span>
                                    </div>
                                    <button
                                        onClick={deleteSelected}
                                        className="w-full py-2.5 rounded-lg text-[11px] tracking-[0.1em] uppercase font-medium
                                                   text-red-400 border border-red-200/60 bg-red-50/30
                                                   hover:bg-red-50 hover:text-red-500 hover:border-red-300
                                                   transition-all duration-300 flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={13} strokeWidth={1.5} />
                                        Delete Item
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.aside>

                {/* ─── 3D Canvas ─── */}
                <section className="flex-1 relative bg-stone-light/15">
                    {/* Item Count Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="absolute top-4 left-4 z-10 bg-warm-white/80 backdrop-blur-sm border border-stone-light/50 rounded-lg px-4 py-2
                                   flex items-center gap-2.5 shadow-sm"
                    >
                        <Armchair size={14} strokeWidth={1.5} className="text-charcoal/40" />
                        <span className="text-[10px] tracking-[0.15em] uppercase text-charcoal/50 font-medium">
                            {placedItems.length} {placedItems.length === 1 ? 'item' : 'items'} · {activeRoom.name}
                        </span>
                    </motion.div>

                    <Canvas shadows>
                        {viewMode === '2d' ? (
                            <OrthographicCamera makeDefault position={[0, 10, 0]} zoom={60} near={0.1} far={100} rotation={[-Math.PI / 2, 0, 0]} />
                        ) : (
                            <PerspectiveCamera makeDefault position={[5, 4, 5]} fov={50} />
                        )}

                        <ambientLight intensity={0.6} />
                        <directionalLight position={[10, 15, 10]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
                        <Environment preset="city" />

                        {viewMode === '2d' && (
                            <Grid
                                position={[0, -0.01, 0]}
                                args={[activeRoom.width, activeRoom.depth]}
                                cellSize={1}
                                cellThickness={1}
                                cellColor="#d4cdc4"
                                sectionSize={5}
                                sectionThickness={1.5}
                                sectionColor="#9c9488"
                                fadeDistance={50}
                            />
                        )}

                        <RoomGeometry room={activeRoom} onDeselect={() => setSelectedId(null)} />

                        {placedItems.map((item) => (
                            <Model
                                key={item.id}
                                item={item}
                                isSelected={selectedId === item.id}
                                onSelect={() => setSelectedId(item.id)}
                                transformMode={transformMode}
                                updateItem={updateItem}
                                setIsDragging={setIsDragging}
                            />
                        ))}

                        {viewMode === '3d' ? (
                            <OrbitControls makeDefault enabled={!isDragging} minPolarAngle={0} maxPolarAngle={Math.PI / 2 - 0.05} />
                        ) : (
                            <OrbitControls makeDefault enabled={!isDragging} enableRotate={false} />
                        )}
                    </Canvas>
                </section>
            </main>

            {/* ─── Toast Notification ─── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.92 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed bottom-8 right-8 bg-charcoal text-white pl-5 pr-6 py-4 rounded-xl shadow-2xl flex items-center gap-3.5 z-50 pointer-events-none
                                   border border-white/5"
                    >
                        <div className={`p-1.5 rounded-full text-white ${toast.type === 'success' ? 'bg-sage' : 'bg-red-400'}`}>
                            {toast.type === 'success'
                                ? <Check size={12} strokeWidth={3} />
                                : <AlertCircle size={12} strokeWidth={3} />
                            }
                        </div>
                        <span className="text-[12px] tracking-wide font-medium">{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
