// Authentication utility functions
class AuthManager {
    constructor() {
        this.user = null;
        this.accessToken = localStorage.getItem('accessToken');
        this.refreshToken = localStorage.getItem('refreshToken');
        
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                this.user = JSON.parse(storedUser);
            } catch (e) {
                console.error('Failed to parse stored user:', e);
            }
        }
    }

    isLoggedIn() {
        return !!this.accessToken && !!this.user;
    }

    async checkAuth() {
        if (!this.accessToken) return false;

        try {
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.user = data.user;
                localStorage.setItem('user', JSON.stringify(data.user));
                return true;
            } else if (response.status === 403) {
                // Try to refresh token
                return await this.refreshAccessToken();
            } else {
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            return false;
        }
    }

    async refreshAccessToken() {
        if (!this.refreshToken) {
            this.logout();
            return false;
        }

        try {
            const response = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    refreshToken: this.refreshToken
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.accessToken = data.accessToken;
                this.refreshToken = data.refreshToken;
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                return true;
            } else {
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.logout();
            return false;
        }
    }

    async makeAuthenticatedRequest(url, options = {}) {
        if (!this.accessToken) {
            throw new Error('Not authenticated');
        }

        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${this.accessToken}`
        };

        const response = await fetch(url, { ...options, headers });

        if (response.status === 403) {
            // Try to refresh token and retry
            const refreshed = await this.refreshAccessToken();
            if (refreshed) {
                headers['Authorization'] = `Bearer ${this.accessToken}`;
                return fetch(url, { ...options, headers });
            }
        }

        return response;
    }

    logout() {
        this.user = null;
        this.accessToken = null;
        this.refreshToken = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    }

    updateUserDisplay() {
        const userInfoElement = document.getElementById('userInfo');
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');

        if (!userInfoElement) {
            // Create user info display if it doesn't exist
            const nav = document.querySelector('nav');
            if (nav) {
                const userSection = document.createElement('div');
                userSection.className = 'user-section';
                userSection.innerHTML = `
                    <div id="userInfo" class="user-info">
                        <span class="user-name"></span>
                        <span class="user-plan"></span>
                    </div>
                    <a href="/login" id="loginBtn" class="nav-link login-btn">Login</a>
                    <button id="logoutBtn" class="nav-link logout-btn" style="display:none;">Logout</button>
                `;
                nav.appendChild(userSection);
            }
        }

        if (this.isLoggedIn() && this.user) {
            // Show user info
            if (userInfoElement) {
                const nameEl = userInfoElement.querySelector('.user-name');
                const planEl = userInfoElement.querySelector('.user-plan');
                if (nameEl) nameEl.textContent = this.user.fullName || this.user.email;
                if (planEl) planEl.textContent = `(${this.user.role || 'Free'})`;
                userInfoElement.style.display = 'flex';
            }
            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) {
                logoutBtn.style.display = 'block';
                logoutBtn.onclick = async () => {
                    await this.performLogout();
                };
            }
        } else {
            // Show login button
            if (userInfoElement) userInfoElement.style.display = 'none';
            if (loginBtn) loginBtn.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    }

    async performLogout() {
        try {
            if (this.accessToken) {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.logout();
            this.updateUserDisplay();
            // Optionally redirect to login
            // window.location.href = '/login';
        }
    }
}

// Create global auth manager instance
window.authManager = new AuthManager();

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Add CSS for user display
    const style = document.createElement('style');
    style.textContent = `
        .user-section {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-left: auto;
        }
        
        .user-info {
            display: none;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: rgba(191, 87, 0, 0.1);
            border: 1px solid rgba(191, 87, 0, 0.3);
            border-radius: 20px;
            font-size: 14px;
        }
        
        .user-name {
            color: #BF5700;
            font-weight: 600;
        }
        
        .user-plan {
            color: rgba(255, 255, 255, 0.6);
            font-size: 12px;
        }
        
        .login-btn, .logout-btn {
            padding: 8px 20px;
            background: linear-gradient(135deg, #BF5700 0%, #FF6B35 100%);
            color: white !important;
            border-radius: 8px;
            text-decoration: none !important;
            font-weight: 600;
            font-size: 14px;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .login-btn:hover, .logout-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(191, 87, 0, 0.4);
        }
        
        @media (max-width: 768px) {
            .user-section {
                margin-top: 10px;
            }
        }
    `;
    document.head.appendChild(style);

    // Check authentication status
    await window.authManager.checkAuth();
    window.authManager.updateUserDisplay();

    // Add auth check for protected features
    document.querySelectorAll('[data-requires-auth]').forEach(element => {
        element.addEventListener('click', (e) => {
            if (!window.authManager.isLoggedIn()) {
                e.preventDefault();
                alert('Please login to access this feature');
                window.location.href = '/login';
            }
        });
    });
});