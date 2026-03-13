import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft, Box as BoxIcon, Move, RotateCw, X, Check,
    AlertCircle, LayoutTemplate, Trash2, Plus, Save, FilePlus, Armchair,
    Undo2, Redo2, Camera as CameraIcon, Copy, Grid as GridIcon, Download,
    Paintbrush, Sun
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import {
    OrthographicCamera, PerspectiveCamera, OrbitControls,
    Grid, Environment, TransformControls
} from '@react-three/drei';
import * as THREE from 'three';
import { Suspense } from 'react';
import { supabase } from '../utils/supabase';
import { getUser } from '../utils/auth';
import { saveDesign as saveToLocal, updateDesign as updateLocal, getDesignById as getLocalDesign } from '../services/designService';
import ChairModel from '../components/models/ChairModel';
import TableModel from '../components/models/TableModel';
import SofaModel from '../components/models/SofaModel';
import BedModel from '../components/models/BedModel';
import ShelfModel from '../components/models/ShelfModel';
import VaseModel from '../components/models/VaseModel';

// ─── Types ───────────────────────────────────────────────────────────────────
type FurnitureType = {
    id: string;
    type: string;
    name: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale?: [number, number, number];
    color?: string; // ✅ NEW: per-item colour
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
    { type: 'bed', name: 'Bed', color: '#BC8F8F', size: [2, 0.6, 1.8] as [number, number, number] },
    { type: 'shelf', name: 'Shelf', color: '#DEB887', size: [1, 1.8, 0.4] as [number, number, number] },
    { type: 'chair', name: 'Chair', color: '#CD853F', size: [0.6, 0.9, 0.6] as [number, number, number] },
    { type: 'vase', name: 'Vase', color: '#D8BFD8', size: [0.3, 0.5, 0.3] as [number, number, number] },
];

function getSizeForType(type: string): [number, number, number] {
    return CATALOG.find(c => c.type === type)?.size ?? [1, 1, 1];
}
function getDefaultColorForType(type: string): string {
    return CATALOG.find(c => c.type === type)?.color ?? '#999';
}

const MODEL_MAP: Record<string, React.ComponentType<any>> = { // eslint-disable-line @typescript-eslint/no-explicit-any
    chair: ChairModel,
    table: TableModel,
    sofa: SofaModel,
    bed: BedModel,
    shelf: ShelfModel,
    vase: VaseModel,
};

// ─── 3D Sub-Components ──────────────────────────────────────────────────────

