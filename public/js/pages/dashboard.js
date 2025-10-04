// Dashboard Page (for Judges)
class DashboardPage {
    static stage1CurrentPage = 1;
    static stage2CurrentPage = 1;
    static itemsPerPage = 5;

    static render() {
        return `
            <div class="min-h-screen bg-gray-50">
                ${Navbar.render('Judge Dashboard')}
                
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <!-- Stage 1 Teams -->
                    <div class="bg-white rounded-lg shadow mb-8">
                        <div class="px-6 py-4 border-b border-gray-200">
                            <div class="flex items-center justify-between mb-3">
                                <h3 class="text-lg font-medium text-gray-900">Stage 1 - Assigned Teams</h3>
                                <span id="stage1Progress" class="text-sm font-medium text-gray-600"></span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2.5">
                                <div id="stage1ProgressBar" class="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style="width: 0%"></div>
                            </div>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Name</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Challenge</th>
                                    </tr>
                                </thead>
                                <tbody id="stage1TeamsTable" class="bg-white divide-y divide-gray-200">
                                    <!-- Teams will be loaded here -->
                                </tbody>
                            </table>
                        </div>
                        <div id="stage1Pagination" class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <!-- Pagination will be loaded here -->
                        </div>
                    </div>

                    <!-- Stage 2 Teams -->
                    <div class="bg-white rounded-lg shadow mb-8">
                        <div class="px-6 py-4 border-b border-gray-200">
                            <div class="flex items-center justify-between mb-3">
                                <div>
                                    <h3 class="text-lg font-medium text-gray-900">Stage 2 - Assigned Teams</h3>
                                    <p id="stage2AwardType" class="text-sm text-gray-600 mt-1"></p>
                                </div>
                                <span id="stage2Progress" class="text-sm font-medium text-gray-600"></span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2.5">
                                <div id="stage2ProgressBar" class="bg-purple-600 h-2.5 rounded-full transition-all duration-300" style="width: 0%"></div>
                            </div>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Name</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Challenge</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solution Type</th>
                                    </tr>
                                </thead>
                                <tbody id="stage2TeamsTable" class="bg-white divide-y divide-gray-200">
                                    <!-- Teams will be loaded here -->
                                </tbody>
                            </table>
                        </div>
                        <div id="stage2Pagination" class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <!-- Pagination will be loaded here -->
                        </div>
                    </div>

                </div>
            </div>
        `;
    }

    static afterRender() {
        DashboardPage.loadAssignedTeams();
    }

