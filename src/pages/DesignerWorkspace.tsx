import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft, Box as BoxIcon, Move, RotateCw, X, Check,
    AlertCircle, LayoutTemplate, Trash2, Plus, Save, FilePlus, Armchair,
    Undo2, Redo2, Camera as CameraIcon, Copy, Grid as GridIcon, Download,
    Paintbrush, Sun, ArrowRight, Share2, Menu, Settings
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Canvas, useThree } from '@react-three/fiber';
import {
    OrthographicCamera, PerspectiveCamera, OrbitControls,
    Grid
} from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { Suspense } from 'react';
import type { WallTexture } from '../components/3d/RoomGeometry';
import { RoomGeometry } from '../components/3d/RoomGeometry';
import { supabase } from '../utils/supabase';
import { getUser } from '../utils/auth';
import {
    saveDesign as saveToLocal,
    updateDesign as updateLocal,
    getDesignById as getLocalDesign,
    migrateDesignId,
    type LightPos,
    type LightingMode,
    ROOMS,
    LIGHTING_PRESETS
} from '../services/designService';
import { LightingRig } from '../components/3d/LightingRig';
import ChairModel from '../components/models/ChairModel';
import TableModel from '../components/models/TableModel';
import SofaModel from '../components/models/SofaModel';
import BedModel from '../components/models/BedModel';
import ShelfModel from '../components/models/ShelfModel';
import VaseModel from '../components/models/VaseModel';
import DeskModel from '../components/models/DeskModel';
import WardrobeModel from '../components/models/WardrobeModel';
import FloorLampModel from '../components/models/FloorLampModel';
import TVStandModel from '../components/models/TVStandModel';
import UserShareModal from '../components/UserShareModal';

// ─── Types ────────────────────────────────────────────────────────────────────

type FurnitureType = {
    id: string;
    type: string;
    name: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale?: [number, number, number];
    color?: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────


// CATALOG is internal to this file

const CATALOG = [
    { type: 'sofa', name: 'Sofa', color: '#8B7355', size: [2.1, 0.8, 1.0] as [number, number, number] },
    { type: 'table', name: 'Table', color: '#A0522D', size: [1.4, 0.75, 0.8] as [number, number, number] },
    { type: 'bed', name: 'Bed', color: '#BC8F8F', size: [2.0, 0.6, 1.8] as [number, number, number] },
    { type: 'shelf', name: 'Shelf', color: '#DEB887', size: [1.0, 1.8, 0.4] as [number, number, number] },
    { type: 'chair', name: 'Chair', color: '#CD853F', size: [0.6, 0.9, 0.6] as [number, number, number] },
    { type: 'vase', name: 'Vase', color: '#D8BFD8', size: [0.35, 0.55, 0.35] as [number, number, number] },
    { type: 'desk', name: 'Desk', color: '#8B6914', size: [1.5, 0.75, 0.75] as [number, number, number] },
    { type: 'wardrobe', name: 'Wardrobe', color: '#7B5E3A', size: [1.3, 2.1, 0.6] as [number, number, number] },
    { type: 'floorlamp', name: 'Floor Lamp', color: '#D4AF37', size: [0.35, 1.7, 0.35] as [number, number, number] },
    { type: 'tvstand', name: 'TV Stand', color: '#3A3A3A', size: [1.6, 0.55, 0.45] as [number, number, number] },
];

function getSizeForType(type: string): [number, number, number] {
    return CATALOG.find(c => c.type === type)?.size ?? [1, 1, 1];
}
function getDefaultColorForType(type: string): string {
    return CATALOG.find(c => c.type === type)?.color ?? '#999';
}

function isInsideLShape(
    x: number,
    z: number,
    width: number,
    depth: number,
    lShape?: { extWidth: number; extDepth: number; corner: 'NE' | 'NW' | 'SE' | 'SW' }
): boolean {
    const hw = width / 2;
    const hd = depth / 2;

    // Inside the main rectangle
    const inMain = x >= -hw && x <= hw && z >= -hd && z <= hd;
    if (inMain) return true;

    if (!lShape) return false;

    // Inside the extension
    const { extWidth, extDepth, corner } = lShape;
    if (corner === 'SE') {
        return x >= hw && x <= hw + extWidth && z >= hd - extDepth && z <= hd;
    } else if (corner === 'SW') {
        return x >= -hw - extWidth && x <= -hw && z >= hd - extDepth && z <= hd;
    } else if (corner === 'NE') {
        return x >= hw && x <= hw + extWidth && z >= -hd && z <= -hd + extDepth;
    } else if (corner === 'NW') {
        return x >= -hw - extWidth && x <= -hw && z >= -hd && z <= -hd + extDepth;
    }

    return false;
}

const MODEL_MAP: Record<string, React.ComponentType<{ scale: [number, number, number]; castShadow?: boolean; receiveShadow?: boolean }>> = {
    chair: ChairModel,
    table: TableModel,
    sofa: SofaModel,
    bed: BedModel,
    shelf: ShelfModel,
    vase: VaseModel,
    desk: DeskModel,
    wardrobe: WardrobeModel,
    floorlamp: FloorLampModel,
    tvstand: TVStandModel,
};

// ─── 3D Model component ───────────────────────────────────────────────────────

// ─── Rotation handle ──────────────────────────────────────────────────────────
// A visible circular arc rendered above the selected item.
// Dragging it spins the item on the Y axis.

function RotationHandle({
    position,
    radius,
    onRotateStart,
    onRotating,
    onRotateEnd,
}: {
    position: [number, number, number];
    radius: number;
    onRotateStart: () => void;
    onRotating: (angle: number) => void;
    onRotateEnd: () => void;
}) {
    const { camera, gl } = useThree();
    const isDragging = useRef(false);
    const startAngle = useRef(0);

    const getAngleFromPointer = useCallback((clientX: number, clientY: number) => {
        const rect = gl.domElement.getBoundingClientRect();
        const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
        const ndcY = ((clientY - rect.top) / rect.height) * -2 + 1;
        // Project center position to screen
        const center = new THREE.Vector3(...position).project(camera);
        return Math.atan2(ndcY - center.y, ndcX - center.x);
    }, [camera, gl, position]);

    return (
        <group position={position}>
            {/* Dashed rotation ring */}
            <mesh
                onPointerDown={(e) => {
                    e.stopPropagation();
                    isDragging.current = true;
                    startAngle.current = getAngleFromPointer(e.nativeEvent.clientX, e.nativeEvent.clientY);
                    onRotateStart();
                    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                }}
                onPointerMove={(e) => {
                    if (!isDragging.current) return;
                    const currentAngle = getAngleFromPointer(e.nativeEvent.clientX, e.nativeEvent.clientY);
                    onRotating(currentAngle - startAngle.current);
                    startAngle.current = currentAngle;
                }}
                onPointerUp={() => {
                    isDragging.current = false;
                    onRotateEnd();
                }}
            >
                <torusGeometry args={[radius, 0.04, 8, 48]} />
                <meshStandardMaterial
                    color="#f59e0b"
                    emissive="#f59e0b"
                    emissiveIntensity={0.6}
                    roughness={0.3}
                    metalness={0.5}
                    transparent
                    opacity={0.9}
                />
            </mesh>

            {/* Arrow indicator at top of ring */}
            <mesh position={[0, 0, radius]} rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.1, 0.2, 8]} />
                <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.8} />
            </mesh>

            {/* Rotation icon label */}
            <mesh position={[0, 0.15, 0]}>
                <sphereGeometry args={[0.09, 8, 8]} />
                <meshStandardMaterial color="#ffffff" emissive="#f59e0b" emissiveIntensity={0.5} />
            </mesh>
        </group>
    );
}

