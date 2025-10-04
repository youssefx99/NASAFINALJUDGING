// Navbar Component
class Navbar {
    static render(title = 'Dashboard') {
        const user = authService.getUser();
        
        return `
            <nav class="bg-white shadow-lg mb-8">
                <div class="max-w-7xl mx-auto px-4">
                    <div class="flex justify-between items-center py-4">
                        <div class="flex items-center space-x-4">
                            <h1 class="text-2xl font-bold text-gray-800">${title}</h1>
                        </div>
                        <div class="flex items-center space-x-4">
                            <span class="text-gray-600">Welcome, ${user ? user.name : 'User'}</span>
                            ${user && user.role === 'judge' ? `
                                <button 
                                    onclick="ChangePasswordModal.open()" 
                                    class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                                >
                                    Change Password
                                </button>
                            ` : ''}
                            <button 
                                onclick="handleLogout()" 
                                class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
        `;
    }
}

// Global logout handler
function handleLogout() {
    authService.logout();
    router.navigate('/login');
}
