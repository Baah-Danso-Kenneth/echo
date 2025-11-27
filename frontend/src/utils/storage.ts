const TOKEN_KEY = 'echo_auth_token';
const USER_KEY = 'echo_user';

export const storage = {
    // Token management
    getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    },

    setToken(token: string): void {
        localStorage.setItem(TOKEN_KEY, token);
    },

    removeToken(): void {
        localStorage.removeItem(TOKEN_KEY);
    },

    // User management
    getUser(): any | null {
        const user = localStorage.getItem(USER_KEY);
        return user ? JSON.parse(user) : null;
    },

    setUser(user: any): void {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    removeUser(): void {
        localStorage.removeItem(USER_KEY);
    },

    // Clear all
    clear(): void {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },
};
