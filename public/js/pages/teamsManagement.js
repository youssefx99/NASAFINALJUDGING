// Teams Management Page
class TeamsManagementPage {
    static render() {
        return `
            <div class="min-h-screen bg-gray-50 flex">
                ${Sidebar.render()}
                
                <div class="flex-1 ml-64">
                    <div class="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
                        <div class="flex justify-between items-center">
                            <h1 class="text-2xl font-bold text-gray-900">Teams Management</h1>
                            <div class="flex items-center space-x-4">
                                <button 
                                    id="deleteAllTeamsBtn"
                                    onclick="TeamsManagementPage.showDeleteAllModal()"
                                    class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center space-x-2"
                                >
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                    <span>Delete All Teams</span>
                                </button>
                                <span class="text-sm text-gray-500" id="teamsCount">Loading...</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-6">
                        <!-- Search and Filters -->
                        <div class="bg-white rounded-lg shadow mb-6 p-4">
                            <div class="flex flex-wrap gap-4 items-center">
                                <div class="flex-1 min-w-64">
                                    <input 
                                        type="text" 
                                        id="searchTeams" 
                                        placeholder="Search teams by name, challenge, solution, or stage..."
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        onkeyup="TeamsManagementPage.filterTeams()"
                                    />
                                </div>
                                <div>
                                    <select 
                                        id="filterByPanel" 
                                        class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        onchange="TeamsManagementPage.filterTeams()"
                                    >
                                        <option value="">All Panels</option>
                                        <option value="stage1">Stage 1 Panels</option>
                                        <option value="stage2">Stage 2 Panels</option>
                                        <option value="unassigned">Unassigned</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Teams Table -->
                        <div class="bg-white rounded-lg shadow overflow-hidden">
                            <div class="overflow-x-auto">
                                <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Name</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Challenge</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solution</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Panel Assignments</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="teamsTableBody" class="bg-white divide-y divide-gray-200">
                                        <!-- Teams will be loaded here -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Delete Confirmation Modal -->
            <div id="deleteModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden z-50">
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="bg-white rounded-lg max-w-md w-full">
                        <div class="px-6 py-4 border-b border-gray-200">
                            <h3 class="text-lg font-medium text-gray-900">Delete Team</h3>
                        </div>
                        <div class="p-6">
                            <p class="text-gray-600 mb-4">Are you sure you want to delete this team? This action cannot be undone.</p>
                            <div class="flex justify-end space-x-3">
                                <button 
                                    onclick="TeamsManagementPage.hideDeleteModal()"
                                    class="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button 
                                    id="confirmDeleteBtn"
                                    class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Delete All Teams Confirmation Modal -->
            <div id="deleteAllModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden z-50">
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="bg-white rounded-lg max-w-lg w-full">
                        <div class="px-6 py-4 border-b border-gray-200">
                            <div class="flex items-center">
                                <svg class="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                </svg>
                                <h3 class="text-lg font-medium text-gray-900">⚠️ Delete ALL Teams</h3>
                            </div>
                        </div>
                        <div class="p-6">
                            <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                <p class="text-red-800 font-medium mb-2">🚨 DANGER ZONE</p>
                                <p class="text-red-700 text-sm">This will permanently delete:</p>
                                <ul class="text-red-700 text-sm mt-2 ml-4 list-disc">
                                    <li>All teams and their data</li>
                                    <li>All associated scores and judgments</li>
                                    <li>All panel assignments</li>
                                </ul>
                            </div>
                            <p class="text-gray-600 mb-4">
                                <strong>This action cannot be undone!</strong> 
                                Are you absolutely sure you want to delete all teams?
                            </p>
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    Type "DELETE ALL TEAMS" to confirm:
                                </label>
                                <input 
                                    type="text" 
                                    id="deleteAllConfirmInput"
                                    placeholder="DELETE ALL TEAMS"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    onkeyup="TeamsManagementPage.validateDeleteAllInput()"
                                />
                            </div>
                            <div class="flex justify-end space-x-3">
                                <button 
                                    onclick="TeamsManagementPage.hideDeleteAllModal()"
                                    class="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button 
                                    id="confirmDeleteAllBtn"
                                    onclick="TeamsManagementPage.deleteAllTeams()"
                                    class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    disabled
                                >
                                    🗑️ Delete All Teams
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static afterRender() {
        TeamsManagementPage.loadTeams();
        TeamsManagementPage.loadPanels();
    }

    static async loadTeams() {
        try {
            const response = await fetch('/api/teams', {
                headers: {
                    'Authorization': `Bearer ${authService.token}`
                }
            });
            
            if (response.ok) {
                const teams = await response.json();
                TeamsManagementPage.teams = teams;
                TeamsManagementPage.renderTeamsTable(teams);
                document.getElementById('teamsCount').textContent = `${teams.length} teams`;
            }
        } catch (error) {
            console.error('Failed to load teams:', error);
        }
    }

    static async loadPanels() {
        try {
            const response = await fetch('/api/panels', {
                headers: {
                    'Authorization': `Bearer ${authService.token}`
                }
            });
            
            if (response.ok) {
                const panels = await response.json();
                TeamsManagementPage.panels = panels;
            }
        } catch (error) {
            console.error('Failed to load panels:', error);
        }
    }

    static renderTeamsTable(teams) {
        const tbody = document.getElementById('teamsTableBody');
        
        if (teams.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                        <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                        <p>No teams found</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = teams.map(team => TeamsManagementPage.renderTeamRow(team)).join('');
    }

    static renderTeamRow(team) {
        const stage1Panel = TeamsManagementPage.getTeamPanel(team._id, 1);
        const stage2Panel = TeamsManagementPage.getTeamPanel(team._id, 2);
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                    <div class="text-sm font-medium text-gray-900">${team.name}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">${team.challenge}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-600">${team.actualSolution || 'No solution provided'}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="space-y-1">
                        <div class="text-xs">
                            <span class="font-medium">Stage 1:</span> 
                            ${stage1Panel ? `<span class="text-blue-600">${stage1Panel.name}</span>` : '<span class="text-gray-400">Not assigned</span>'}
                        </div>
                        <div class="text-xs">
                            <span class="font-medium">Stage 2:</span> 
                            ${stage2Panel ? `<span class="text-purple-600">${stage2Panel.name}</span>` : '<span class="text-gray-400">Not assigned</span>'}
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <button 
                        onclick="router.navigate('/admin/teams/${team._id}')"
                        class="text-blue-600 hover:text-blue-900 mr-3"
                    >
                        View
                    </button>
                    <button 
                        onclick="TeamsManagementPage.deleteTeam('${team._id}', '${team.name}')"
                        class="text-red-600 hover:text-red-900"
                    >
                        Delete
                    </button>
                </td>
            </tr>
        `;
    }

