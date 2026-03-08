import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  TransformControls, 
  Environment,
  Grid,
  OrthographicCamera,
  PerspectiveCamera,
  Box as BoxShape,
  Cylinder as CylinderShape
} from '@react-three/drei';
import { ArrowLeft, Box as BoxIcon, Move, RotateCw, Trash2, LayoutTemplate, Save, Check, AlertCircle, Plus, X, ChevronDown, Home } from 'lucide-react';
import * as THREE from 'three';
import { supabase } from '../utils/supabase';
import { getUser } from '../utils/auth';

// --- Types ---
type FurnitureType = {
  id: string;
  type: 'sofa' | 'table' | 'plant' | 'bed' | 'shelf';
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
};

// --- Catalog ---
const CATALOG: { type: FurnitureType['type'], name: string, color: string }[] = [
  { type: 'sofa', name: 'Sofa', color: '#8DA399' },
  { type: 'table', name: 'Table', color: '#D4CDC4' },
  { type: 'plant', name: 'Plant', color: '#6B8A7E' },
  { type: 'bed', name: 'Bed', color: '#FAF9F6' },
  { type: 'shelf', name: 'Shelf', color: '#9C9488' }
];

// --- Room Types ---
type RoomType = {
  id: string;
  name: string;
  width: number;
  depth: number;
  floorColor: string;
  wallColor: string;
};

const ROOMS: RoomType[] = [
  { id: 'room-studio', name: 'Studio (Small)', width: 10, depth: 10, floorColor: '#E5E1D8', wallColor: '#F5F5F0' },
  { id: 'room-bedroom', name: 'Bedroom (Medium)', width: 15, depth: 12, floorColor: '#D4CDC4', wallColor: '#E8ECEB' },
  { id: 'room-living', name: 'Living Room (Large)', width: 25, depth: 20, floorColor: '#C2B8A3', wallColor: '#FAF9F6' }
];

// --- Simple Primitive Models ---
function SofaModel() {
    return (
        <group>
            {/* Base */}
            <BoxShape args={[2, 0.4, 1]} position={[0, 0.2, 0]} castShadow>
                <meshStandardMaterial color="#8DA399" />
            </BoxShape>
            {/* Backrest */}
            <BoxShape args={[2, 0.8, 0.3]} position={[0, 0.8, -0.35]} castShadow>
                <meshStandardMaterial color="#8DA399" />
            </BoxShape>
            {/* Armrests */}
            <BoxShape args={[0.3, 0.6, 1]} position={[-0.85, 0.5, 0]} castShadow>
                <meshStandardMaterial color="#8DA399" />
            </BoxShape>
            <BoxShape args={[0.3, 0.6, 1]} position={[0.85, 0.5, 0]} castShadow>
                <meshStandardMaterial color="#8DA399" />
            </BoxShape>
        </group>
    );
}

function TableModel() {
    return (
        <group>
            {/* Top */}
            <BoxShape args={[1.5, 0.1, 1]} position={[0, 0.8, 0]} castShadow>
                <meshStandardMaterial color="#D4CDC4" />
            </BoxShape>
            {/* Legs */}
            <CylinderShape args={[0.05, 0.05, 0.8]} position={[-0.65, 0.4, -0.4]} castShadow>
                <meshStandardMaterial color="#1A1A1A" />
            </CylinderShape>
            <CylinderShape args={[0.05, 0.05, 0.8]} position={[0.65, 0.4, -0.4]} castShadow>
                <meshStandardMaterial color="#1A1A1A" />
            </CylinderShape>
            <CylinderShape args={[0.05, 0.05, 0.8]} position={[-0.65, 0.4, 0.4]} castShadow>
                <meshStandardMaterial color="#1A1A1A" />
            </CylinderShape>
            <CylinderShape args={[0.05, 0.05, 0.8]} position={[0.65, 0.4, 0.4]} castShadow>
                <meshStandardMaterial color="#1A1A1A" />
            </CylinderShape>
        </group>
    );
}

function BedModel() {
    return (
        <group>
            {/* Frame */}
            <BoxShape args={[1.6, 0.3, 2.2]} position={[0, 0.15, 0]} castShadow>
                <meshStandardMaterial color="#D4CDC4" />
            </BoxShape>
            {/* Mattress */}
            <BoxShape args={[1.5, 0.2, 2.1]} position={[0, 0.4, 0]} castShadow>
                <meshStandardMaterial color="#FAF9F6" />
            </BoxShape>
            {/* Headboard */}
            <BoxShape args={[1.6, 1, 0.15]} position={[0, 0.5, -1.025]} castShadow>
                <meshStandardMaterial color="#9C9488" />
            </BoxShape>
        </group>
    );
}

