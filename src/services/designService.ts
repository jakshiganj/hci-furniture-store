// Data model for a saved room design
export interface Design {
    id: string;
    name: string;
    roomType: string;
    createdAt: string;
    furniture: unknown[];
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