    static async loadAssignedTeams() {
        try {
            const response = await fetch('/api/judges/assigned-teams', {
                headers: {
                    'Authorization': `Bearer ${authService.token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                DashboardPage.stage1AllTeams = data.stage1Teams || [];
                DashboardPage.stage2AllTeams = data.stage2Teams || [];
                DashboardPage.stage2AwardType = data.stage2AwardType;
                
                await DashboardPage.renderStage1Teams();
                await DashboardPage.renderStage2Teams();
            }
        } catch (error) {
            console.error('Failed to load assigned teams:', error);
            DashboardPage.renderEmptyState();
        }
    }

    static async renderStage1Teams() {
        const teams = DashboardPage.stage1AllTeams || [];
        const tbody = document.getElementById('stage1TeamsTable');
        
        if (teams.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="2" class="px-6 py-8 text-center text-gray-500">
                        <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        <p class="text-sm font-medium text-gray-900">No teams assigned yet</p>
                        <p class="text-sm text-gray-500">Teams will appear here once assigned by the admin</p>
                    </td>
                </tr>
            `;
            document.getElementById('stage1Progress').textContent = '0 / 0 completed';
            document.getElementById('stage1ProgressBar').style.width = '0%';
            return;
        }

        // Check which teams have been scored by this judge
        const judgeId = authService.getUserId();
        const scoredTeams = new Set();
        
        try {
            for (const team of teams) {
                const response = await fetch(`/api/scores/judge/${judgeId}/team/${team._id}/stage/1`, {
                    headers: { 'Authorization': `Bearer ${authService.token}` }
                });
                
                if (response.ok && response.status !== 204) {
                    try {
                        const score = await response.json();
                        if (score && score._id) {
                            scoredTeams.add(team._id);
                        }
                    } catch (jsonError) {
                        // Ignore parse errors
                    }
                }
            }
        } catch (error) {
            console.log('Could not check scored teams:', error);
        }

        // Update progress
        const scoredCount = scoredTeams.size;
        const totalCount = teams.length;
        const progressPercent = totalCount > 0 ? (scoredCount / totalCount * 100) : 0;
        document.getElementById('stage1Progress').textContent = `${scoredCount} / ${totalCount} completed`;
        document.getElementById('stage1ProgressBar').style.width = `${progressPercent}%`;

        // Pagination
        const startIndex = (DashboardPage.stage1CurrentPage - 1) * DashboardPage.itemsPerPage;
        const endIndex = startIndex + DashboardPage.itemsPerPage;
        const paginatedTeams = teams.slice(startIndex, endIndex);

        tbody.innerHTML = paginatedTeams.map(team => `
            <tr class="${scoredTeams.has(team._id) ? 'bg-green-300' : ''} hover:bg-gray-100 cursor-pointer" onclick="router.navigate('/stage1/${team._id}')">
                <td class="px-6 py-4">
                    <div class="text-sm font-medium text-gray-900">${team.name}</div>
                    <div class="text-sm text-gray-500">${team.subjects?.join(', ') || 'No subjects listed'}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">${team.challenge}</div>
                </td>
            </tr>
        `).join('');

        // Render pagination
        DashboardPage.renderPagination('stage1', teams.length);
    }

    static async renderStage2Teams() {
        const teams = DashboardPage.stage2AllTeams || [];
        const awardType = DashboardPage.stage2AwardType;
        const tbody = document.getElementById('stage2TeamsTable');
        const awardTypeElement = document.getElementById('stage2AwardType');
        
        // Display award type
        if (awardType) {
            awardTypeElement.innerHTML = `<span class="font-medium">Award Category:</span> ${awardType}`;
        }
        
        if (teams.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" class="px-6 py-8 text-center text-gray-500">
                        <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <p class="text-sm font-medium text-gray-900 mb-1">No teams assigned yet</p>
                        <p class="text-sm text-gray-500">Top 60 teams from Stage 1 will appear here automatically</p>
                        <p class="text-xs text-gray-400 mt-2">The system updates every 30 seconds</p>
                    </td>
                </tr>
            `;
            document.getElementById('stage2Progress').textContent = '0 / 0 completed';
            document.getElementById('stage2ProgressBar').style.width = '0%';
            return;
        }

        // Check which teams have been scored by this judge in Stage 2
        const judgeId = authService.getUserId();
        const scoredTeams = new Set();
        
        try {
            for (const team of teams) {
                const response = await fetch(`/api/scores/judge/${judgeId}/team/${team._id}/stage/2`, {
                    headers: { 'Authorization': `Bearer ${authService.token}` }
                });
                
                if (response.ok && response.status !== 204) {
                    try {
                        const score = await response.json();
                        if (score && score._id) {
                            scoredTeams.add(team._id);
                        }
                    } catch (jsonError) {
                        // Ignore parse errors
                    }
                }
            }
        } catch (error) {
            console.log('Could not check Stage 2 scored teams:', error);
        }

        // Update progress
        const scoredCount = scoredTeams.size;
        const totalCount = teams.length;
        const progressPercent = totalCount > 0 ? (scoredCount / totalCount * 100) : 0;
        document.getElementById('stage2Progress').textContent = `${scoredCount} / ${totalCount} completed`;
        document.getElementById('stage2ProgressBar').style.width = `${progressPercent}%`;

        // Pagination
        const startIndex = (DashboardPage.stage2CurrentPage - 1) * DashboardPage.itemsPerPage;
        const endIndex = startIndex + DashboardPage.itemsPerPage;
        const paginatedTeams = teams.slice(startIndex, endIndex);

        tbody.innerHTML = paginatedTeams.map(team => `
            <tr class="${scoredTeams.has(team._id) ? 'bg-green-300' : ''} hover:bg-gray-100 cursor-pointer" onclick="router.navigate('/stage2/${team._id}')">
                <td class="px-6 py-4">
                    <div class="text-sm font-medium text-gray-900">${team.name}</div>
                    <div class="text-sm text-gray-500">${team.subjects?.join(', ') || 'No subjects listed'}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">${team.challenge}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${team.actualSolution ? `
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            team.actualSolution === 'web' ? 'bg-blue-100 text-blue-800' :
                            team.actualSolution === 'mobile' ? 'bg-green-100 text-green-800' :
                            team.actualSolution === 'ai' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                        }">
                            ${team.actualSolution}
                        </span>
                    ` : '<span class="text-sm text-gray-400">-</span>'}
                </td>
            </tr>
        `).join('');

        // Render pagination
        DashboardPage.renderPagination('stage2', teams.length);
    }

    static renderPagination(stage, totalItems) {
        const currentPage = stage === 'stage1' ? DashboardPage.stage1CurrentPage : DashboardPage.stage2CurrentPage;
        const totalPages = Math.ceil(totalItems / DashboardPage.itemsPerPage);
        const paginationContainer = document.getElementById(`${stage}Pagination`);

        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        paginationContainer.innerHTML = `
            <div class="text-sm text-gray-700">
                Showing <span class="font-medium">${(currentPage - 1) * DashboardPage.itemsPerPage + 1}</span> to 
                <span class="font-medium">${Math.min(currentPage * DashboardPage.itemsPerPage, totalItems)}</span> of 
                <span class="font-medium">${totalItems}</span> teams
            </div>
            <div class="flex space-x-2">
                <button 
                    onclick="DashboardPage.changePage('${stage}', ${currentPage - 1})"
                    ${currentPage === 1 ? 'disabled' : ''}
                    class="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}"
                >
                    Previous
                </button>
                ${Array.from({length: totalPages}, (_, i) => i + 1).map(page => `
                    <button 
                        onclick="DashboardPage.changePage('${stage}', ${page})"
                        class="px-3 py-1 border rounded-md text-sm font-medium ${page === currentPage ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
                    >
                        ${page}
                    </button>
                `).join('')}
                <button 
                    onclick="DashboardPage.changePage('${stage}', ${currentPage + 1})"
                    ${currentPage === totalPages ? 'disabled' : ''}
                    class="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}"
                >
                    Next
                </button>
            </div>
        `;
    }

    static async changePage(stage, newPage) {
        if (stage === 'stage1') {
            DashboardPage.stage1CurrentPage = newPage;
            await DashboardPage.renderStage1Teams();
        } else {
            DashboardPage.stage2CurrentPage = newPage;
            await DashboardPage.renderStage2Teams();
        }
    }

    static renderEmptyState() {
        const tbody = document.getElementById('stage1TeamsTable');
        tbody.innerHTML = `
            <tr>
                <td colspan="2" class="px-6 py-8 text-center text-gray-500">
                    <p class="text-sm font-medium text-gray-900">Unable to load teams</p>
                    <p class="text-sm text-gray-500">Please contact the administrator</p>
                </td>
            </tr>
        `;
    }
}