function ShelfModel() {
    return (
        <group>
            {/* Sides */}
            <BoxShape args={[0.1, 2, 0.4]} position={[-0.8, 1, 0]} castShadow>
                <meshStandardMaterial color="#1A1A1A" />
            </BoxShape>
            <BoxShape args={[0.1, 2, 0.4]} position={[0.8, 1, 0]} castShadow>
                <meshStandardMaterial color="#1A1A1A" />
            </BoxShape>
            {/* Shelves */}
            {[0.2, 0.7, 1.2, 1.7].map((y, i) => (
                <BoxShape key={i} args={[1.7, 0.05, 0.38]} position={[0, y, 0]} castShadow>
                    <meshStandardMaterial color="#9C9488" />
                </BoxShape>
            ))}
        </group>
    );
}

function PlantModel() {
    return (
        <group>
            {/* Pot */}
            <CylinderShape args={[0.2, 0.15, 0.4]} position={[0, 0.2, 0]} castShadow>
                <meshStandardMaterial color="#FAF9F6" />
            </CylinderShape>
            {/* Stem */}
            <CylinderShape args={[0.02, 0.02, 0.8]} position={[0, 0.8, 0]} castShadow>
                <meshStandardMaterial color="#6B8A7E" />
            </CylinderShape>
            {/* Leaves (Simplified) */}
            <BoxShape args={[0.4, 0.05, 0.4]} position={[0, 1.2, 0]} castShadow>
                <meshStandardMaterial color="#6B8A7E" />
            </BoxShape>
            <BoxShape args={[0.3, 0.05, 0.3]} position={[0, 0.9, 0.1]} rotation={[0.2, 0, 0]} castShadow>
                <meshStandardMaterial color="#6B8A7E" />
            </BoxShape>
            <BoxShape args={[0.3, 0.05, 0.3]} position={[0, 0.7, -0.1]} rotation={[-0.2, 0, 0]} castShadow>
                <meshStandardMaterial color="#6B8A7E" />
            </BoxShape>
        </group>
    );
}


function getModelForType(type: FurnitureType['type']) {
    switch (type) {
        case 'sofa': return <SofaModel />;
        case 'table': return <TableModel />;
        case 'bed': return <BedModel />;
        case 'shelf': return <ShelfModel />;
        case 'plant': return <PlantModel />;
        default: return <BoxShape args={[1, 1, 1]}><meshStandardMaterial color="hotpink" /></BoxShape>;
    }
}

// --- Draggable Model Wrapper ---
function Model({ 
  item, 
  isSelected, 
  onSelect, 
  transformMode, 
  updateItem,
  setIsDragging
}: { 
  item: FurnitureType; 
  isSelected: boolean; 
  onSelect: () => void;
  transformMode: 'translate' | 'rotate';
  updateItem: (id: string, updates: Partial<FurnitureType>) => void;
  setIsDragging: (val: boolean) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformRef = useRef<any>(null); 

  useEffect(() => {
    if (transformRef.current) {
      const controls = transformRef.current;
      
      const draggingChanged = (e: { value: boolean }) => {
        // e.value is true on drag start, false on drag end.
        setIsDragging(e.value);
        
        // We only persist the new position/rotation into React state when the user drops the item.
        // This prevents React from continuously re-rendering the scene 60 times a second during dragging.
        if (!e.value && groupRef.current) {
          updateItem(item.id, {
            position: [groupRef.current.position.x, groupRef.current.position.y, groupRef.current.position.z],
            rotation: [groupRef.current.rotation.x, groupRef.current.rotation.y, groupRef.current.rotation.z]
          });
        }
      };

      if (controls) {
        controls.addEventListener('dragging-changed', draggingChanged);
      }
      
      return () => {
        if (controls) {
          controls.removeEventListener('dragging-changed', draggingChanged);
        }
      };
    }
  }, [isSelected, item.id, updateItem, setIsDragging]);

  return (
    <>
      <group 
        ref={groupRef} 
        // We initialize the local position/rotation from state
        position={item.position} 
        rotation={item.rotation}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        {getModelForType(item.type)}
      </group>
      {isSelected && (
        <TransformControls 
          ref={transformRef}
          // @ts-expect-error type incompatibility in newer drei versions
          object={groupRef} 
          mode={transformMode}
          showX={transformMode === 'translate'}
          showY={transformMode === 'rotate'}
          showZ={transformMode === 'translate'}
        />
      )}
    </>
  );
}

// --- Room Geometry Component ---
function RoomGeometry({ room, onDeselect }: { room: RoomType; onDeselect: () => void }) {
  const wallHeight = 4;
  const wallThickness = 0.5;

  return (
    <group>
      {/* Floor */}
      <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -0.02, 0]} 
          receiveShadow 
          onClick={(e) => {
              if (e.object === e.eventObject) onDeselect();
          }}
      >
          <planeGeometry args={[room.width, room.depth]} />
          <meshStandardMaterial color={room.floorColor} />
      </mesh>

      {/* Back Wall */}
      <BoxShape args={[room.width, wallHeight, wallThickness]} position={[0, wallHeight / 2, -room.depth / 2]} receiveShadow castShadow>
          <meshStandardMaterial color={room.wallColor} />
      </BoxShape>

      {/* Left Wall */}
      <BoxShape args={[wallThickness, wallHeight, room.depth]} position={[-room.width / 2, wallHeight / 2, 0]} receiveShadow castShadow>
          <meshStandardMaterial color={room.wallColor} />
      </BoxShape>

      {/* Right Wall */}
      <BoxShape args={[wallThickness, wallHeight, room.depth]} position={[room.width / 2, wallHeight / 2, 0]} receiveShadow castShadow>
          <meshStandardMaterial color={room.wallColor} />
      </BoxShape>
    </group>
  );
}

