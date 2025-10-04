// Sidebar Component for Admin
class Sidebar {
  static render() {
    const currentPath = window.location.pathname;

    return `
            <div class="bg-gray-800 text-white w-64 min-h-screen fixed left-0 top-0 z-10">
                <div class="p-4">
                    <h2 class="text-xl font-bold mb-8">NASA Teams Admin</h2>
                    
                    <nav class="space-y-2">
                        <a href="/admin" 
                           onclick="navigateToPage(event, '/admin')"
                           class="flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${currentPath === '/admin' ? 'bg-blue-600' : 'hover:bg-gray-700'}">
                            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h2a2 2 0 012 2v2H8V5z"></path>
                            </svg>
                            Dashboard
                        </a>
                        
                        <a href="/admin/upload-data" 
                           onclick="navigateToPage(event, '/admin/upload-data')"
                           class="flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${currentPath === '/admin/upload-data' ? 'bg-blue-600' : 'hover:bg-gray-700'}">
                            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                            </svg>
                            Upload Data (Legacy)
                        </a>
                        
                        <a href="/admin/upload-data-stream" 
                           onclick="navigateToPage(event, '/admin/upload-data-stream')"
                           class="flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${currentPath === '/admin/upload-data-stream' ? 'bg-blue-600' : 'hover:bg-gray-700'}">
                            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                            </svg>
                            <div class="flex flex-col">
                                <span>Efficient Upload</span>
                                <span class="text-xs text-green-400">✨ 500+ rows</span>
                            </div>
                        </a>
                        
                        <a href="/admin/judges" 
                           onclick="navigateToPage(event, '/admin/judges')"
                           class="flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${currentPath === '/admin/judges' ? 'bg-blue-600' : 'hover:bg-gray-700'}">
                            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                            </svg>
                            Judges Management
                        </a>
                        
                        <a href="/admin/teams" 
                           onclick="navigateToPage(event, '/admin/teams')"
                           class="flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${currentPath === '/admin/teams' ? 'bg-blue-600' : 'hover:bg-gray-700'}">
                            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                            </svg>
                            Teams Management
                        </a>
                        
                        <a href="/admin/panels" 
                           onclick="navigateToPage(event, '/admin/panels')"
                           class="flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${currentPath === '/admin/panels' ? 'bg-blue-600' : 'hover:bg-gray-700'}">
                            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                            </svg>
                            Panel Management
                        </a>
                        
                        <a href="/admin/stage1" 
                           onclick="navigateToPage(event, '/admin/stage1')"
                           class="flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${currentPath === '/admin/stage1' ? 'bg-blue-600' : 'hover:bg-gray-700'}">
                            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                            </svg>
                            Stage 1
                        </a>
                        
                        <a href="/admin/stage2" 
                           onclick="navigateToPage(event, '/admin/stage2')"
                           class="flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${currentPath === '/admin/stage2' ? 'bg-blue-600' : 'hover:bg-gray-700'}">
                            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                            </svg>
                            Stage 2
                        </a>
                        
                    </nav>
                </div>
                
                <div class="absolute bottom-0 w-full p-4 border-t border-gray-700">
                    <button 
                        onclick="handleLogout()" 
                        class="flex items-center w-full px-4 py-2 text-left hover:bg-gray-700 rounded-lg transition-colors duration-200"
                    >
                        <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                        </svg>
                        Logout
                    </button>
                </div>
            </div>
        `;
  }
}

// Global navigation handler
function navigateToPage(event, path) {
  event.preventDefault();
  router.navigate(path);
}
