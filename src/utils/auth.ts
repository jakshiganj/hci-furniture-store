/**
 * ============================================================================
 * AUTHENTICATION UTILITY MODULE — auth.ts
 * ============================================================================
 *
 * This module handles the complete authentication flow for the furniture store:
 *
 *   REGISTRATION FLOW:
 *   1. User fills out the register form (name, email, password).
 *   2. register() checks if email already exists in localStorage users list.
 *   3. If unique, the new user is appended to the stored users array.
 *   4. The RegisterPage shows an animated success message, then redirects
 *      to /login after 2 seconds.
 *
 *   LOGIN FLOW:
 *   1. User enters email & password on the login form.
 *   2. login() first checks against the built-in demo credentials.
 *   3. If no match, it checks against all registered users in localStorage.
 *   4. On success: a session object is saved to localStorage and the
 *      LoginPage shows an animated success message, then redirects to /.
 *   5. On failure: an animated error message is shown in the UI.
 *
 *   SESSION MANAGEMENT:
 *   - isLoggedIn() checks if a session exists in localStorage.
 *   - getUser() retrieves the current session data (email, name).
 *   - logout() removes the session from localStorage.
 *   - ProtectedRoute component redirects unauthenticated users to /login.
 *   - Session persists across page refreshes (localStorage is persistent).
 *
 * ============================================================================
 *
 *   HOW TO TEST:
 *
 *   1. REGISTRATION:
 *      - Navigate to /register
 *      - Fill in name, email, password, confirm password
 *      - Submit → green success message fades in, then redirect to /login
 *      - Check localStorage key "furniture_store_users" to confirm storage
 *
 *   2. LOGIN:
 *      - Navigate to /login
 *      - Enter the email/password you just registered (or demo: admin@gmail.com / 1234)
 *      - Submit → green success message fades in, then redirect to /
 *      - Try wrong credentials → red error message fades in
 *
 *   3. SESSION PERSISTENCE:
 *      - After logging in, refresh the page → you should stay on /
 *      - Check localStorage key "furniture_store_auth" to see session data
 *
 *   4. ROUTE PROTECTION:
 *      - Log out (click logout icon in Navbar)
 *      - Try navigating to / → you should be redirected to /login
 *      - Log back in → you can access / again
 *
 * ============================================================================
 */

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
        localStorage.setItem(AUTH_KEY, JSON.stringify({ email, loggedInAt: Date.now() }));
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
