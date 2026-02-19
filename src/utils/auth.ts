
// localStorage key for the current session (stores logged-in user info)
const AUTH_KEY = "furniture_store_auth";

// localStorage key for the registered users array
const USERS_KEY = "furniture_store_users";

// Built-in demo credentials for quick testing
const DEMO_CREDENTIALS = {
    email: "admin@gmail.com",
    password: "1234",
};

/** Shape of a user stored in the registered users array */
interface StoredUser {
    name: string;
    email: string;
    password: string;
}

/**
 * Attempt to log in with the given credentials.
 * Checks demo credentials first, then registered users in localStorage.
 * On success, stores a session object in localStorage.
 *
 * @returns true if credentials are valid, false otherwise
 */
export function login(email: string, password: string): boolean {
    // Check demo credentials first
    if (
        email === DEMO_CREDENTIALS.email &&
        password === DEMO_CREDENTIALS.password
    ) {
        // Store session with name "Admin" for the demo account (used for greeting display)
        localStorage.setItem(AUTH_KEY, JSON.stringify({ email, name: "Admin", loggedInAt: Date.now() }));
        return true;
    }

    // Check registered users stored in localStorage
    const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    const found = users.find((u) => u.email === email && u.password === password);
    if (found) {
        localStorage.setItem(AUTH_KEY, JSON.stringify({ email: found.email, name: found.name, loggedInAt: Date.now() }));
        return true;
    }

    // No match found
    console.log("Invalid login");
    return false;
}

/**
 * Log the current user out by removing their session from localStorage.
 */
export function logout(): void {
    localStorage.removeItem(AUTH_KEY);
}

/**
 * Check if a user is currently logged in.
 * Used by ProtectedRoute and Navbar to gate access and toggle UI.
 *
 * @returns true if a session exists in localStorage
 */
export function isLoggedIn(): boolean {
    return localStorage.getItem(AUTH_KEY) !== null;
}

/**
 * Retrieve the current logged-in user's data from the session.
 *
 * @returns user object with email (and optionally name), or null if not logged in
 */
export function getUser(): { email: string; name?: string } | null {
    const data = localStorage.getItem(AUTH_KEY);
    if (!data) return null;
    return JSON.parse(data);
}

/**
 * Register a new user account.
 * Stores the user in the localStorage users array.
 * Prevents duplicate email registrations.
 *
 * @returns object with success boolean and a human-readable message
 */
export function register(name: string, email: string, password: string): { success: boolean; message: string } {
    const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");

    // Prevent duplicate registrations
    if (users.some((u) => u.email === email)) {
        return { success: false, message: "An account with this email already exists." };
    }

    // Store the new user
    users.push({ name, email, password });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return { success: true, message: "Account created successfully!" };
}
