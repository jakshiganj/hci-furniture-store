const AUTH_KEY = "furniture_store_auth";
const USERS_KEY = "furniture_store_users";

const DEMO_CREDENTIALS = {
    email: "admin@gmail.com",
    password: "1234",
};

interface StoredUser {
    name: string;
    email: string;
    password: string;
}

export function login(email: string, password: string): boolean {
    // Check demo credentials
    if (
        email === DEMO_CREDENTIALS.email &&
        password === DEMO_CREDENTIALS.password
    ) {
        localStorage.setItem(AUTH_KEY, JSON.stringify({ email, loggedInAt: Date.now() }));
        return true;
    }

    // Check registered users
    const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    const found = users.find((u) => u.email === email && u.password === password);
    if (found) {
        localStorage.setItem(AUTH_KEY, JSON.stringify({ email: found.email, name: found.name, loggedInAt: Date.now() }));
        return true;
    }

    console.log("Invalid login");
    return false;
}

export function logout(): void {
    localStorage.removeItem(AUTH_KEY);
}

export function isLoggedIn(): boolean {
    return localStorage.getItem(AUTH_KEY) !== null;
}

export function getUser(): { email: string; name?: string } | null {
    const data = localStorage.getItem(AUTH_KEY);
    if (!data) return null;
    return JSON.parse(data);
}

export function register(name: string, email: string, password: string): { success: boolean; message: string } {
    const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");

    if (users.some((u) => u.email === email)) {
        return { success: false, message: "An account with this email already exists." };
    }

    users.push({ name, email, password });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return { success: true, message: "Account created successfully!" };
}