// ─── Selection outline box ────────────────────────────────────────────────────

function SelectionBox({ size }: { size: [number, number, number] }) {
    return (
        <lineSegments position={[0, size[1] / 2, 0]}>
            <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
            <lineBasicMaterial color="#f59e0b" linewidth={2} transparent opacity={0.7} />
        </lineSegments>
    );
}

// ─── 3D Model component ───────────────────────────────────────────────────────

function Model({
    item, isSelected, onSelect, transformMode, updateItem, setIsDragging, snapToGrid, roomWidth, roomDepth, lShape,
}: {
    item: FurnitureType;
    isSelected: boolean;
    onSelect: () => void;
    transformMode: 'translate' | 'rotate';
    updateItem: (id: string, updates: Partial<FurnitureType>) => void;
    setIsDragging: (v: boolean) => void;
    snapToGrid: boolean;
    roomWidth: number;
    roomDepth: number;
    lShape?: { extWidth: number; extDepth: number; corner: 'NE' | 'NW' | 'SE' | 'SW' };
}) {
    const { camera, gl } = useThree();
    const groupRef = useRef<THREE.Group>(null!);
    const isDragging = useRef(false);
    const dragOffset = useRef(new THREE.Vector3());
    const currentRotation = useRef(item.rotation[1]);

    const size = getSizeForType(item.type);
    const color = item.color ?? getDefaultColorForType(item.type);
    const GlbModel = MODEL_MAP[item.type];
    const scale = item.scale ?? [1, 1, 1];
    const GVS = 0.85;
    const finalGlbScale: [number, number, number] = [
        size[0] * scale[0] * GVS,
        size[1] * scale[1] * GVS,
        size[2] * scale[2] * GVS,
    ];
    const bbox: [number, number, number] = [
        size[0] * scale[0],
        size[1] * scale[1],
        size[2] * scale[2],
    ];

    // Snap helper
    const snap = (v: number) => snapToGrid ? Math.round(v / 0.5) * 0.5 : v;

    // Raycast to floor plane (Y = 0)
    const floorPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
    const intersection = useRef(new THREE.Vector3());
    const raycaster = useRef(new THREE.Raycaster());

    const getFloorPoint = useCallback((clientX: number, clientY: number) => {
        const rect = gl.domElement.getBoundingClientRect();
        const ndc = new THREE.Vector2(
            ((clientX - rect.left) / rect.width) * 2 - 1,
            ((clientY - rect.top) / rect.height) * -2 + 1,
        );
        raycaster.current.setFromCamera(ndc, camera);
        raycaster.current.ray.intersectPlane(floorPlane.current, intersection.current);
        return intersection.current.clone();
    }, [camera, gl]);

    // Radius for rotation ring — just outside the item's footprint
    const ringRadius = Math.max(bbox[0], bbox[2]) * 0.5 + 0.35;
    const ringHeight = bbox[1] + 0.1;

    return (
        <group>
            <group
                ref={groupRef}
                position={item.position}
                rotation={item.rotation}
            >
                {/* ── Mesh ── */}
                {GlbModel ? (
                    <Suspense fallback={
                        <mesh castShadow receiveShadow position={[0, bbox[1] / 2, 0]}
                            onPointerDown={transformMode === 'translate' && isSelected ? (e) => {
                                e.stopPropagation();
                                isDragging.current = true;
                                setIsDragging(true);
                                const pt = getFloorPoint(e.nativeEvent.clientX, e.nativeEvent.clientY);
                                dragOffset.current.set(item.position[0] - pt.x, 0, item.position[2] - pt.z);
                                (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                            } : undefined}
                            onPointerMove={transformMode === 'translate' && isSelected ? (e) => {
                                if (!isDragging.current) return;
                                const pt = getFloorPoint(e.nativeEvent.clientX, e.nativeEvent.clientY);
                                const nx = snap(pt.x + dragOffset.current.x);
                                const nz = snap(pt.z + dragOffset.current.z);
                                groupRef.current.position.set(nx, 0, nz);
                            } : undefined}
                            onPointerUp={transformMode === 'translate' && isSelected ? () => {
                                if (!isDragging.current) return;
                                isDragging.current = false;
                                setIsDragging(false);
                                const p = groupRef.current.position;
                                updateItem(item.id, { position: [p.x, 0, p.z] });
                            } : undefined}
                            onClick={(e) => { e.stopPropagation(); onSelect(); }}
                        >
                            <boxGeometry args={bbox} />
                            <meshStandardMaterial color={color} roughness={0.7} metalness={0.05} />
                        </mesh>
                    }>
                        <group
                            onPointerDown={transformMode === 'translate' && isSelected ? (e) => {
                                e.stopPropagation();
                                isDragging.current = true;
                                setIsDragging(true);
                                const pt = getFloorPoint(e.nativeEvent.clientX, e.nativeEvent.clientY);
                                dragOffset.current.set(item.position[0] - pt.x, 0, item.position[2] - pt.z);
                                (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                            } : undefined}
                            onPointerMove={transformMode === 'translate' && isSelected ? (e) => {
                                if (!isDragging.current) return;
                                const pt = getFloorPoint(e.nativeEvent.clientX, e.nativeEvent.clientY);
                                const nx = snap(pt.x + dragOffset.current.x);
                                const nz = snap(pt.z + dragOffset.current.z);
                                groupRef.current.position.set(nx, 0, nz);
                            } : undefined}
                            onPointerUp={transformMode === 'translate' && isSelected ? () => {
                                if (!isDragging.current) return;
                                isDragging.current = false;
                                setIsDragging(false);
                                const p = groupRef.current.position;
                                updateItem(item.id, { position: [p.x, 0, p.z] });
                            } : undefined}
                            onClick={(e) => { e.stopPropagation(); onSelect(); }}
                        >
                            <GlbModel scale={finalGlbScale} castShadow receiveShadow />
                        </group>
                    </Suspense>
                ) : (
                    <mesh
                        castShadow receiveShadow
                        position={[0, bbox[1] / 2, 0]}
                        onPointerDown={transformMode === 'translate' && isSelected ? (e) => {
                            e.stopPropagation();
                            isDragging.current = true;
                            setIsDragging(true);
                            const pt = getFloorPoint(e.nativeEvent.clientX, e.nativeEvent.clientY);
                            dragOffset.current.set(item.position[0] - pt.x, 0, item.position[2] - pt.z);
                            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                        } : undefined}
                        onPointerMove={transformMode === 'translate' && isSelected ? (e) => {
                            if (!isDragging.current) return;
                            const pt = getFloorPoint(e.nativeEvent.clientX, e.nativeEvent.clientY);
                            const nx = snap(pt.x + dragOffset.current.x);
                            const nz = snap(pt.z + dragOffset.current.z);

                            // L-shape bounds check
                            if (isInsideLShape(nx, nz, roomWidth, roomDepth, lShape)) {
                                groupRef.current.position.set(nx, 0, nz);
                            }
                        } : undefined}
                        onPointerUp={transformMode === 'translate' && isSelected ? () => {
                            if (!isDragging.current) return;
                            isDragging.current = false;
                            setIsDragging(false);
                            const p = groupRef.current.position;
                            updateItem(item.id, { position: [p.x, 0, p.z] });
                        } : undefined}
                        onClick={(e) => { e.stopPropagation(); onSelect(); }}
                    >
                        <boxGeometry args={bbox} />
                        <meshStandardMaterial
                            color={color}
                            roughness={0.65}
                            metalness={0.05}
                            emissive={isSelected ? '#f59e0b' : '#000000'}
                            emissiveIntensity={isSelected ? 0.08 : 0}
                        />
                    </mesh>
                )}

                {/* ── Selection outline ── */}
                {isSelected && <SelectionBox size={bbox} />}
            </group>

            {/* ── Rotation handle (outside group so it stays upright) ── */}
            {isSelected && transformMode === 'rotate' && (
                <RotationHandle
                    position={[item.position[0], ringHeight, item.position[2]]}
                    radius={ringRadius}
                    onRotateStart={() => {
                        currentRotation.current = item.rotation[1];
                        setIsDragging(true);
                    }}
                    onRotating={(delta) => {
                        currentRotation.current -= delta; // subtract = natural drag direction
                        groupRef.current.rotation.y = currentRotation.current;
                    }}
                    onRotateEnd={() => {
                        setIsDragging(false);
                        updateItem(item.id, {
                            rotation: [0, currentRotation.current, 0],
                        });
                    }}
                />
            )}

            {/* ── Click outside to deselect ── */}
            {!isSelected && (
                <group onClick={(e) => { e.stopPropagation(); onSelect(); }}>
                    <mesh position={[item.position[0], bbox[1] / 2, item.position[2]]} visible={false}>
                        <boxGeometry args={[bbox[0] + 0.1, bbox[1] + 0.1, bbox[2] + 0.1]} />
                        <meshBasicMaterial transparent opacity={0} />
                    </mesh>
                </group>
            )}
        </group>
    );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
    open, title, message, onConfirm, onCancel,
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DesignerWorkspace() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const designIdFromUrl = searchParams.get('designId');
    const roomIdParam = searchParams.get('roomId');
    const widthParam = searchParams.get('width');
    const depthParam = searchParams.get('depth');
    const wallColorParam = searchParams.get('wallColor');
    const floorColorParam = searchParams.get('floorColor');
    const wallTextureParam = searchParams.get('wallTexture') as WallTexture | null;
    const lightingParam = searchParams.get('lightingMode') as LightingMode | null;
    const nameParam = searchParams.get('name');
    const extWidthParam = searchParams.get('extWidth');
    const extDepthParam = searchParams.get('extDepth');
    const cornerParam = searchParams.get('corner');

    // ── View & tool state ────────────────────────────────────────────────────
    const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');
    const [transformMode, setTransformMode] = useState<'translate' | 'rotate'>('translate');
    const [snapToGrid, setSnapToGrid] = useState(false);
    const [placedItems, setPlacedItems] = useState<FurnitureType[]>([]);
    const [history, setHistory] = useState<FurnitureType[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // ── Room / environment state ─────────────────────────────────────────────
    const [selectedRoomId, setSelectedRoomId] = useState(roomIdParam || ROOMS[0].id);
    const [customWallColor, setCustomWallColor] = useState(wallColorParam ? decodeURIComponent(wallColorParam) : '');
    const [customFloorColor, setCustomFloorColor] = useState(floorColorParam ? decodeURIComponent(floorColorParam) : '');
    const [wallTexture, setWallTexture] = useState<WallTexture>(wallTextureParam || 'plain');
    const [lightingMode, setLightingMode] = useState<LightingMode>(lightingParam || 'natural');
    const [designName, setDesignName] = useState(nameParam ? decodeURIComponent(nameParam) : '');
    const [customWidth, setCustomWidth] = useState(widthParam ? parseFloat(widthParam) : 0);
    const [customDepth, setCustomDepth] = useState(depthParam ? parseFloat(depthParam) : 0);
    const [customExtWidth, setCustomExtWidth] = useState(extWidthParam ? parseFloat(extWidthParam) : 0);
    const [customExtDepth, setCustomExtDepth] = useState(extDepthParam ? parseFloat(extDepthParam) : 0);
    const [customCorner, setCustomCorner] = useState<'NE' | 'NW' | 'SE' | 'SW'>((cornerParam as 'NE' | 'NW' | 'SE' | 'SW') || 'SE');

    // ── Real light source position ───────────────────────────────────────────
    const [lightPos, setLightPos] = useState<LightPos>({ x: 5, y: 8, z: 5 });

    // ── Save / UI state ──────────────────────────────────────────────────────
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [currentDesignId, setCurrentDesignId] = useState<string | null>(null);
    const [isNewDesignModalOpen, setIsNewDesignModalOpen] = useState(false);
    const [newDesignName, setNewDesignName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [sidebarMode, setSidebarMode] = useState<'room' | 'furniture'>(designIdFromUrl || roomIdParam ? 'furniture' : 'room');
    const [isSaveNameModalOpen, setIsSaveNameModalOpen] = useState(false);
    const [saveNameInput, setSaveNameInput] = useState('');
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [shareImageData, setShareImageData] = useState('');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // ── Refs ─────────────────────────────────────────────────────────────────
    const glRef = useRef<THREE.WebGLRenderer | null>(null);
    const orbitControlsRef = useRef<OrbitControlsImpl>(null);

    // ── Derived ──────────────────────────────────────────────────────────────
    const activeRoom = ROOMS.find(r => r.id === selectedRoomId) || ROOMS[0];
    const effectiveWidth = customWidth || activeRoom.width;
    const effectiveDepth = customDepth || activeRoom.depth;
    const effectiveWallColor = customWallColor || activeRoom.wallColor;
    const effectiveFloorColor = customFloorColor || activeRoom.floorColor;
    const effectiveLShape = (customExtWidth > 0 && customExtDepth > 0)
        ? { extWidth: customExtWidth, extDepth: customExtDepth, corner: customCorner }
        : activeRoom.lShape;
    const selectedItem = placedItems.find(i => i.id === selectedId);

    // ── Helpers ──────────────────────────────────────────────────────────────
    const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Reset colour overrides when room type changes
    useEffect(() => {
        setCustomWallColor('');
        setCustomFloorColor('');
    }, [selectedRoomId]);

    // ── Load design ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!designIdFromUrl) return;

        const local = getLocalDesign(designIdFromUrl);
        if (local) {
            setCurrentDesignId(local.id);
            setDesignName(local.name || 'Untitled Room');
            setSelectedRoomId(local.roomType || ROOMS[0].id);
            setPlacedItems((local.furniture as FurnitureType[]) || []);
            if (local.wallColor) setCustomWallColor(local.wallColor);
            if (local.floorColor) setCustomFloorColor(local.floorColor);
            if (local.wallTexture) setWallTexture(local.wallTexture as WallTexture);
            if (local.lightingMode) setLightingMode(local.lightingMode as LightingMode);
            if (local.customWidth) setCustomWidth(local.customWidth);
            if (local.customDepth) setCustomDepth(local.customDepth);
            if (local.lShape) {
                setCustomExtWidth(local.lShape.extWidth);
                setCustomExtDepth(local.lShape.extDepth);
                setCustomCorner(local.lShape.corner);
            }
            if (local.lightPos) setLightPos(local.lightPos);
            return;
        }

        (async () => {
            const user = getUser();
            if (!user?.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(designIdFromUrl!)) return;
            const { data, error } = await supabase
                .from('saved_designs')
                .select('*')
                .eq('id', designIdFromUrl);
            if (data?.[0] && !error) {
                const d = data[0];
                setCurrentDesignId(d.id);
                setDesignName(d.name || 'Untitled Room');
                setSelectedRoomId(d.room_type);
                setPlacedItems(d.furniture_layout || []);
                if (d.wall_color) setCustomWallColor(d.wall_color);
                if (d.floor_color) setCustomFloorColor(d.floor_color);
                if (d.wall_texture) setWallTexture(d.wall_texture as WallTexture);
                if (d.lighting_mode) setLightingMode(d.lighting_mode as LightingMode);
                if (d.custom_width) setCustomWidth(d.custom_width);
                if (d.custom_depth) setCustomDepth(d.custom_depth);
                if (d.l_shape_ext_width) setCustomExtWidth(d.l_shape_ext_width);
                if (d.l_shape_ext_depth) setCustomExtDepth(d.l_shape_ext_depth);
                if (d.l_shape_corner) setCustomCorner(d.l_shape_corner as 'NE' | 'NW' | 'SE' | 'SW');
                if (d.light_pos_x !== undefined) setLightPos({ x: d.light_pos_x, y: d.light_pos_y, z: d.light_pos_z });
            }
        })();
    }, [designIdFromUrl]);

    // ── History ──────────────────────────────────────────────────────────────
    const pushToHistory = (newState: FurnitureType[]) => {
        const next = history.slice(0, historyIndex + 1);
        next.push(newState);
        setHistory(next);
        setHistoryIndex(next.length - 1);
    };
    const handleUndo = () => {
        if (historyIndex > 0) { setHistoryIndex(historyIndex - 1); setPlacedItems(history[historyIndex - 1]); setSelectedId(null); }
    };
    const handleRedo = () => {
        if (historyIndex < history.length - 1) { setHistoryIndex(historyIndex + 1); setPlacedItems(history[historyIndex + 1]); setSelectedId(null); }
    };
    useEffect(() => {
        if (history.length === 0 && placedItems.length === 0) pushToHistory([]);
    }, []); // eslint-disable-line

    // ── Item ops ─────────────────────────────────────────────────────────────
    const addItem = (catalogItem: typeof CATALOG[0]) => {
        const newItem: FurnitureType = {
            id: Math.random().toString(36).substr(2, 9),
            type: catalogItem.type,
            name: catalogItem.name,
            position: [placedItems.length * 0.5, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            color: catalogItem.color,
        };
        const next = [...placedItems, newItem];
        setPlacedItems(next);
        pushToHistory(next);
        setSelectedId(newItem.id);
    };

    const updateItem = (id: string, updates: Partial<FurnitureType>) => {
        const next = placedItems.map(item => item.id === id ? { ...item, ...updates } : item);
        setPlacedItems(next);
        pushToHistory(next);
    };

    const deleteSelected = () => { if (selectedId) setIsDeleteConfirmOpen(true); };
    const confirmDelete = () => {
        if (!selectedId) return;
        const next = placedItems.filter(i => i.id !== selectedId);
        setPlacedItems(next);
        pushToHistory(next);
        setSelectedId(null);
        setIsDeleteConfirmOpen(false);
        showToastMessage('Item removed from design');
    };

    const duplicateItem = () => {
        if (!selectedId || !selectedItem) return;
        const clone: FurnitureType = {
            ...selectedItem,
            id: Math.random().toString(36).substr(2, 9),
            position: [selectedItem.position[0] + 0.5, selectedItem.position[1], selectedItem.position[2] + 0.5],
        };
        const next = [...placedItems, clone];
        setPlacedItems(next);
        pushToHistory(next);
        setSelectedId(clone.id);
    };

    // ── Export (fixed: just call toDataURL on preserved canvas) ─────────────
    const handleExportImage = () => {
        if (glRef.current) {
            const url = glRef.current.domElement.toDataURL('image/png');
            const a = document.createElement('a');
            a.download = `${designName || 'room-design'}.png`;
            a.href = url;
            a.click();
            showToastMessage('Design exported as image!');
        } else {
            showToastMessage('Export failed — try again after the scene loads.', 'error');
        }
    };

    const handleResetCamera = () => { orbitControlsRef.current?.reset(); };

    // ── Sharing ──────────────────────────────────────────────────────────────
    const handleShareOpen = () => {
        if (!currentDesignId) {
            showToastMessage('Please save your design first before sharing.', 'error');
            return;
        }
        if (glRef.current) {
            const dataUrl = glRef.current.domElement.toDataURL('image/png');
            setShareImageData(dataUrl);
            setIsShareModalOpen(true);
        } else {
            showToastMessage('Could not capture design image. Please try again.', 'error');
        }
    };

    // ── New design ────────────────────────────────────────────────────────────
    const handleCreateNew = () => { setNewDesignName(''); setIsNewDesignModalOpen(true); };
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
        setLightPos({ x: 5, y: 8, z: 5 });
        setIsNewDesignModalOpen(false);
        setSearchParams({});
        showToastMessage(`New design "${name}" created`);
    };

    // ── Save ──────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        const user = getUser();
        if (!user?.id) { showToastMessage('Please sign in to save.', 'error'); return; }
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

    const executeSave = async (name: string) => {
        const safeName = name || 'Untitled Room';
        setIsSaving(true);
        try {
            const designData = {
                name: safeName,
                roomType: selectedRoomId,
                furniture: placedItems,
                wallColor: effectiveWallColor,
                floorColor: effectiveFloorColor,
                wallTexture,
                lightingMode,
                customDepth: effectiveDepth,
                lShape: effectiveLShape,
                lightPos,
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
                const payload = {
                    user_id: user.id,
                    name: safeName,
                    room_type: selectedRoomId,
                    furniture_layout: placedItems,
                    wall_color: effectiveWallColor,
                    floor_color: effectiveFloorColor,
                    wall_texture: wallTexture,
                    lighting_mode: lightingMode,
                    custom_width: effectiveWidth,
                    custom_depth: effectiveDepth,
                    l_shape_ext_width: effectiveLShape?.extWidth,
                    l_shape_ext_depth: effectiveLShape?.extDepth,
                    l_shape_corner: effectiveLShape?.corner,
                    light_pos_x: lightPos.x,
                    light_pos_y: lightPos.y,
                    light_pos_z: lightPos.z,
                };
                if (currentDesignId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentDesignId)) {
                    await supabase.from('saved_designs').update(payload).eq('id', currentDesignId);
                } else {
                    const { data, error } = await supabase.from('saved_designs').insert(payload).select('id').single();
                    if (!error && data?.id) {
                        const newId = data.id;
                        // Migrate local storage
                        if (currentDesignId) {
                            migrateDesignId(currentDesignId, newId);
                        }
                        setCurrentDesignId(newId);
                        setSearchParams({ designId: newId });
                    }
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

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-cream flex flex-col h-screen overflow-hidden">

            {/* ── Delete confirm ── */}
            <ConfirmDialog
                open={isDeleteConfirmOpen}
                title="Remove Item"
                message={`Remove "${selectedItem?.name}" from the design? This cannot be undone.`}
                onConfirm={confirmDelete}
                onCancel={() => setIsDeleteConfirmOpen(false)}
            />

            {/* ── Header ── */}
            <motion.header
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="border-b border-stone-light bg-warm-white/90 backdrop-blur-lg flex-shrink-0 z-20"
            >
                <div className="mx-auto px-6 lg:px-8 py-3.5 flex items-center justify-between">

                    {/* Left */}
                    <div className="flex items-center gap-5">
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="group inline-flex items-center gap-2 text-[12px] tracking-[0.12em] uppercase text-charcoal/50 hover:text-charcoal transition-colors duration-300"
                            >
                                <ArrowLeft size={14} strokeWidth={1.5} className="group-hover:-translate-x-0.5 transition-transform duration-300" />
                                <span className="hidden sm:inline">Back</span>
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
                                    className="font-serif text-lg sm:text-xl text-charcoal hover:text-sage-dark transition-colors duration-300 cursor-text flex items-center gap-2.5 group"
                                    title="Click to rename"
                                >
                                    {designName || 'Untitled Room'}
                                    <span className="hidden sm:inline text-[9px] text-charcoal/20 group-hover:text-sage font-sans uppercase tracking-[0.15em] transition-colors duration-300">rename</span>
                                </button>
                            )}
                            <p className="text-[10px] text-charcoal/35 uppercase tracking-[0.2em] mt-0.5 font-medium flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                                {currentDesignId ? 'Saved' : 'Unsaved draft'}
                            </p>
                        </div>
                    </div>

                    {/* Center: view toggle - hidden on very small screens, or moved */}
                    <div className="hidden md:flex items-center bg-stone-light/30 border border-stone-light/60 p-1 rounded-lg">
                        {(['2d', '3d'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-5 py-2 rounded-md text-[11px] tracking-[0.1em] uppercase font-medium flex items-center gap-2 transition-all duration-300 ${viewMode === mode
                                        ? 'bg-white shadow-sm text-charcoal border border-stone-light/50'
                                        : 'text-charcoal/45 hover:text-charcoal border border-transparent'
                                    }`}
                            >
                                {mode === '2d' ? <LayoutTemplate size={14} strokeWidth={1.5} /> : <BoxIcon size={14} strokeWidth={1.5} />}
                                {mode === '2d' ? '2D Plan' : '3D View'}
                            </button>
                        ))}
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="hidden sm:flex items-center gap-1.5 mr-2">
                            <button onClick={handleUndo} disabled={historyIndex <= 0}
                                className="p-2 rounded-lg text-charcoal/50 hover:text-charcoal hover:bg-stone-light/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
                                title="Undo"><Undo2 size={16} strokeWidth={1.5} /></button>
                            <button onClick={handleRedo} disabled={historyIndex >= history.length - 1}
                                className="p-2 rounded-lg text-charcoal/50 hover:text-charcoal hover:bg-stone-light/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
                                title="Redo"><Redo2 size={16} strokeWidth={1.5} /></button>
                        </div>
                        <div className="hidden sm:block w-px h-6 bg-stone-light mr-1" />
                        
                        {/* Desktop Only Actions */}
                        <div className="hidden lg:flex items-center gap-2 mr-2">
                            <button onClick={handleExportImage} className="p-2 rounded-lg text-charcoal/50 hover:text-charcoal hover:bg-stone-light/30 transition-all duration-300" title="Export as Image">
                                <Download size={16} strokeWidth={1.5} />
                            </button>
                            <button onClick={handleShareOpen} className="p-2 rounded-lg text-charcoal/50 hover:text-charcoal hover:bg-stone-light/30 transition-all duration-300" title="Share Design">
                                <Share2 size={16} strokeWidth={1.5} />
                            </button>
                            <button onClick={handleCreateNew} className="p-2 rounded-lg text-charcoal/50 hover:text-charcoal hover:bg-stone-light/30 transition-all duration-300" title="New Design">
                                <FilePlus size={16} strokeWidth={1.5} />
                            </button>
                        </div>
                        <div className="hidden lg:block w-px h-6 bg-stone-light mr-1" />

                        <button onClick={handleResetCamera} title="Reset Camera"
                            className="p-2 rounded-lg text-charcoal/50 hover:text-charcoal hover:bg-stone-light/30 transition-all duration-300 sm:mr-2">
                            <CameraIcon size={16} strokeWidth={1.5} />
                        </button>
                        <button onClick={handleSave} disabled={isSaving}
                            className="group inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg text-[11px] tracking-[0.12em] uppercase font-medium
                                       bg-charcoal text-white hover:bg-charcoal-light disabled:opacity-40 disabled:cursor-not-allowed
                                       transition-all duration-300 shadow-sm hover:shadow-md">
                            <Save size={14} strokeWidth={1.5} className={isSaving ? 'animate-pulse' : 'group-hover:scale-110 transition-transform duration-300'} />
                            <span className="hidden sm:inline">{isSaving ? 'Saving…' : 'Save Design'}</span>
                            <span className="sm:hidden">{isSaving ? '' : 'Save'}</span>
                        </button>
                        
                        {/* Mobile Sidebar Toggle */}
                        <button
                            onClick={() => setIsMobileSidebarOpen(true)}
                            className="lg:hidden p-2.5 rounded-lg bg-stone-light/30 text-charcoal hover:bg-stone-light/50 transition-colors"
                        >
                            <Menu size={20} />
                        </button>
                    </div>
                </div>
            </motion.header>

            {/* ── New design modal ── */}
            <AnimatePresence>
                {isNewDesignModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="bg-warm-white w-full max-w-md rounded-2xl p-10 shadow-2xl relative border border-stone-light/50">
                            <button onClick={() => setIsNewDesignModalOpen(false)} className="absolute top-6 right-6 text-charcoal/30 hover:text-charcoal transition-colors duration-300 p-1 rounded-md hover:bg-stone-light/40"><X size={18} strokeWidth={1.5} /></button>
                            <div className="mb-8">
                                <p className="text-[10px] tracking-[0.3em] uppercase text-stone-dark mb-3">Start Fresh</p>
                                <h3 className="text-3xl font-serif text-charcoal">New <span className="italic">Design</span></h3>
                            </div>
                            <form onSubmit={(e) => { e.preventDefault(); confirmCreateNew(); }}>
                                <label className="block text-[10px] tracking-[0.2em] uppercase text-charcoal/50 mb-2.5 font-medium">Design Name</label>
                                <input type="text" autoFocus value={newDesignName} onChange={(e) => setNewDesignName(e.target.value)}
                                    placeholder="e.g. My Living Room"
                                    className="w-full border border-stone-light bg-white rounded-lg px-4 py-3.5 text-sm text-charcoal placeholder:text-charcoal/25
                                               focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/10 transition-all duration-300 mb-8" />
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsNewDesignModalOpen(false)} className="px-6 py-3 rounded-lg text-[11px] tracking-[0.12em] uppercase font-medium text-charcoal/50 hover:text-charcoal hover:bg-stone-light/30 transition-all duration-300">Cancel</button>
                                    <button type="submit" className="group bg-charcoal text-white px-8 py-3 rounded-lg text-[11px] tracking-[0.12em] uppercase font-medium hover:bg-charcoal-light transition-all duration-300 shadow-sm hover:shadow-md inline-flex items-center gap-2">
                                        <Plus size={14} strokeWidth={2} />Create Design
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Save name modal ── */}
            <AnimatePresence>
                {isSaveNameModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="bg-warm-white w-full max-w-md rounded-2xl p-10 shadow-2xl relative border border-stone-light/50">
                            <button onClick={() => setIsSaveNameModalOpen(false)} className="absolute top-6 right-6 text-charcoal/30 hover:text-charcoal transition-colors duration-300 p-1 rounded-md hover:bg-stone-light/40"><X size={18} strokeWidth={1.5} /></button>
                            <div className="mb-8">
                                <p className="text-[10px] tracking-[0.3em] uppercase text-stone-dark mb-3">Save Your Work</p>
                                <h3 className="text-3xl font-serif text-charcoal">Name Your <span className="italic">Design</span></h3>
                            </div>
                            <form onSubmit={(e) => { e.preventDefault(); confirmSaveWithName(); }}>
                                <label className="block text-[10px] tracking-[0.2em] uppercase text-charcoal/50 mb-2.5 font-medium">Design Name</label>
                                <input type="text" autoFocus value={saveNameInput} onChange={(e) => setSaveNameInput(e.target.value)}
                                    placeholder="e.g. My Living Room"
                                    className="w-full border border-stone-light bg-white rounded-lg px-4 py-3.5 text-sm text-charcoal placeholder:text-charcoal/25
                                               focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/10 transition-all duration-300 mb-8" />
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsSaveNameModalOpen(false)} className="px-6 py-3 rounded-lg text-[11px] tracking-[0.12em] uppercase font-medium text-charcoal/50 hover:text-charcoal hover:bg-stone-light/30 transition-all duration-300">Cancel</button>
                                    <button type="submit" className="group bg-charcoal text-white px-8 py-3 rounded-lg text-[11px] tracking-[0.12em] uppercase font-medium hover:bg-charcoal-light transition-all duration-300 shadow-sm hover:shadow-md inline-flex items-center gap-2">
                                        <Save size={14} strokeWidth={1.5} />Save Design
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Main content ── */}
            <main className="flex-1 flex overflow-hidden">

                {/* ── Mobile Sidebar Backdrop ── */}
                <AnimatePresence>
                    {isMobileSidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileSidebarOpen(false)}
                            className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-[90] lg:hidden"
                        />
                    )}
                </AnimatePresence>

                {/* ── Sidebar ── */}
                <motion.aside
                    initial={false}
                    animate={{ 
                        x: isMobile 
                            ? (isMobileSidebarOpen ? 0 : -320) 
                            : 0 
                    }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className={`fixed lg:static inset-y-0 left-0 w-80 flex-shrink-0 border-r border-stone-light bg-warm-white flex flex-col h-full z-[100] lg:z-10 shadow-2xl lg:shadow-sm overflow-hidden`}
                >
                    {/* ─ Mobile Close and Actions ─ */}
                    <div className="lg:hidden flex items-center justify-between p-4 border-b border-stone-light bg-stone-light/10">
                        <div className="flex gap-2">
                            <button onClick={handleExportImage} className="p-2 rounded-lg bg-white border border-stone-light text-charcoal/60 hover:text-charcoal transition-colors">
                                <Download size={16} />
                            </button>
                            <button onClick={handleShareOpen} className="p-2 rounded-lg bg-white border border-stone-light text-charcoal/60 hover:text-charcoal transition-colors">
                                <Share2 size={16} />
                            </button>
                            <button onClick={handleCreateNew} className="p-2 rounded-lg bg-white border border-stone-light text-charcoal/60 hover:text-charcoal transition-colors">
                                <FilePlus size={16} />
                            </button>
                        </div>
                        <button
                            onClick={() => setIsMobileSidebarOpen(false)}
                            className="p-2 rounded-lg text-charcoal/40 hover:text-charcoal hover:bg-stone-light/30 transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* ─ Sidebar Tabs ─ */}
                    <div className="flex border-b border-stone-light/70 bg-stone-light/10">
                        {(['room', 'furniture'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setSidebarMode(mode)}
                                className={`flex-1 py-4 text-[10px] tracking-[0.2em] uppercase font-bold transition-all duration-300 relative
                                    ${sidebarMode === mode ? 'text-charcoal' : 'text-charcoal/30 hover:text-charcoal/50'}`}
                            >
                                {mode}
                                {sidebarMode === mode && (
                                    <motion.div
                                        layoutId="sidebarTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-sage"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Scrollable container */}
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-light scrollbar-track-transparent">
                        <AnimatePresence mode="wait">
                            {sidebarMode === 'room' ? (
                                <motion.div
                                    key="room"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex flex-col pb-8"
                                >
                                    {/* ─ Room type ─ */}
                                    <div className="p-5 border-b border-stone-light/70">
                                        <p className="text-[10px] tracking-[0.25em] uppercase text-charcoal/40 mb-3 font-medium">Room Type</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {ROOMS.map((room) => (
                                                <button key={room.id} onClick={() => setSelectedRoomId(room.id)}
                                                    className={`px-3 py-2 rounded-lg text-[11px] tracking-wide font-medium transition-all duration-300
                                                        ${selectedRoomId === room.id
                                                            ? 'bg-sage/15 text-sage-dark border border-sage/30'
                                                            : 'text-charcoal/50 border border-transparent hover:bg-stone-light/40 hover:text-charcoal/70'}`}>
                                                    {room.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* ─ Colours ─ */}
                                    <div className="p-5 border-b border-stone-light/70 flex flex-col gap-3">
                                        <p className="text-[10px] tracking-[0.25em] uppercase text-charcoal/40 font-medium">Colours</p>

                                        {/* Wall */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-charcoal/55">
                                                <Paintbrush size={13} strokeWidth={1.5} />
                                                <span className="text-[11px] tracking-wide font-medium">Wall</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-charcoal/35 font-mono">{effectiveWallColor}</span>
                                                <input type="color" value={effectiveWallColor} onChange={(e) => setCustomWallColor(e.target.value)}
                                                    className="w-8 h-8 rounded-md border border-stone-light cursor-pointer bg-transparent p-0.5" title="Wall colour" />
                                            </div>
                                        </div>

                                        {/* Floor */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-charcoal/55">
                                                <GridIcon size={13} strokeWidth={1.5} />
                                                <span className="text-[11px] tracking-wide font-medium">Floor</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-charcoal/35 font-mono">{effectiveFloorColor}</span>
                                                <input type="color" value={effectiveFloorColor} onChange={(e) => setCustomFloorColor(e.target.value)}
                                                    className="w-8 h-8 rounded-md border border-stone-light cursor-pointer bg-transparent p-0.5" title="Floor colour" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* ─ Wall texture ─ */}
                                    <div className="p-5 border-b border-stone-light/70">
                                        <p className="text-[10px] tracking-[0.25em] uppercase text-charcoal/40 mb-3 font-medium">Wall Texture</p>
                                        <div className="grid grid-cols-5 gap-2">
                                            {(['plain', 'subtle-linen', 'brick', 'wood-panel', 'concrete'] as WallTexture[]).map((tex) => (
                                                <button key={tex} onClick={() => setWallTexture(tex)}
                                                    className={`aspect-square rounded-md border-2 transition-all duration-200 flex items-center justify-center overflow-hidden
                                                        ${wallTexture === tex ? 'border-sage ring-2 ring-sage/10' : 'border-stone-light hover:border-charcoal/20'}`}
                                                    title={tex.replace('-', ' ')}>
                                                    <div className="w-full h-full" style={{
                                                        backgroundColor: effectiveWallColor,
                                                        backgroundImage:
                                                            tex === 'subtle-linen'
                                                                ? 'repeating-linear-gradient(rgba(0,0,0,0.1) 0 1px,transparent 0 4px),repeating-linear-gradient(90deg,rgba(0,0,0,0.1) 0 1px,transparent 0 4px)'
                                                                : tex === 'brick'
                                                                    ? 'repeating-linear-gradient(rgba(0,0,0,0.14) 0 2px,transparent 0 22px),repeating-linear-gradient(90deg,rgba(0,0,0,0.1) 0 2px,transparent 0 58px)'
                                                                    : tex === 'wood-panel'
                                                                        ? 'repeating-linear-gradient(90deg,rgba(0,0,0,0.13) 0 2px,transparent 0 30px)'
                                                                        : tex === 'concrete'
                                                                            ? 'radial-gradient(rgba(0,0,0,0.12) 1px,transparent 0)'
                                                                            : 'none',
                                                        backgroundSize: tex === 'concrete' ? '5px 5px' : 'auto',
                                                    }} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* ─ Lighting mode ─ */}
                                    <div className="p-5 border-b border-stone-light/70">
                                        <p className="text-[10px] tracking-[0.25em] uppercase text-charcoal/40 mb-3 font-medium">Lighting</p>
                                        <div className="flex flex-wrap gap-2">
                                            {(Object.keys(LIGHTING_PRESETS) as LightingMode[]).map((mode) => (
                                                <button key={mode} onClick={() => setLightingMode(mode)}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] tracking-wide capitalize font-medium transition-all duration-200 border
                                                        ${lightingMode === mode
                                                            ? 'bg-charcoal text-white border-charcoal'
                                                            : 'text-charcoal/50 border-stone-light hover:border-charcoal/30 hover:text-charcoal/70'}`}>
                                                    {mode}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* ─ Light source position ─ */}
                                    <div className="p-5 border-b border-stone-light/70">
                                        <p className="text-[10px] tracking-[0.25em] uppercase text-charcoal/40 mb-3 font-medium">Light Source</p>

                                        {/* Top-view XZ picker */}
                                        <div
                                            className="relative w-full bg-stone-light/20 rounded-xl border border-stone-light mb-2 overflow-hidden cursor-crosshair select-none"
                                            style={{ height: 88 }}
                                            onClick={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1; // −1…1
                                                const nz = ((e.clientY - rect.top) / rect.height) * 2 - 1;
                                                setLightPos((p: LightPos) => ({ ...p, x: nx * 8, z: nz * 8 }));
                                            }}
                                        >
                                            <div className="absolute inset-4 border border-stone-light/50 rounded-sm opacity-60" />
                                            <span className="absolute top-1.5 left-2.5 text-[8px] text-charcoal/30 tracking-widest uppercase">Top View</span>
                                            <div
                                                className="absolute w-4 h-4 rounded-full border-2 border-amber-300 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                                style={{
                                                    left: `${((lightPos.x / 8) + 1) / 2 * 100}%`,
                                                    top: `${((lightPos.z / 8) + 1) / 2 * 100}%`,
                                                    background: 'radial-gradient(circle at 40% 35%, #fde68a, #f59e0b)',
                                                    boxShadow: '0 0 10px 3px rgba(251,191,36,0.5)',
                                                }}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2 text-charcoal/55">
                                                <Sun size={13} strokeWidth={1.5} />
                                                <span className="text-[11px] tracking-wide font-medium">Height</span>
                                            </div>
                                            <span className="text-[10px] font-medium text-charcoal bg-stone-light/30 px-1.5 py-0.5 rounded">
                                                {lightPos.y.toFixed(1)} m
                                            </span>
                                        </div>
                                        <input
                                            type="range" min="2" max="15" step="0.5" value={lightPos.y}
                                            onChange={(e) => setLightPos((p: LightPos) => ({ ...p, y: parseFloat(e.target.value) }))}
                                            className="w-full h-1.5 bg-stone-light/50 rounded-lg appearance-none cursor-pointer accent-amber-400"
                                        />
                                    </div>

                                    <div className="p-5">
                                        <button
                                            onClick={() => setSidebarMode('furniture')}
                                            className="w-full bg-charcoal text-white py-4 rounded-xl text-[11px] tracking-[0.2em] uppercase font-bold hover:bg-charcoal-light transition-all duration-300 shadow-lg flex items-center justify-center gap-3 group"
                                        >
                                            Step 2: Add Furniture
                                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="furniture"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex flex-col h-full"
                                >
                                    {/* ─ Transform Tools ─ */}
                                    <div className="p-5 border-b border-stone-light/70">
                                        <div className="flex items-center justify-between mb-4">
                                            <p className="text-[10px] tracking-[0.25em] uppercase text-charcoal/40 font-medium">Arrange</p>
                                            <button
                                                onClick={() => setSidebarMode('room')}
                                                className="text-[9px] text-sage font-bold tracking-widest uppercase hover:underline"
                                            >
                                                ← Back to Setup
                                            </button>
                                        </div>
                                        <div className="flex gap-2 mb-3">
                                            {([
                                                { mode: 'translate' as const, icon: Move, label: 'Drag to Move' },
                                                { mode: 'rotate' as const, icon: RotateCw, label: 'Drag to Rotate' },
                                            ]).map(({ mode, icon: Icon, label }) => (
                                                <button key={mode} onClick={() => setTransformMode(mode)}
                                                    className={`flex-1 flex flex-col items-center justify-center py-3.5 rounded-xl border transition-all duration-300
                                                        ${transformMode === mode
                                                            ? 'border-sage/40 bg-sage/10 text-sage-dark shadow-sm'
                                                            : 'border-stone-light/60 text-charcoal/40 hover:bg-stone-light/30 hover:text-charcoal/60 hover:border-stone-light'}`}>
                                                    <Icon size={18} strokeWidth={1.5} className="mb-1.5" />
                                                    <span className="text-[10px] tracking-wide font-medium uppercase text-center">{label}</span>
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex items-center justify-between px-2 py-2 bg-stone-light/20 rounded-lg border border-stone-light/40">
                                            <div className="flex items-center gap-2 text-charcoal/60">
                                                <GridIcon size={14} strokeWidth={1.5} />
                                                <span className="text-[11px] tracking-wide font-medium">Snap to Grid</span>
                                            </div>
                                            <button onClick={() => setSnapToGrid(!snapToGrid)}
                                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 ${snapToGrid ? 'bg-sage' : 'bg-stone-light/60'}`}>
                                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${snapToGrid ? 'translate-x-4.5' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* ─ Catalog ─ */}
                                    <div className="p-5 flex flex-col gap-4">
                                        <p className="text-[10px] tracking-[0.25em] uppercase text-charcoal/40 font-medium">Furniture Catalog</p>
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
                                                    <img src={'/furniture-icons/' + item.type + '.png'} alt={item.name}
                                                        className="w-12 h-12 object-contain mb-2.5 transition-transform duration-200 group-hover:scale-105" />
                                                    <span className="text-[10px] font-medium text-charcoal/55 group-hover:text-charcoal/80 tracking-wide transition-colors duration-300">
                                                        {item.name}
                                                    </span>
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>

                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ─ Selected Item Sticky Footer ─ */}
                    <AnimatePresence>
                        {sidebarMode === 'furniture' && selectedItem && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-stone-light/70 bg-white shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] z-20"
                            >
                                <div className="p-5 flex flex-col gap-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <p className="text-[10px] tracking-[0.25em] uppercase text-charcoal/40 font-bold">Selected Item</p>
                                            <span className="text-base font-serif text-charcoal leading-tight">{selectedItem.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-stone-light/10 p-1.5 rounded-lg border border-stone-light/30">
                                            <input type="color"
                                                value={selectedItem.color ?? getDefaultColorForType(selectedItem.type)}
                                                onChange={(e) => updateItem(selectedItem.id, { color: e.target.value })}
                                                className="w-5 h-5 rounded-sm border border-stone-light cursor-pointer bg-transparent p-0" />
                                            <span className="text-[9px] font-mono text-charcoal/40 uppercase">Colour</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button onClick={duplicateItem}
                                            className="flex-1 py-2 rounded-lg text-[10px] tracking-[0.05em] uppercase font-bold text-charcoal bg-white border border-stone-light shadow-sm hover:bg-stone-light/20 transition-all flex items-center justify-center gap-1.5">
                                            <Copy size={12} strokeWidth={2} />Duplicate
                                        </button>
                                        <button onClick={deleteSelected}
                                            className="flex-1 py-2 rounded-lg text-[10px] tracking-[0.05em] uppercase font-bold text-white bg-red-400 border border-red-500/50 shadow-sm hover:bg-red-500 transition-all flex items-center justify-center gap-1.5">
                                            <Trash2 size={12} strokeWidth={2} />Delete
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 border-t border-stone-light/30 pt-4">
                                        {/* Rotation */}
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] tracking-[0.15em] uppercase text-charcoal/50 font-medium">Rotation</span>
                                                <span className="text-[9px] bg-stone-light/30 px-1 py-0.5 rounded text-charcoal font-medium">
                                                    {Math.round((selectedItem.rotation[1] * 180) / Math.PI)}°
                                                </span>
                                            </div>
                                            <input type="range" min="0" max="360" step={snapToGrid ? 45 : 1}
                                                value={(selectedItem.rotation[1] * 180) / Math.PI}
                                                onChange={(e) => updateItem(selectedItem.id, {
                                                    rotation: [0, (parseFloat(e.target.value) * Math.PI) / 180, 0]
                                                })}
                                                className="w-full h-1 bg-stone-light/50 rounded-lg appearance-none cursor-pointer accent-sage" />
                                        </div>

                                        {/* Size */}
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] tracking-[0.15em] uppercase text-charcoal/50 font-medium">Size</span>
                                                <span className="text-[9px] bg-stone-light/30 px-1 py-0.5 rounded text-charcoal font-medium">
                                                    {Math.round((selectedItem.scale?.[0] ?? 1) * 100)}%
                                                </span>
                                            </div>
                                            <input type="range" min="20" max="200" step={5}
                                                value={(selectedItem.scale?.[0] ?? 1) * 100}
                                                onChange={(e) => {
                                                    const s = parseFloat(e.target.value) / 100;
                                                    updateItem(selectedItem.id, { scale: [s, s, s] });
                                                }}
                                                className="w-full h-1 bg-stone-light/50 rounded-lg appearance-none cursor-pointer accent-sage" />
                                        </div>
                                    </div>

                                    {/* Position Inputs */}
                                    <div className="flex gap-3 pt-1">
                                        <div className="flex-1 flex flex-col gap-1">
                                            <span className="text-[9px] tracking-[0.15em] uppercase text-charcoal/40 font-medium">Pos X (m)</span>
                                            <input type="number" step="0.1"
                                                value={Math.round(selectedItem.position[0] * 100) / 100}
                                                onChange={(e) => updateItem(selectedItem.id, {
                                                    position: [parseFloat(e.target.value) || 0, selectedItem.position[1], selectedItem.position[2]]
                                                })}
                                                className="w-full bg-stone-light/10 border border-stone-light/30 rounded px-2 py-1 text-[11px] text-charcoal focus:outline-none focus:border-sage" />
                                        </div>
                                        <div className="flex-1 flex flex-col gap-1">
                                            <span className="text-[9px] tracking-[0.15em] uppercase text-charcoal/40 font-medium">Pos Z (m)</span>
                                            <input type="number" step="0.1"
                                                value={Math.round(selectedItem.position[2] * 100) / 100}
                                                onChange={(e) => updateItem(selectedItem.id, {
                                                    position: [selectedItem.position[0], selectedItem.position[1], parseFloat(e.target.value) || 0]
                                                })}
                                                className="w-full bg-stone-light/10 border border-stone-light/30 rounded px-2 py-1 text-[11px] text-charcoal focus:outline-none focus:border-sage" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.aside>

                {/* ── Canvas area ── */}
                <section className="flex-1 relative bg-stone-light/15">
                    {selectedId && (!isMobile || isMobileSidebarOpen) && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10
                                        bg-charcoal/70 text-white text-[10px] tracking-[0.15em] uppercase
                                        px-4 py-2 rounded-full backdrop-blur-sm pointer-events-none text-center">
                            {transformMode === 'translate' ? 'Drag item to move' : 'Drag amber ring to rotate'}
                        </div>
                    )}

                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="absolute top-4 left-4 z-10 bg-warm-white/80 backdrop-blur-sm border border-stone-light/50 rounded-lg px-3 sm:px-4 py-2
                                   flex items-center gap-2.5 shadow-sm pointer-events-none"
                    >
                        <Armchair size={14} strokeWidth={1.5} className="text-charcoal/40" />
                        <span className="text-[9px] sm:text-[10px] tracking-[0.15em] uppercase text-charcoal/50 font-medium">
                            {placedItems.length} {placedItems.length === 1 ? 'item' : 'items'} <span className="hidden xs:inline">· {activeRoom.name}</span>
                        </span>
                    </motion.div>

                    {/* Mobile Floating Selected Item Controls */}
                    <AnimatePresence>
                        {isMobile && !isMobileSidebarOpen && selectedItem && (
                            <motion.div
                                initial={{ y: 100, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 100, opacity: 0 }}
                                className="absolute bottom-20 left-4 right-4 z-30 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-stone-light/50 lg:hidden"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-widest text-charcoal/40 font-bold">Selected</span>
                                        <span className="text-sm font-serif text-charcoal">{selectedItem.name}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={duplicateItem} className="p-2.5 rounded-xl bg-stone-light/20 text-charcoal hover:bg-stone-light/40 transition-colors">
                                            <Copy size={16} />
                                        </button>
                                        <button onClick={deleteSelected} className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                        <button onClick={() => { setIsMobileSidebarOpen(true); setSidebarMode('furniture'); }} className="p-2.5 rounded-xl bg-charcoal text-white">
                                            <Settings size={16} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Canvas
                        shadows                                     // enables shadow maps
                        gl={{ preserveDrawingBuffer: true }}        // needed for PNG export
                        onCreated={({ gl }) => { glRef.current = gl; }}
                    >
                        {/* ── Cameras ── */}
                        {viewMode === '2d' ? (
                            <OrthographicCamera makeDefault position={[0, 10, 0]} zoom={60} near={0.1} far={100} rotation={[-Math.PI / 2, 0, 0]} />
                        ) : (
                            <PerspectiveCamera makeDefault position={[5, 4, 5]} fov={50} />
                        )}

                        {/* ── Lighting rig ── */}
                        <LightingRig mode={lightingMode} lightPos={lightPos} />

                        {/* ── 2D grid overlay ── */}
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

                        {/* ── Room ── */}
                        <RoomGeometry
                            width={effectiveWidth}
                            depth={effectiveDepth}
                            height={activeRoom.height}
                            wallColor={effectiveWallColor}
                            floorColor={effectiveFloorColor}
                            wallTexture={wallTexture}
                            lShape={effectiveLShape}
                            onDeselect={() => setSelectedId(null)}
                        />

                        {/* ── Furniture ── */}
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
                                roomWidth={effectiveWidth}
                                roomDepth={effectiveDepth}
                                lShape={effectiveLShape}
                            />
                        ))}

                        {/* ── Orbit controls ── */}
                        <OrbitControls
                            ref={orbitControlsRef}
                            makeDefault={true}
                            enabled={!isDragging}
                            minPolarAngle={0}
                            maxPolarAngle={viewMode === '3d' ? Math.PI / 2 - 0.05 : 0}
                            enableRotate={viewMode === '3d'}
                        />
                    </Canvas>
                </section>
            </main>

            {/* ── Toast ── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.92 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed bottom-8 right-8 bg-charcoal text-white pl-5 pr-6 py-4 rounded-xl shadow-2xl flex items-center gap-3.5 z-50 pointer-events-none border border-white/5"
                    >
                        <div className={`p-1.5 rounded-full ${toast.type === 'success' ? 'bg-sage' : 'bg-red-400'}`}>
                            {toast.type === 'success' ? <Check size={12} strokeWidth={3} /> : <AlertCircle size={12} strokeWidth={3} />}
                        </div>
                        <span className="text-[12px] tracking-wide font-medium">{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Sharing Modal ── */}
            <UserShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                designId={currentDesignId || ''}
                designName={designName}
                imageData={shareImageData}
            />
        </div>
    );
}