    static getTeamPanel(teamId, stage) {
        if (!TeamsManagementPage.panels) return null;
        return TeamsManagementPage.panels.find(panel => 
            panel.stage === stage && panel.teams?.includes(teamId)
        );
    }


    static filterTeams() {
        const searchTerm = document.getElementById('searchTeams').value.toLowerCase();
        const panelFilter = document.getElementById('filterByPanel').value;
        
        if (!TeamsManagementPage.teams) return;
        
        let filteredTeams = TeamsManagementPage.teams.filter(team => {
            const stage1Panel = TeamsManagementPage.getTeamPanel(team._id, 1);
            const stage2Panel = TeamsManagementPage.getTeamPanel(team._id, 2);
            
            const matchesSearch = 
                team.name.toLowerCase().includes(searchTerm) ||
                team.challenge.toLowerCase().includes(searchTerm) ||
                (team.actualSolution && team.actualSolution.toLowerCase().includes(searchTerm)) ||
                team.leaderName.toLowerCase().includes(searchTerm) ||
                team.leaderEmail.toLowerCase().includes(searchTerm) ||
                (stage1Panel && stage1Panel.name.toLowerCase().includes(searchTerm)) ||
                (stage2Panel && stage2Panel.name.toLowerCase().includes(searchTerm)) ||
                'stage1'.includes(searchTerm) ||
                'stage2'.includes(searchTerm);
            
            let matchesPanel = true;
            if (panelFilter === 'stage1') {
                matchesPanel = TeamsManagementPage.getTeamPanel(team._id, 1) !== null;
            } else if (panelFilter === 'stage2') {
                matchesPanel = TeamsManagementPage.getTeamPanel(team._id, 2) !== null;
            } else if (panelFilter === 'unassigned') {
                matchesPanel = !TeamsManagementPage.getTeamPanel(team._id, 1) && !TeamsManagementPage.getTeamPanel(team._id, 2);
            }
            
            return matchesSearch && matchesPanel;
        });
        
        TeamsManagementPage.renderTeamsTable(filteredTeams);
    }


    static deleteTeam(teamId, teamName) {
        document.getElementById('deleteModal').classList.remove('hidden');
        document.getElementById('confirmDeleteBtn').onclick = () => TeamsManagementPage.confirmDelete(teamId);
    }

    static async confirmDelete(teamId) {
        try {
            const response = await fetch(`/api/teams/${teamId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authService.token}`
                }
            });
            
            if (response.ok) {
                TeamsManagementPage.hideDeleteModal();
                TeamsManagementPage.loadTeams(); // Reload the table
            } else {
                alert('Failed to delete team');
            }
        } catch (error) {
            console.error('Failed to delete team:', error);
            alert('Failed to delete team');
        }
    }

    static hideDeleteModal() {
        document.getElementById('deleteModal').classList.add('hidden');
    }

    // Delete All Teams functionality
    static showDeleteAllModal() {
        document.getElementById('deleteAllModal').classList.remove('hidden');
        document.getElementById('deleteAllConfirmInput').value = '';
        document.getElementById('confirmDeleteAllBtn').disabled = true;
    }

    static hideDeleteAllModal() {
        document.getElementById('deleteAllModal').classList.add('hidden');
        document.getElementById('deleteAllConfirmInput').value = '';
        document.getElementById('confirmDeleteAllBtn').disabled = true;
    }

    static validateDeleteAllInput() {
        const input = document.getElementById('deleteAllConfirmInput');
        const confirmBtn = document.getElementById('confirmDeleteAllBtn');
        
        if (input.value === 'DELETE ALL TEAMS') {
            confirmBtn.disabled = false;
            confirmBtn.classList.remove('disabled:bg-gray-400');
            confirmBtn.classList.add('bg-red-600', 'hover:bg-red-700');
        } else {
            confirmBtn.disabled = true;
            confirmBtn.classList.add('disabled:bg-gray-400');
            confirmBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
        }
    }

    static async deleteAllTeams() {
        const confirmBtn = document.getElementById('confirmDeleteAllBtn');
        
        // Show loading state
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Deleting...
        `;

        try {
            const response = await fetch('/api/teams', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authService.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (response.ok) {
                TeamsManagementPage.hideDeleteAllModal();
                
                // Show success message
                alert(`✅ Successfully deleted ${result.deletedCount} teams and all associated data!`);
                
                // Reload the teams table
                TeamsManagementPage.loadTeams();
            } else {
                throw new Error(result.message || 'Failed to delete all teams');
            }
        } catch (error) {
            console.error('Failed to delete all teams:', error);
            alert(`❌ Failed to delete all teams: ${error.message}`);
            
            // Reset button state
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '🗑️ Delete All Teams';
        }
    }
}
