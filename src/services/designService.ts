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

// Save a new design
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