// --- Custom Room Dropdown ---
function RoomDropdown({ value, onChange, rooms }: { value: string; onChange: (v: string) => void; rooms: RoomType[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const activeRoom = rooms.find(r => r.id === value) || rooms[0];

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border transition-all cursor-pointer
                    ${isOpen ? 'border-sage shadow-sm bg-white' : 'border-stone-light bg-warm-white hover:border-charcoal/30'}`}
            >
                <Home size={14} className="text-charcoal/50" />
                <span className="text-charcoal">{activeRoom.name}</span>
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={13} className="text-charcoal/40" />
                </motion.span>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute left-0 top-full mt-2 w-56 bg-white/95 backdrop-blur-xl border border-stone-light shadow-xl z-50 overflow-hidden rounded-lg"
                    >
                        {rooms.map(r => (
                            <button
                                key={r.id}
                                onClick={() => { onChange(r.id); setIsOpen(false); }}
                                className={`w-full text-left px-4 py-3 text-[13px] flex items-center gap-3 transition-all duration-200
                                    ${value === r.id
                                        ? 'bg-cream text-charcoal font-medium'
                                        : 'text-charcoal/60 hover:bg-stone-light/30 hover:text-charcoal'
                                    }`}
                            >
                                <div className="w-4 h-4 rounded-sm shadow-inner" style={{ backgroundColor: r.floorColor }} />
                                {r.name}
                                {value === r.id && <Check size={13} className="ml-auto text-sage" strokeWidth={2.5} />}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- Main Workspace Component ---
export default function DesignerWorkspace() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const designIdFromUrl = searchParams.get('designId');
    
    // State
    const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');
    const [transformMode, setTransformMode] = useState<'translate' | 'rotate'>('translate');
    const [placedItems, setPlacedItems] = useState<FurnitureType[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedRoomId, setSelectedRoomId] = useState<string>(ROOMS[0].id);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

    // Design identity
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

    // --- Backend Sync ---
    useEffect(() => {
        const loadDesigns = async () => {
            const user = getUser();
            if (!user?.id) return;
            
            let query = supabase
                .from('saved_designs')
                .select('*');

            if (designIdFromUrl) {
                // Load a specific design by ID
                query = query.eq('id', designIdFromUrl);
            } else {
                // Fall back to most recent design by this user
                query = query
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1);
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
            // Spawn slightly offset so they don't perfectly overlap if clicked twice
            position: [placedItems.length * 0.5, 0, 0], 
            rotation: [0, 0, 0],
        };
        setPlacedItems((prev) => [...prev, newItem]);
        setSelectedId(newItem.id);
    };

    const updateItem = (id: string, updates: Partial<FurnitureType>) => {
        setPlacedItems((prev) => 
            prev.map(item => item.id === id ? { ...item, ...updates } : item)
        );
    };

    const deleteSelected = () => {
        if (selectedId) {
            setPlacedItems((prev) => prev.filter(item => item.id !== selectedId));
            setSelectedId(null);
        }
    };

    // --- Create New Design ---
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

    // --- Save (Insert or Update) ---
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
                furniture_layout: placedItems
            };

            if (currentDesignId) {
                // Update existing design
                const { error } = await supabase
                    .from('saved_designs')
                    .update(payload)
                    .eq('id', currentDesignId);
                if (error) throw error;
                showToastMessage('Design saved');
            } else {
                // Insert new design
                const { data, error } = await supabase
                    .from('saved_designs')
                    .insert(payload)
                    .select()
                    .single();
                if (error) throw error;
                setCurrentDesignId(data.id);
                setSearchParams({ designId: data.id });
                showToastMessage('New design saved');
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "An unknown error occurred";
            console.error('Error saving design:', error);
            showToastMessage(`Failed to save: ${message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-cream flex flex-col h-screen overflow-hidden">
            {/* Top Bar */}
            <header className="border-b border-stone-light bg-warm-white flex-shrink-0">
                <div className="mx-auto px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="inline-flex items-center gap-2 text-sm text-charcoal/60 hover:text-charcoal transition-colors duration-300 cursor-pointer"
                        >
                            <ArrowLeft size={16} strokeWidth={1.5} />
                            Back
                        </button>
                        {/* Design Name (editable inline) */}
                        <div className="border-l border-stone-light pl-5">
                            {isEditingName ? (
                                <input
                                    autoFocus
                                    value={designName}
                                    onChange={(e) => setDesignName(e.target.value)}
                                    onBlur={() => setIsEditingName(false)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingName(false); }}
                                    className="font-serif text-lg text-charcoal bg-transparent border-b-2 border-sage outline-none py-0.5 px-1 -ml-1 min-w-[180px]"
                                />
                            ) : (
                                <button
                                    onClick={() => setIsEditingName(true)}
                                    className="font-serif text-lg text-charcoal hover:text-sage-dark transition-colors cursor-text flex items-center gap-2 group"
                                    title="Click to rename"
                                >
                                    {designName || 'Untitled Room'}
                                    <span className="text-[10px] text-charcoal/30 group-hover:text-sage uppercase tracking-wider">edit</span>
                                </button>
                            )}
                            <p className="text-[10px] text-charcoal/40 uppercase tracking-wider mt-0.5">
                                {currentDesignId ? 'Saved' : 'Unsaved draft'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center bg-stone-light/40 p-1 rounded-md">
                            <button
                                onClick={() => setViewMode('2d')}
                                className={`px-4 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition-colors ${viewMode === '2d' ? 'bg-white shadow-sm text-charcoal' : 'text-charcoal/60 hover:text-charcoal'}`}
                            >
                                <LayoutTemplate size={16} />
                                2D View
                            </button>
                            <button
                                onClick={() => setViewMode('3d')}
                                className={`px-4 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition-colors ${viewMode === '3d' ? 'bg-white shadow-sm text-charcoal' : 'text-charcoal/60 hover:text-charcoal'}`}
                            >
                                <BoxIcon size={16} />
                                3D View
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <RoomDropdown value={selectedRoomId} onChange={setSelectedRoomId} rooms={ROOMS} />
                        <button
                            onClick={deleteSelected}
                            disabled={!selectedId}
                            className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors flex items-center gap-2 ${selectedId ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-transparent text-charcoal/20'}`}
                            title="Delete Selected"
                        >
                            <Trash2 size={16} />
                            Remove
                        </button>
                        <button
                            onClick={handleCreateNew}
                            className="px-4 py-2 rounded-md border border-stone-light text-sm font-medium text-charcoal/70 hover:text-charcoal hover:border-charcoal/30 transition-colors flex items-center gap-2"
                            title="Start fresh"
                        >
                            <Plus size={16} />
                            New
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-4 py-2 rounded-md bg-sage text-white text-sm font-medium hover:bg-sage-dark transition-colors flex items-center gap-2 disabled:opacity-70 shadow-sm"
                            title="Save to Database"
                        >
                            <Save size={16} />
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </header>

            {/* New Design Modal */}
            <AnimatePresence>
                {isNewDesignModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white w-full max-w-md p-8 shadow-2xl relative"
                        >
                            <button
                                onClick={() => setIsNewDesignModalOpen(false)}
                                className="absolute top-6 right-6 text-charcoal/50 hover:text-charcoal transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <h3 className="text-2xl font-serif text-charcoal mb-2">New Design</h3>
                            <p className="text-[13px] text-charcoal/50 mb-6">Give your room design a name to get started.</p>

                            <form onSubmit={(e) => { e.preventDefault(); confirmCreateNew(); }}>
                                <label className="block text-[11px] uppercase tracking-wider text-charcoal/60 mb-2">Design Name</label>
                                <input
                                    type="text"
                                    autoFocus
                                    value={newDesignName}
                                    onChange={(e) => setNewDesignName(e.target.value)}
                                    placeholder="e.g. My Living Room"
                                    className="w-full border border-stone-light bg-warm-white px-4 py-3 text-sm focus:outline-none focus:border-sage transition-colors mb-6"
                                />

                                <div className="flex justify-end gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsNewDesignModalOpen(false)}
                                        className="px-6 py-3 text-[12px] uppercase tracking-wider text-charcoal/70 hover:text-charcoal"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-charcoal text-white px-8 py-3 text-[12px] uppercase tracking-wider hover:bg-charcoal/90 transition-colors"
                                    >
                                        Create Design
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Main Area */}
            <main className="flex-1 flex overflow-hidden">
                {/* Left Sidebar: Tools & Catalog */}
                <aside className="w-64 border-r border-stone-light bg-warm-white flex flex-col pb-4 h-full z-10 shadow-sm relative">
                    <div className="p-5 border-b border-stone-light">
                        <h2 className="font-serif text-lg text-charcoal mb-4">Toolbar</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setTransformMode('translate')}
                                className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${transformMode === 'translate' ? 'border-sage bg-sage/10 text-sage-dark' : 'border-stone-light text-charcoal/60 hover:bg-stone-light/30'}`}
                            >
                                <Move size={20} className="mb-1" />
                                <span className="text-xs font-medium">Move</span>
                            </button>
                            <button
                                onClick={() => setTransformMode('rotate')}
                                className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${transformMode === 'rotate' ? 'border-sage bg-sage/10 text-sage-dark' : 'border-stone-light text-charcoal/60 hover:bg-stone-light/30'}`}
                            >
                                <RotateCw size={20} className="mb-1" />
                                <span className="text-xs font-medium">Rotate</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-5 flex-1 overflow-y-auto scrollbar-none">
                        <h2 className="font-serif text-lg text-charcoal mb-4">Catalog</h2>
                        <p className="text-xs text-charcoal/50 mb-4 tracking-wide uppercase">Click to add</p>
                        <div className="grid grid-cols-2 gap-3">
                            {CATALOG.map((item) => (
                                <button
                                    key={item.name}
                                    onClick={() => addItem(item)}
                                    className="aspect-square flex flex-col items-center justify-center bg-stone-light/30 border border-stone-light/50 rounded-xl hover:border-sage hover:bg-sage/5 transition-all group"
                                >
                                    <div className="w-8 h-8 rounded-sm mb-2 shadow-inner" style={{ backgroundColor: item.color }} />
                                    <span className="text-xs font-medium text-charcoal/80 group-hover:text-charcoal">{item.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Right Area: 3D Canvas */}
                <section className="flex-1 relative cursor-crosshair bg-stone-light/20">
                    <Canvas shadows>
                        {viewMode === '2d' ? (
                           <OrthographicCamera makeDefault position={[0, 10, 0]} zoom={60} near={0.1} far={100} rotation={[-Math.PI / 2, 0, 0]} />
                        ) : (
                           <PerspectiveCamera makeDefault position={[5, 4, 5]} fov={50} />
                        )}

                        <ambientLight intensity={0.6} />
                        <directionalLight position={[10, 15, 10]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
                        <Environment preset="city" />

                        {/* We hide the grid in 3D to make realistic rooms look cleaner, but keep it in 2D for layout */}
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

                        {/* Enable orbiting based on viewMode. makeDefault=true pauses orbit when using TransformControls */}
                        {viewMode === '3d' ? (
                            <OrbitControls makeDefault enabled={!isDragging} minPolarAngle={0} maxPolarAngle={Math.PI / 2 - 0.05} />
                        ) : (
                            <OrbitControls makeDefault enabled={!isDragging} enableRotate={false} />
                        )}
                    </Canvas>
                </section>
            </main>

            {/* Success/Error Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed bottom-8 right-8 bg-charcoal text-white px-6 py-4 shadow-xl flex items-center gap-3 z-50 pointer-events-none"
                    >
                        <div className={`p-1.5 rounded-full text-white ${toast.type === 'success' ? 'bg-sage' : 'bg-red-500'}`}>
                            {toast.type === 'success' ? <Check size={14} strokeWidth={3} /> : <AlertCircle size={14} strokeWidth={3} />}
                        </div>
                        <span className="text-sm tracking-wide">{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
