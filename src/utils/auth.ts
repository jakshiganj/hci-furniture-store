import { supabase } from './supabase';

// localStorage key for the current session cache (stores logged-in user info for synchronous UI checks)
const AUTH_KEY = "furniture_store_auth";

/**
 * Attempt to log in with the given credentials using Supabase.
 * On success, stores a temporary synchronous session object in localStorage for the UI.
 *
 * @returns true if credentials are valid, false otherwise
 */
export async function login(email: string, password: string): Promise<boolean> {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error("Supabase Login Error:", error.message);
            return false;
        }

        if (data.session) {
            // Fetch the user's assigned role from the database profiles table
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single();

            const role = profile?.role || 'customer';

            // Cache the user info so existing synchronous UI components (like Navbar) still work seamlessly
            localStorage.setItem(AUTH_KEY, JSON.stringify({ 
                email: data.user.email, 
                name: data.user.user_metadata?.first_name || data.user.email?.split('@')[0],
                id: data.user.id,
                role: role,
                loggedInAt: Date.now() 
            }));
            return true;
        }
        
        return false;
    } catch (err) {
        console.error("Login failed", err);
        return false;
    }
}

/**
 * Log the current user out of Supabase and remove the UI session cache.
 */
export async function logout(): Promise<void> {
    await supabase.auth.signOut();
    localStorage.removeItem(AUTH_KEY);
}

/**
 * Synchronous check if a user is currently logged in.
 * Relies on the local cache for immediate UI rendering logic.
 *
 * @returns true if a session cache exists in localStorage
 */
export function isLoggedIn(): boolean {
    return localStorage.getItem(AUTH_KEY) !== null;
}

/**
 * Retrieve the current logged-in user's data from the synchronous session cache.
 *
 * @returns user object with email and name, or null if not logged in
 */
export function getUser(): { email: string; name?: string; id?: string; role?: string } | null {
    const data = localStorage.getItem(AUTH_KEY);
    if (!data) return null;
    return JSON.parse(data);
}

/**
 * Synchronous check if the currently logged-in user is an admin.
 * 
 * @returns true if the user's role in the session cache is 'admin'
 */
export function isAdmin(): boolean {
    const user = getUser();
    return user?.role === 'admin';
}

/**
 * Register a new user account with Supabase Auth.
 * Automatically inserts a profile record if successful.
 *
 * @returns object with success boolean and a human-readable message
 */
export async function register(name: string, email: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
        // Split name for metadata
        const [firstName, ...rest] = name.split(' ');
        const lastName = rest.join(' ');

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName
                }
            }
        });

        if (error) {
            // Provide user-friendly errors
            if (error.message.includes('already registered')) {
                return { success: false, message: "An account with this email already exists." };
            }
            return { success: false, message: error.message };
        }

        if (data.user) {
            // Depending on Supabase settings, sign up might require email verification.
            // If they are auto-logged in or return a user, we consider registration successful.
            
            // Also explicitly create the profile record since the trigger isn't set up
            const { error: profileError } = await supabase.from('profiles').insert({
                id: data.user.id,
                first_name: firstName,
                last_name: lastName,
                role: 'customer'
            });

            if (profileError) console.warn("Could not create profile record:", profileError);

            return { success: true, message: "Account created successfully!" };
        }

        return { success: false, message: "Failed to create account. Please try again." };

    } catch (err) {
        console.error("Registration failed", err);
        return { success: false, message: "An unexpected error occurred." };
    }
}
