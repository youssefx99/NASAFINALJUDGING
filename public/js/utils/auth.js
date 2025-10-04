// Authentication utility
class AuthService {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.loadFromStorage();
    }

    loadFromStorage() {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('currentUser');
        
        if (token && user) {
            this.token = token;
            this.currentUser = JSON.parse(user);
        }
    }

    async login(email, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.token = data.token;
                this.currentUser = data.user;
                
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                
                return { success: true, user: data.user };
            } else {
                return { success: false, message: data.message || 'Login failed' };
            }
        } catch (error) {
            return { success: false, message: 'Connection error. Please try again.' };
        }
    }

    logout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
    }

    isAuthenticated() {
        return this.token && this.currentUser;
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    getUser() {
        return this.currentUser;
    }

    getUserId() {
        if (!this.token) return null;
        try {
            // Decode base64 token to get user ID
            const decoded = atob(this.token);
            const [userId] = decoded.split(':');
            return userId;
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }
}

// Global auth service instance
const authService = new AuthService();