function RoomGeometry({ room, wallColor, floorColor, onDeselect }: {
    room: RoomConfig;
    wallColor: string;   // ✅ live overrides
    floorColor: string;
    onDeselect: () => void;
}) {
    const { width, depth, height } = room;
    const hw = width / 2;
    const hd = depth / 2;

    return (
        <group>
            {/* Floor */}
            <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}
                onClick={(e) => { e.stopPropagation(); onDeselect(); }}>
                <planeGeometry args={[width, depth]} />
                <meshStandardMaterial color={floorColor} />
            </mesh>
            {/* Back wall */}
            <mesh receiveShadow position={[0, height / 2, -hd]}>
                <planeGeometry args={[width, height]} />
                <meshStandardMaterial color={wallColor} side={THREE.DoubleSide} />
            </mesh>
            {/* Left wall */}
            <mesh receiveShadow position={[-hw, height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[depth, height]} />
                <meshStandardMaterial color={wallColor} side={THREE.DoubleSide} />
            </mesh>
            {/* Right wall */}
            <mesh receiveShadow position={[hw, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
                <planeGeometry args={[depth, height]} />
                <meshStandardMaterial color={wallColor} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}

function Model({
    item, isSelected, onSelect, transformMode, updateItem, setIsDragging, snapToGrid
}: {
    item: FurnitureType;
    isSelected: boolean;
    onSelect: () => void;
    transformMode: 'translate' | 'rotate';
    updateItem: (id: string, updates: Partial<FurnitureType>) => void;
    setIsDragging: (v: boolean) => void;
    snapToGrid: boolean;
}) {
    const groupRef = useRef<THREE.Group>(null!);
    const size = getSizeForType(item.type);
    // ✅ Use per-item colour, fall back to catalog default
    const color = item.color ?? getDefaultColorForType(item.type);
    const GlbModel = MODEL_MAP[item.type];
    const scale = item.scale || [1, 1, 1];

    const finalGlbScale: [number, number, number] = [0.5 * scale[0], 0.5 * scale[1], 0.5 * scale[2]];
    const boundingBoxSize: [number, number, number] = [size[0] * scale[0], size[1] * scale[1], size[2] * scale[2]];

    return (
        <group>
            <group
                ref={groupRef}
                position={item.position}
                rotation={item.rotation}
                onClick={(e) => { e.stopPropagation(); onSelect(); }}
            >
                {GlbModel ? (
                    <Suspense fallback={
                        <mesh castShadow receiveShadow position={[0, boundingBoxSize[1] / 2, 0]}>
                            <boxGeometry args={boundingBoxSize} />
                            <meshStandardMaterial color={color} />
                        </mesh>
                    }>
                        <GlbModel scale={finalGlbScale} />
                    </Suspense>
                ) : (
                    <mesh castShadow receiveShadow position={[0, boundingBoxSize[1] / 2, 0]}>
                        <boxGeometry args={boundingBoxSize} />
                        <meshStandardMaterial
                            color={color}
                            emissive={isSelected ? '#ffd700' : '#000000'}
                            emissiveIntensity={isSelected ? 0.15 : 0}
                        />
                    </mesh>
                )}
            </group>
            {isSelected && transformMode && (
                <TransformControls
                    object={groupRef}
                    mode={transformMode}
                    translationSnap={snapToGrid ? 0.5 : null}
                    rotationSnap={snapToGrid ? Math.PI / 4 : null}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => {
                        setIsDragging(false);
                        if (groupRef.current) {
                            updateItem(item.id, {
                                position: groupRef.current.position.toArray() as [number, number, number],
                                rotation: [groupRef.current.rotation.x, groupRef.current.rotation.y, groupRef.current.rotation.z],
                            });
                        }
                    }}
                />
            )}
        </group>
    );
}

// ─── Confirm Dialog ──────────────────────────────────────────────────────────
function ConfirmDialog({
    open, title, message, onConfirm, onCancel
}: {
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 20 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="bg-white w-full max-w-sm rounded-2xl p-8 shadow-2xl border border-stone-light/50"
                    >
                        <h3 className="text-xl font-serif text-charcoal mb-2">{title}</h3>
                        <p className="text-sm text-charcoal/55 mb-8 leading-relaxed">{message}</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={onCancel}
                                className="px-5 py-2.5 rounded-lg text-[11px] tracking-[0.1em] uppercase font-medium
                                           text-charcoal/50 hover:text-charcoal hover:bg-stone-light/30 transition-all duration-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                className="px-6 py-2.5 rounded-lg text-[11px] tracking-[0.1em] uppercase font-medium
                                           bg-red-500 text-white hover:bg-red-600 transition-all duration-300
                                           flex items-center gap-2 shadow-sm hover:shadow-md"
                            >
                                <Trash2 size={13} strokeWidth={1.5} />
                                Delete
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
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
    const [history, setHistory] = useState<FurnitureType[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [snapToGrid, setSnapToGrid] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedRoomId, setSelectedRoomId] = useState<string>(ROOMS[0].id);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // ✅ NEW: live room colour overrides (persisted to Supabase)
    const [customWallColor, setCustomWallColor] = useState<string>('');
    const [customFloorColor, setCustomFloorColor] = useState<string>('');

    // ✅ NEW: shading overlay (0–0.8 opacity)
    const [shadeLevel, setShadeLevel] = useState<number>(0);

    // ✅ FIX: proper canvas ref for export
    const glRef = useRef<THREE.WebGLRenderer | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orbitControlsRef = useRef<any>(null);

    // ✅ NEW: delete confirmation
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    const [currentDesignId, setCurrentDesignId] = useState<string | null>(null);
    const [designName, setDesignName] = useState('');
    const [isNewDesignModalOpen, setIsNewDesignModalOpen] = useState(false);
    const [newDesignName, setNewDesignName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [isSaveNameModalOpen, setIsSaveNameModalOpen] = useState(false);
    const [saveNameInput, setSaveNameInput] = useState('');

    const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const activeRoom = ROOMS.find(r => r.id === selectedRoomId) || ROOMS[0];

    // Resolve effective wall/floor colors (custom override or room default)
    const effectiveWallColor = customWallColor || activeRoom.wallColor;
    const effectiveFloorColor = customFloorColor || activeRoom.floorColor;

    const selectedItem = placedItems.find(i => i.id === selectedId);

    // Reset colour overrides when room type changes
    useEffect(() => {
        setCustomWallColor('');
        setCustomFloorColor('');
    }, [selectedRoomId]);

    // --- Load Design ---
    useEffect(() => {
        if (!designIdFromUrl) return;

        const localDesign = getLocalDesign(designIdFromUrl);
        if (localDesign) {
            setCurrentDesignId(localDesign.id);
            setDesignName(localDesign.name || 'Untitled Room');
            setSelectedRoomId(localDesign.roomType || ROOMS[0].id);
            setPlacedItems((localDesign.furniture as FurnitureType[]) || []);
            // ✅ Restore saved colours
            if (localDesign.wallColor) setCustomWallColor(localDesign.wallColor);
            if (localDesign.floorColor) setCustomFloorColor(localDesign.floorColor);
            if (localDesign.shadeLevel !== undefined) setShadeLevel(localDesign.shadeLevel);
            return;
        }

        const loadFromSupabase = async () => {
            const user = getUser();
            if (!user?.id) return;

            const { data, error } = await supabase
                .from('saved_designs')
                .select('*')
                .eq('id', designIdFromUrl);

            if (data && data.length > 0 && !error) {
                const design = data[0];
                setCurrentDesignId(design.id);
                setDesignName(design.name || 'Untitled Room');
                setSelectedRoomId(design.room_type);
                setPlacedItems(design.furniture_layout || []);
                // ✅ Restore saved colours from Supabase
                if (design.wall_color) setCustomWallColor(design.wall_color);
                if (design.floor_color) setCustomFloorColor(design.floor_color);
                if (design.shade_level !== undefined) setShadeLevel(design.shade_level);
            }
        };
        loadFromSupabase();
    }, [designIdFromUrl]);

    // History management
    const pushToHistory = (newState: FurnitureType[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newState);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setPlacedItems(history[historyIndex - 1]);
            setSelectedId(null);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setPlacedItems(history[historyIndex + 1]);
            setSelectedId(null);
        }
    };

    useEffect(() => {
        if (history.length === 0 && placedItems.length === 0) {
            pushToHistory([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handlers
    const addItem = (catalogItem: typeof CATALOG[0]) => {
        const newItem: FurnitureType = {
            id: Math.random().toString(36).substr(2, 9),
            type: catalogItem.type,
            name: catalogItem.name,
            position: [placedItems.length * 0.5, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            color: catalogItem.color, // ✅ set default color on creation
        };
        const newState = [...placedItems, newItem];
        setPlacedItems(newState);
        pushToHistory(newState);
        setSelectedId(newItem.id);
    };

    const updateItem = (id: string, updates: Partial<FurnitureType>) => {
        const newState = placedItems.map(item => item.id === id ? { ...item, ...updates } : item);
        setPlacedItems(newState);
        pushToHistory(newState);
    };

    // ✅ FIX: show confirm dialog before deleting
    const deleteSelected = () => {
        if (selectedId) setIsDeleteConfirmOpen(true);
    };

    const confirmDelete = () => {
        if (selectedId) {
            const newState = placedItems.filter(item => item.id !== selectedId);
            setPlacedItems(newState);
            pushToHistory(newState);
            setSelectedId(null);
            setIsDeleteConfirmOpen(false);
            showToastMessage('Item removed from design');
        }
    };

    const duplicateItem = () => {
        if (selectedId && selectedItem) {
            const clone: FurnitureType = {
                ...selectedItem,
                id: Math.random().toString(36).substr(2, 9),
                position: [selectedItem.position[0] + 0.5, selectedItem.position[1], selectedItem.position[2] + 0.5],
            };
            const newState = [...placedItems, clone];
            setPlacedItems(newState);
            pushToHistory(newState);
            setSelectedId(clone.id);
        }
    };

    // ✅ FIX: proper canvas export using gl.domElement
    const handleExportImage = () => {
        if (glRef.current) {
            glRef.current.render(
                glRef.current.getRenderTarget()?.texture as unknown as THREE.Scene,
                new THREE.Camera()
            );
            const url = glRef.current.domElement.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `${designName || 'room-design'}.png`;
            link.href = url;
            link.click();
            showToastMessage('Design exported as image!');
        } else {
            showToastMessage('Export failed — try again after the scene loads.', 'error');
        }
    };

    const handleResetCamera = () => {
        if (orbitControlsRef.current) {
            orbitControlsRef.current.reset();
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
        setHistory([[]]);
        setHistoryIndex(0);
        setSelectedId(null);
        setSelectedRoomId(ROOMS[0].id);
        setCustomWallColor('');
        setCustomFloorColor('');
        setShadeLevel(0);
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
        if (!currentDesignId && !designName.trim()) {
            setSaveNameInput('');
            setIsSaveNameModalOpen(true);
            return;
        }
        await executeSave(designName);
    };

    const confirmSaveWithName = async () => {
        const name = saveNameInput.trim() || `Room Design - ${new Date().toLocaleDateString()}`;
        setDesignName(name);
        setIsSaveNameModalOpen(false);
        await executeSave(name);
    };

    // ✅ UPDATED: persist wall/floor colour + shade level
    const executeSave = async (name: string) => {
        const safeName = name || 'Untitled Room';
        setIsSaving(true);
        try {
            const designData = {
                name: safeName,
                roomType: selectedRoomId,
                furniture: placedItems,
                wallColor: effectiveWallColor,   // ✅
                floorColor: effectiveFloorColor, // ✅
                shadeLevel,                      // ✅
            };

            if (currentDesignId) {
                updateLocal(currentDesignId, designData);
            } else {
                const saved = saveToLocal(designData);
                setCurrentDesignId(saved.id);
                setSearchParams({ designId: saved.id });
            }

            const user = getUser();
            if (user?.id) {
                const supaPayload = {
                    user_id: user.id,
                    name: safeName,
                    room_type: selectedRoomId,
                    furniture_layout: placedItems,
                    wall_color: effectiveWallColor,   // ✅
                    floor_color: effectiveFloorColor, // ✅
                    shade_level: shadeLevel,          // ✅
                };

                if (currentDesignId) {
                    supabase.from('saved_designs').update(supaPayload).eq('id', currentDesignId).then(() => { });
                } else {
                    supabase.from('saved_designs').insert(supaPayload).then(() => { });
                }
            }

            showToastMessage('Design saved successfully!');
        } catch (err) {
            console.error('Save failed:', err);
            showToastMessage('Failed to save. Please try again.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-cream flex flex-col h-screen overflow-hidden">

            {/* ─── Delete Confirm Dialog ─── */}
            <ConfirmDialog
                open={isDeleteConfirmOpen}
                title="Remove Item"
                message={`Remove "${selectedItem?.name}" from the design? This cannot be undone.`}
                onConfirm={confirmDelete}
                onCancel={() => setIsDeleteConfirmOpen(false)}
            />

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
                        <div className="flex items-center gap-1.5 mr-2">
                            <button
                                onClick={handleUndo}
                                disabled={historyIndex <= 0}
                                className="group p-2 rounded-lg text-charcoal/50 hover:text-charcoal hover:bg-stone-light/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
                                title="Undo (Ctrl+Z)"
                            >
                                <Undo2 size={16} strokeWidth={1.5} />
                            </button>
                            <button
                                onClick={handleRedo}
                                disabled={historyIndex >= history.length - 1}
                                className="group p-2 rounded-lg text-charcoal/50 hover:text-charcoal hover:bg-stone-light/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
                                title="Redo (Ctrl+Y)"
                            >
                                <Redo2 size={16} strokeWidth={1.5} />
                            </button>
                        </div>
                        <div className="w-px h-6 bg-stone-light mr-1" />
                        <button
                            onClick={handleResetCamera}
                            className="group p-2 rounded-lg text-charcoal/50 hover:text-charcoal hover:bg-stone-light/30 transition-all duration-300 mr-2"
                            title="Reset Camera"
                        >
                            <CameraIcon size={16} strokeWidth={1.5} />
                        </button>
                        <button
                            onClick={handleExportImage}
                            className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[11px] tracking-[0.12em] uppercase font-medium
                                       border border-stone-light text-charcoal/60 hover:text-charcoal hover:border-charcoal/30 hover:bg-stone-light/20
                                       transition-all duration-300"
                            title="Export as PNG"
                        >
                            <Download size={14} strokeWidth={1.5} className="group-hover:-translate-y-0.5 transition-transform duration-300" />
                            <span className="hidden sm:inline">Export</span>
                        </button>
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
                            <button onClick={() => setIsNewDesignModalOpen(false)} className="absolute top-6 right-6 text-charcoal/30 hover:text-charcoal transition-colors duration-300 p-1 rounded-md hover:bg-stone-light/40">
                                <X size={18} strokeWidth={1.5} />
                            </button>
                            <div className="mb-8">
                                <p className="text-[10px] tracking-[0.3em] uppercase text-stone-dark mb-3">Start Fresh</p>
                                <h3 className="text-3xl font-serif text-charcoal">New <span className="italic">Design</span></h3>
                            </div>
                            <form onSubmit={(e) => { e.preventDefault(); confirmCreateNew(); }}>
                                <label className="block text-[10px] tracking-[0.2em] uppercase text-charcoal/50 mb-2.5 font-medium">Design Name</label>
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
                                    <button type="button" onClick={() => setIsNewDesignModalOpen(false)} className="px-6 py-3 rounded-lg text-[11px] tracking-[0.12em] uppercase font-medium text-charcoal/50 hover:text-charcoal hover:bg-stone-light/30 transition-all duration-300">Cancel</button>
                                    <button type="submit" className="group bg-charcoal text-white px-8 py-3 rounded-lg text-[11px] tracking-[0.12em] uppercase font-medium hover:bg-charcoal-light transition-all duration-300 shadow-sm hover:shadow-md inline-flex items-center gap-2">
                                        <Plus size={14} strokeWidth={2} />
                                        Create Design
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Save Name Modal ─── */}
            <AnimatePresence>
                {isSaveNameModalOpen && (
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
                            <button onClick={() => setIsSaveNameModalOpen(false)} className="absolute top-6 right-6 text-charcoal/30 hover:text-charcoal transition-colors duration-300 p-1 rounded-md hover:bg-stone-light/40">
                                <X size={18} strokeWidth={1.5} />
                            </button>
                            <div className="mb-8">
                                <p className="text-[10px] tracking-[0.3em] uppercase text-stone-dark mb-3">Save Your Work</p>
                                <h3 className="text-3xl font-serif text-charcoal">Name Your <span className="italic">Design</span></h3>
                            </div>
                            <form onSubmit={(e) => { e.preventDefault(); confirmSaveWithName(); }}>
                                <label className="block text-[10px] tracking-[0.2em] uppercase text-charcoal/50 mb-2.5 font-medium">Design Name</label>
                                <input
                                    type="text"
                                    autoFocus
                                    value={saveNameInput}
                                    onChange={(e) => setSaveNameInput(e.target.value)}
                                    placeholder="e.g. My Living Room"
                                    className="w-full border border-stone-light bg-white rounded-lg px-4 py-3.5 text-sm text-charcoal placeholder:text-charcoal/25
                                               focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/10 transition-all duration-300 mb-8"
                                />
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsSaveNameModalOpen(false)} className="px-6 py-3 rounded-lg text-[11px] tracking-[0.12em] uppercase font-medium text-charcoal/50 hover:text-charcoal hover:bg-stone-light/30 transition-all duration-300">Cancel</button>
                                    <button type="submit" className="group bg-charcoal text-white px-8 py-3 rounded-lg text-[11px] tracking-[0.12em] uppercase font-medium hover:bg-charcoal-light transition-all duration-300 shadow-sm hover:shadow-md inline-flex items-center gap-2">
                                        <Save size={14} strokeWidth={1.5} />
                                        Save Design
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
                        <div className="grid grid-cols-2 gap-2 mb-4">
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

                        {/* ✅ NEW: Wall Colour Picker */}
                        <div className="flex flex-col gap-3 pt-3 border-t border-stone-light/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-charcoal/55">
                                    <Paintbrush size={13} strokeWidth={1.5} />
                                    <span className="text-[11px] tracking-wide font-medium">Wall Colour</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-charcoal/35 font-mono">{effectiveWallColor}</span>
                                    <input
                                        type="color"
                                        value={effectiveWallColor}
                                        onChange={(e) => setCustomWallColor(e.target.value)}
                                        className="w-8 h-8 rounded-md border border-stone-light cursor-pointer bg-transparent p-0.5"
                                        title="Pick wall colour"
                                    />
                                </div>
                            </div>

                            {/* ✅ NEW: Floor Colour Picker */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-charcoal/55">
                                    <GridIcon size={13} strokeWidth={1.5} />
                                    <span className="text-[11px] tracking-wide font-medium">Floor Colour</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-charcoal/35 font-mono">{effectiveFloorColor}</span>
                                    <input
                                        type="color"
                                        value={effectiveFloorColor}
                                        onChange={(e) => setCustomFloorColor(e.target.value)}
                                        className="w-8 h-8 rounded-md border border-stone-light cursor-pointer bg-transparent p-0.5"
                                        title="Pick floor colour"
                                    />
                                </div>
                            </div>

                            {/* ✅ NEW: Shading Overlay */}
                            <div className="flex flex-col gap-2 pt-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-charcoal/55">
                                        <Sun size={13} strokeWidth={1.5} />
                                        <span className="text-[11px] tracking-wide font-medium">Room Shading</span>
                                    </div>
                                    <span className="text-[10px] font-medium text-charcoal bg-stone-light/30 px-1.5 py-0.5 rounded">
                                        {Math.round(shadeLevel * 100)}%
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="80"
                                    step="5"
                                    value={shadeLevel * 100}
                                    onChange={(e) => setShadeLevel(parseFloat(e.target.value) / 100)}
                                    className="w-full h-1.5 bg-stone-light/50 rounded-lg appearance-none cursor-pointer accent-charcoal"
                                />
                                <p className="text-[9px] text-charcoal/30 tracking-wide">
                                    Simulates room lighting / ambiance
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ─ Tools ─ */}
                    <div className="p-5 border-b border-stone-light/70">
                        <p className="text-[10px] tracking-[0.25em] uppercase text-charcoal/40 mb-3 font-medium">Transform</p>
                        <div className="flex gap-2 mb-3">
                            <button
                                onClick={() => setTransformMode('translate')}
                                className={`flex-1 flex flex-col items-center justify-center py-3.5 rounded-xl border transition-all duration-300
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
                                className={`flex-1 flex flex-col items-center justify-center py-3.5 rounded-xl border transition-all duration-300
                                    ${transformMode === 'rotate'
                                        ? 'border-sage/40 bg-sage/10 text-sage-dark shadow-sm'
                                        : 'border-stone-light/60 text-charcoal/40 hover:bg-stone-light/30 hover:text-charcoal/60 hover:border-stone-light'
                                    }`}
                            >
                                <RotateCw size={18} strokeWidth={1.5} className="mb-1.5" />
                                <span className="text-[10px] tracking-wide font-medium uppercase">Rotate</span>
                            </button>
                        </div>

                        <div className="flex items-center justify-between px-2 mt-4 bg-stone-light/20 py-2 rounded-lg border border-stone-light/40">
                            <div className="flex items-center gap-2 text-charcoal/60">
                                <GridIcon size={14} strokeWidth={1.5} />
                                <span className="text-[11px] tracking-wide font-medium">Snap to Grid</span>
                            </div>
                            <button
                                onClick={() => setSnapToGrid(!snapToGrid)}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 focus:outline-none ${snapToGrid ? 'bg-sage' : 'bg-stone-light/60'}`}
                            >
                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${snapToGrid ? 'translate-x-4.5' : 'translate-x-1'}`} />
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
                                    <img
                                        src={`/furniture-icons/${item.type}.png`}
                                        alt={item.name}
                                        className="w-12 h-12 object-contain mb-2.5 transition-transform duration-200 group-hover:scale-105"
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
                                className="border-t border-stone-light/70 bg-white/50 backdrop-blur-md overflow-y-auto max-h-[50vh] scrollbar-thin scrollbar-thumb-stone-light scrollbar-track-transparent"
                            >
                                <div className="p-5 flex flex-col gap-4">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[10px] tracking-[0.25em] uppercase text-charcoal/40 font-bold">Selected Item</p>
                                        <span className="text-lg font-serif text-charcoal">{selectedItem.name}</span>
                                    </div>

                                    {/* ✅ NEW: Furniture Colour Picker */}
                                    <div className="bg-white rounded-xl p-3 border border-stone-light/60 shadow-sm">
                                        <p className="text-[10px] tracking-widest uppercase text-charcoal/50 font-medium mb-3">Item Colour</p>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={selectedItem.color ?? getDefaultColorForType(selectedItem.type)}
                                                onChange={(e) => updateItem(selectedItem.id, { color: e.target.value })}
                                                className="w-10 h-10 rounded-lg border border-stone-light cursor-pointer bg-transparent p-0.5 flex-shrink-0"
                                                title="Change furniture colour"
                                            />
                                            <div className="flex-1">
                                                <p className="text-[11px] text-charcoal/60 font-mono mb-1">
                                                    {selectedItem.color ?? getDefaultColorForType(selectedItem.type)}
                                                </p>
                                                <div className="flex gap-1.5 flex-wrap">
                                                    {['#8B7355', '#A0522D', '#BC8F8F', '#DEB887', '#8DA399', '#4A4A4A', '#F5F0EA', '#C9A87C'].map(c => (
                                                        <button
                                                            key={c}
                                                            onClick={() => updateItem(selectedItem.id, { color: c })}
                                                            className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                                                            style={{
                                                                background: c,
                                                                borderColor: selectedItem.color === c ? '#1A1A1A' : 'transparent'
                                                            }}
                                                            title={c}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Position Controls */}
                                    <div className="bg-white rounded-xl p-3 border border-stone-light/60 shadow-sm flex flex-col gap-2">
                                        <p className="text-[10px] tracking-widest uppercase text-charcoal/50 font-medium">Position</p>
                                        <div className="flex gap-2">
                                            <div className="flex-1 flex items-center bg-stone-light/15 rounded-lg border border-stone-light/40 overflow-hidden focus-within:border-sage/60 focus-within:ring-1 focus-within:ring-sage/20 transition-all">
                                                <span className="text-[10px] font-bold text-charcoal/40 px-2.5 bg-stone-light/20 h-full flex items-center border-r border-stone-light/40">X</span>
                                                <input
                                                    type="number"
                                                    value={selectedItem.position[0].toFixed(2)}
                                                    onChange={(e) => updateItem(selectedItem.id, { position: [parseFloat(e.target.value) || 0, selectedItem.position[1], selectedItem.position[2]] })}
                                                    step={snapToGrid ? 0.5 : 0.1}
                                                    className="w-full text-xs text-charcoal bg-transparent px-2 py-1.5 outline-none"
                                                />
                                            </div>
                                            <div className="flex-1 flex items-center bg-stone-light/15 rounded-lg border border-stone-light/40 overflow-hidden focus-within:border-sage/60 focus-within:ring-1 focus-within:ring-sage/20 transition-all">
                                                <span className="text-[10px] font-bold text-charcoal/40 px-2.5 bg-stone-light/20 h-full flex items-center border-r border-stone-light/40">Z</span>
                                                <input
                                                    type="number"
                                                    value={selectedItem.position[2].toFixed(2)}
                                                    onChange={(e) => updateItem(selectedItem.id, { position: [selectedItem.position[0], selectedItem.position[1], parseFloat(e.target.value) || 0] })}
                                                    step={snapToGrid ? 0.5 : 0.1}
                                                    className="w-full text-xs text-charcoal bg-transparent px-2 py-1.5 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rotation Control */}
                                    <div className="bg-white rounded-xl p-3 border border-stone-light/60 shadow-sm flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[10px] tracking-widest uppercase text-charcoal/50 font-medium">Rotation</p>
                                            <span className="text-[10px] font-medium text-charcoal bg-stone-light/30 px-1.5 py-0.5 rounded">
                                                {Math.round((selectedItem.rotation[1] * 180) / Math.PI)}°
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="360"
                                            step={snapToGrid ? 45 : 1}
                                            value={(selectedItem.rotation[1] * 180) / Math.PI}
                                            onChange={(e) => updateItem(selectedItem.id, { rotation: [selectedItem.rotation[0], (parseFloat(e.target.value) * Math.PI) / 180, selectedItem.rotation[2]] })}
                                            className="w-full h-1.5 bg-stone-light/50 rounded-lg appearance-none cursor-pointer accent-sage"
                                        />
                                    </div>

                                    {/* Size Control */}
                                    <div className="bg-white rounded-xl p-3 border border-stone-light/60 shadow-sm flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[10px] tracking-widest uppercase text-charcoal/50 font-medium">Size</p>
                                            <span className="text-[10px] font-medium text-charcoal bg-stone-light/30 px-1.5 py-0.5 rounded">
                                                {Math.round((selectedItem.scale?.[0] || 1) * 100)}%
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="20"
                                            max="200"
                                            step={5}
                                            value={(selectedItem.scale?.[0] || 1) * 100}
                                            onChange={(e) => {
                                                const s = parseFloat(e.target.value) / 100;
                                                updateItem(selectedItem.id, { scale: [s, s, s] });
                                            }}
                                            className="w-full h-1.5 bg-stone-light/50 rounded-lg appearance-none cursor-pointer accent-sage"
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2 pt-2 border-t border-stone-light/50">
                                        <p className="text-[10px] tracking-widest uppercase text-charcoal/40 font-medium mb-1">Actions</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={duplicateItem}
                                                className="flex-1 py-2.5 rounded-lg text-[11px] tracking-[0.05em] uppercase font-medium
                                                           text-charcoal bg-white border border-stone-light shadow-sm
                                                           hover:bg-stone-light/20 hover:border-charcoal/30
                                                           transition-all duration-300 flex items-center justify-center gap-1.5"
                                            >
                                                <Copy size={13} strokeWidth={1.5} />
                                                Duplicate
                                            </button>
                                            <button
                                                onClick={deleteSelected}
                                                className="flex-1 py-2.5 rounded-lg text-[11px] tracking-[0.05em] uppercase font-medium
                                                           text-white bg-red-400 border border-red-500/50 shadow-sm
                                                           hover:bg-red-500 hover:shadow-md hover:-translate-y-0.5
                                                           transition-all duration-300 flex items-center justify-center gap-1.5"
                                            >
                                                <Trash2 size={13} strokeWidth={1.5} className="opacity-80" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.aside>

                {/* ─── Canvas Area ─── */}
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

                    {/* ✅ FIX: use onCreated to capture gl for export */}
                    <Canvas
                        shadows
                        gl={{ preserveDrawingBuffer: true }}
                        onCreated={({ gl }) => { glRef.current = gl; }}
                    >
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

                        {/* ✅ Pass live colour overrides to room geometry */}
                        <RoomGeometry
                            room={activeRoom}
                            wallColor={effectiveWallColor}
                            floorColor={effectiveFloorColor}
                            onDeselect={() => setSelectedId(null)}
                        />

                        {placedItems.map((item) => (
                            <Model
                                key={item.id}
                                item={item}
                                isSelected={selectedId === item.id}
                                onSelect={() => setSelectedId(item.id)}
                                transformMode={transformMode}
                                updateItem={updateItem}
                                setIsDragging={setIsDragging}
                                snapToGrid={snapToGrid}
                            />
                        ))}

                        {viewMode === '3d' ? (
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            <OrbitControls ref={orbitControlsRef as any} makeDefault enabled={!isDragging} minPolarAngle={0} maxPolarAngle={Math.PI / 2 - 0.05} />
                        ) : (
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            <OrbitControls ref={orbitControlsRef as any} makeDefault enabled={!isDragging} enableRotate={false} />
                        )}
                    </Canvas>

                    {/* ✅ NEW: Shading overlay rendered on top of canvas */}
                    {shadeLevel > 0 && (
                        <div
                            className="absolute inset-0 pointer-events-none transition-all duration-300"
                            style={{ background: `rgba(0, 0, 0, ${shadeLevel})` }}
                        />
                    )}
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
                        className="fixed bottom-8 right-8 bg-charcoal text-white pl-5 pr-6 py-4 rounded-xl shadow-2xl flex items-center gap-3.5 z-50 pointer-events-none border border-white/5"
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