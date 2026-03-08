import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ArrowLeft, Box as BoxIcon, Move, RotateCw, Trash2, LayoutTemplate, Save, Check, AlertCircle } from 'lucide-react';
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
          showY={false}
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

// --- Main Workspace Component ---
export default function DesignerWorkspace() {
    const navigate = useNavigate();
    
    // State
    const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');
    const [transformMode, setTransformMode] = useState<'translate' | 'rotate'>('translate');
    const [placedItems, setPlacedItems] = useState<FurnitureType[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedRoomId, setSelectedRoomId] = useState<string>(ROOMS[0].id);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

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
            
            const { data, error } = await supabase
                .from('saved_designs')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1);
                
            if (data && data.length > 0 && !error) {
                const design = data[0];
                setSelectedRoomId(design.room_type);
                setPlacedItems(design.furniture_layout || []);
            }
        };
        loadDesigns();
    }, []);

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

    const handleSave = async () => {
        const user = getUser();
        if (!user?.id) {
            showToastMessage('Please sign in to save your 3D designs to the cloud computing systems.', 'error');
            return;
        }

        setIsSaving(true);
        try {
            // We insert a new version into the history ledger
            const { error } = await supabase.from('saved_designs').insert({
                user_id: user.id,
                name: `Room Design Snapshot - ${new Date().toLocaleDateString()}`,
                room_type: selectedRoomId,
                furniture_layout: placedItems
            });

            if (error) throw error;
            
            showToastMessage('Design saved successfully');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "An unknown error occurred";
            console.error('Error saving to cloud:', error);
            showToastMessage(`Failed to save: ${message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-cream flex flex-col h-screen overflow-hidden">
            {/* Top Bar */}
            <header className="border-b border-stone-light bg-warm-white flex-shrink-0">
                <div className="mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="inline-flex items-center gap-2 text-sm text-charcoal/60 hover:text-charcoal transition-colors duration-300 cursor-pointer"
                    >
                        <ArrowLeft size={16} strokeWidth={1.5} />
                        Back to Home
                    </button>

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

                    <div className="flex items-center gap-4">
                        <select
                            value={selectedRoomId}
                            onChange={(e) => setSelectedRoomId(e.target.value)}
                            className="px-3 py-1.5 rounded-md text-sm border border-stone-light bg-warm-white text-charcoal outline-none focus:border-sage transition-colors cursor-pointer"
                        >
                            {ROOMS.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
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
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-4 py-2 rounded-md bg-sage text-white text-sm font-medium hover:bg-sage-dark transition-colors flex items-center gap-2 disabled:opacity-70 shadow-sm"
                            title="Save to Database"
                        >
                            <Save size={16} />
                            {isSaving ? 'Saving...' : 'Save Design'}
                        </button>
                    </div>
                </div>
            </header>

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
