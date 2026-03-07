/**
 * designService.ts
 *
 * Persistence layer for room designs using localStorage.
 * Provides reusable CRUD (Create, Read, Update, Delete) operations
 * for managing saved room layouts.
 *
 * All designs are stored as a JSON array under the localStorage key "designs".
 *
 * This service is designed to be connected to:
 *   - The DesignerWorkspace page (for saving/updating designs)
 *   - The Saved Designs section on the homepage (for listing/deleting designs)
 */

// ─── Data Structure ──────────────────────────────────────────────────────────

/**
 * Represents a saved room design.
 *
 * @property id         - Unique identifier (generated via Date.now())
 * @property name       - User-given name for the design (e.g. "Living Room Layout")
 * @property roomType   - Type of room (e.g. "Living Room", "Bedroom")
 * @property createdAt  - ISO date string of when the design was created
 * @property furniture  - Array of furniture items placed in the design
 */
export interface Design {
    id: string;
    name: string;
    roomType: string;
    createdAt: string;
    furniture: any[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** The localStorage key under which all designs are stored. */
const STORAGE_KEY = "designs";

// ─── Helper ──────────────────────────────────────────────────────────────────

/**
 * Reads and parses the designs array from localStorage.
 * Returns an empty array if no data is found or if parsing fails,
 * making every public function safe to call at any time.
 */
const readFromStorage = (): Design[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as Design[]) : [];
    } catch {
        // If localStorage data is corrupt, start fresh
        console.warn("Failed to parse designs from localStorage. Returning empty array.");
        return [];
    }
};

/**
 * Serializes the designs array and writes it to localStorage.
 */
const writeToStorage = (designs: Design[]): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
};

// ─── CRUD Operations ─────────────────────────────────────────────────────────

/**
 * CREATE – Saves a new design to localStorage.
 *
 * Accepts a partial design object (without `id` and `createdAt`) and
 * automatically generates:
 *   • A unique `id` using `Date.now().toString()`
 *   • A `createdAt` timestamp set to the current date (ISO format)
 *
 * The new design is appended to the existing array and persisted.
 *
 * @param design - The design data to save (id and createdAt are auto-generated)
 * @returns The newly created Design object (including generated id & createdAt)
 *
 * @example
 *   const saved = saveDesign({
 *     name: "Living Room Layout",
 *     roomType: "Living Room",
 *     furniture: [{ type: "sofa", x: 10, y: 20 }]
 *   });
 *   console.log(saved.id); // e.g. "1709836800000"
 */
export const saveDesign = (
    design: Omit<Design, "id" | "createdAt">
): Design => {
    const designs = readFromStorage();

    // Build the complete design record with auto-generated fields
    const newDesign: Design = {
        ...design,
        id: Date.now().toString(),
        createdAt: new Date().toISOString().split("T")[0], // "YYYY-MM-DD"
    };

    designs.push(newDesign);
    writeToStorage(designs);

    return newDesign;
};

/**
 * READ – Retrieves all saved designs from localStorage.
 *
 * Returns the full array of Design objects.
 * If nothing has been saved yet, returns an empty array.
 *
 * @returns An array of all stored Design objects
 *
 * @example
 *   const allDesigns = getDesigns();
 *   allDesigns.forEach(d => console.log(d.name));
 */
export const getDesigns = (): Design[] => {
    return readFromStorage();
};

/**
 * UPDATE – Replaces an existing design (matched by `id`) with new data.
 *
 * Iterates through the stored designs and swaps in the updated object
 * wherever the `id` matches. All other designs remain untouched.
 *
 * @param updatedDesign - The full Design object with updated fields
 * @returns The updated Design object, or `null` if no matching id was found
 *
 * @example
 *   const result = updateDesign({
 *     id: "1709836800000",
 *     name: "Cozy Living Room",
 *     roomType: "Living Room",
 *     createdAt: "2026-03-07",
 *     furniture: [{ type: "sofa", x: 15, y: 25 }]
 *   });
 */
export const updateDesign = (updatedDesign: Design): Design | null => {
    const designs = readFromStorage();

    // Find the index of the design to update
    const index = designs.findIndex((d) => d.id === updatedDesign.id);

    if (index === -1) {
        // No design with the given id exists
        console.warn(`Design with id "${updatedDesign.id}" not found.`);
        return null;
    }

    // Replace the old design with the updated one
    designs[index] = updatedDesign;
    writeToStorage(designs);

    return updatedDesign;
};

/**
 * DELETE – Removes a design from localStorage by its `id`.
 *
 * Filters out the design whose `id` matches and persists the
 * remaining array back to localStorage.
 *
 * @param id - The unique identifier of the design to delete
 * @returns `true` if a design was found and removed, `false` otherwise
 *
 * @example
 *   const wasDeleted = deleteDesign("1709836800000");
 *   if (wasDeleted) console.log("Design removed!");
 */
export const deleteDesign = (id: string): boolean => {
    const designs = readFromStorage();
    const filtered = designs.filter((d) => d.id !== id);

    // If lengths are the same, nothing was removed
    if (filtered.length === designs.length) {
        console.warn(`Design with id "${id}" not found. Nothing deleted.`);
        return false;
    }

    writeToStorage(filtered);
    return true;
};

/**
 * READ (single) – Retrieves a single design by its `id`.
 *
 * A convenience function for when you need to fetch one specific design,
 * e.g. when opening the DesignerWorkspace page for an existing layout.
 *
 * @param id - The unique identifier of the design to retrieve
 * @returns The matching Design object, or `undefined` if not found
 *
 * @example
 *   const design = getDesignById("1709836800000");
 *   if (design) console.log(design.name);
 */
export const getDesignById = (id: string): Design | undefined => {
    const designs = readFromStorage();
    return designs.find((d) => d.id === id);
};
