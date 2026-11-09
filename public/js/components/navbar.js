// Navbar Component
class Navbar {
    static render(title = 'Dashboard') {
        const user = authService.getUser();

        return `
            <nav class="sticky top-0 z-20 mb-6 border-b border-slate-200 bg-white/90 backdrop-blur">
                <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
                    <a href="/dashboard" onclick="navigateToPage(event, '/dashboard')" class="flex min-w-0 flex-1 items-center gap-3">
                        <img src="/assets/nasa%20cairo%20logo.png" alt="" class="h-9 w-9 rounded-md object-contain">
                        <div class="min-w-0">
                            <h1 class="truncate text-lg font-semibold text-slate-900">${title}</h1>
                            <p class="truncate text-xs text-slate-500">Signed in as ${UI.escape(user ? user.name : 'User')}</p>
                        </div>
                    </a>
                    <div class="flex items-center gap-2">
                        ${user && user.role === 'judge' ? `
                            <button onclick="ChangePasswordModal.open()" class="btn btn-secondary btn-sm">
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                                <span class="hidden sm:inline">Change Password</span>
                            </button>
                        ` : ''}
                        <button onclick="handleLogout()" class="btn btn-ghost btn-sm">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                            <span class="hidden sm:inline">Logout</span>
                        </button>
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
