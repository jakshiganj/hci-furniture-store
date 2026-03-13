export type LightPos = { x: number; y: number; z: number };

export type PresetsType =
    | 'sunset'
    | 'dawn'
    | 'night'
    | 'warehouse'
    | 'forest'
    | 'apartment'
    | 'studio'
    | 'city'
    | 'park'
    | 'lobby';

export interface RoomConfig {
    id: string;
    name: string;
    width: number;
    depth: number;
    height: number;
    wallColor: string;
    floorColor: string;
}

export type LightingMode = 'natural' | 'warm' | 'cool' | 'dramatic' | 'bright';

export const LIGHTING_PRESETS: Record<LightingMode, {
    ambientIntensity: number;
    directionalIntensity: number;
    directionalColor: string;
    environmentPreset: string;
}> = {
    natural:  { ambientIntensity: 0.30, directionalIntensity: 2.2, directionalColor: '#fff8f0', environmentPreset: 'city'      },
    warm:     { ambientIntensity: 0.25, directionalIntensity: 2.0, directionalColor: '#ffb347', environmentPreset: 'sunset'    },
    cool:     { ambientIntensity: 0.25, directionalIntensity: 1.8, directionalColor: '#b0c8ff', environmentPreset: 'dawn'      },
    dramatic: { ambientIntensity: 0.06, directionalIntensity: 3.5, directionalColor: '#fff5e0', environmentPreset: 'night'     },
    bright:   { ambientIntensity: 0.65, directionalIntensity: 1.2, directionalColor: '#ffffff', environmentPreset: 'warehouse' },
};

export const ROOMS: RoomConfig[] = [
    { id: 'living',  name: 'Living Room',  width: 10, depth: 8,  height: 3,   wallColor: '#f5f0ea', floorColor: '#d4c9b8' },
    { id: 'bedroom', name: 'Bedroom',      width: 8,  depth: 6,  height: 3,   wallColor: '#ece7df', floorColor: '#c9bfb0' },
    { id: 'kitchen', name: 'Kitchen',      width: 8,  depth: 8,  height: 3,   wallColor: '#f0ebe3', floorColor: '#bfb5a5' },
    { id: 'office',  name: 'Office',       width: 7,  depth: 6,  height: 3,   wallColor: '#eae5dd', floorColor: '#c4baa9' },
    { id: 'dining',  name: 'Dining Room',  width: 7,  depth: 6,  height: 3,   wallColor: '#f2ede5', floorColor: '#cec4b2' },
    { id: 'hallway', name: 'Hallway',      width: 4,  depth: 8,  height: 2.8, wallColor: '#ede8e0', floorColor: '#c8bfaf' },
    { id: 'studio',  name: 'Studio',       width: 9,  depth: 9,  height: 3.2, wallColor: '#e8e3db', floorColor: '#d0c8b8' },
    { id: 'nursery', name: 'Nursery',      width: 6,  depth: 5,  height: 2.8, wallColor: '#f0ece6', floorColor: '#d8d0c4' },
];

export interface Design {
    id: string;
    name: string;
    roomType: string;
    createdAt: string;
    furniture: unknown[];
    wallColor?: string;
    floorColor?: string;
    shadeLevel?: number;
    wallTexture?: string;
    lightingMode?: string;
    customWidth?: number;
    customDepth?: number;
    lightPos?: LightPos;
}

// localStorage key
const STORAGE_KEY = "designs";

// Read designs from localStorage
const readFromStorage = (): Design[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as Design[]) : [];
    } catch {
        return [];
    }
};

// Write designs to localStorage
const writeToStorage = (designs: Design[]): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
};

// Save a new design (returns the created design with generated id and date)
export const saveDesign = (
    design: Omit<Design, "id" | "createdAt">
): Design => {
    const designs = readFromStorage();

    const newDesign: Design = {
        ...design,
        id: Date.now().toString(),
        createdAt: new Date().toISOString().split("T")[0],
    };

    designs.push(newDesign);
    writeToStorage(designs);

    return newDesign;
};

// Update an existing design by ID (merges the provided fields)
export const updateDesign = (
    id: string,
    updates: Partial<Omit<Design, "id" | "createdAt">>
): Design | undefined => {
    const designs = readFromStorage();
    const index = designs.findIndex((d) => d.id === id);
    if (index === -1) return undefined;

    designs[index] = { ...designs[index], ...updates };
    writeToStorage(designs);
    return designs[index];
};

// Get all saved designs from localStorage
export const getDesigns = (): Design[] => {
    return readFromStorage();
};

// Find a single design by its ID
export const getDesignById = (id: string): Design | undefined => {
    const designs = readFromStorage();
    return designs.find((d) => d.id === id);
};

// Delete a design by ID and update localStorage
export const deleteDesign = (id: string): void => {
    const designs = readFromStorage();
    writeToStorage(designs.filter((d) => d.id !== id));
};

// Update a design's ID (useful for syncing local temporary IDs with database UUIDs)
export const migrateDesignId = (oldId: string, newId: string): void => {
    const designs = readFromStorage();
    const index = designs.findIndex((d) => d.id === oldId);
    if (index === -1) return;

    designs[index] = { ...designs[index], id: newId };
    writeToStorage(designs);
};

// Map Supabase database record to internal Design interface
export const mapFromSupabase = (d: {
    id: string;
    name: string;
    room_type: string;
    created_at: string;
    furniture_layout: unknown[];
    wall_color?: string;
    floor_color?: string;
    wall_texture?: string;
    lighting_mode?: string;
    custom_width?: number;
    custom_depth?: number;
    light_pos_x?: number;
    light_pos_y?: number;
    light_pos_z?: number;
}): Design => ({
    id: d.id,
    name: d.name,
    roomType: d.room_type,
    createdAt: new Date(d.created_at).toISOString().split('T')[0],
    furniture: d.furniture_layout || [],
    wallColor: d.wall_color,
    floorColor: d.floor_color,
    wallTexture: d.wall_texture,
    lightingMode: d.lighting_mode,
    customWidth: d.custom_width,
    customDepth: d.custom_depth,
    lightPos: (d.light_pos_x !== undefined && d.light_pos_y !== undefined && d.light_pos_z !== undefined)
        ? { x: d.light_pos_x, y: d.light_pos_y, z: d.light_pos_z }
        : undefined
});