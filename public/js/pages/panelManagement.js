// Panel Management Page
class PanelManagementPage {
    static render() {
        return `
            <div class="min-h-screen bg-gray-50 flex">
                ${Sidebar.render()}
                
                <div class="flex-1 ml-64">
                    <div class="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
                        <div class="flex justify-between items-center">
                            <h1 class="text-2xl font-bold text-gray-900">Panel Management</h1>
                            <button 
                                onclick="PanelManagementPage.showCreateModal()"
                                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                            >
                                Create New Panel
                            </button>
                        </div>
                    </div>
                    
                    <div class="p-6 space-y-8">
                        <!-- Stage 1 Panels -->
                        <div class="bg-white rounded-lg shadow">
                            <div class="px-6 py-4 border-b border-gray-200">
                                <div class="flex justify-between items-center">
                                    <h2 class="text-xl font-semibold text-gray-900">Stage 1 Panels</h2>
                                    <span class="text-sm text-gray-500" id="stage1Count">0 panels</span>
                                </div>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Panel Name</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Judges</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teams</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="stage1PanelsTable" class="bg-white divide-y divide-gray-200">
                                        <!-- Stage 1 panels will be loaded here -->
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Stage 2 Panels -->
                        <div class="bg-white rounded-lg shadow">
                            <div class="px-6 py-4 border-b border-gray-200">
                                <div class="flex justify-between items-center">
                                    <h2 class="text-xl font-semibold text-gray-900">Stage 2 Panels</h2>
                                    <span class="text-sm text-gray-500" id="stage2Count">0 panels</span>
                                </div>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Panel Name</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Judges</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teams</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="stage2PanelsTable" class="bg-white divide-y divide-gray-200">
                                        <!-- Stage 2 panels will be loaded here -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Create/Edit Panel Modal -->
            <div id="panelModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden z-50">
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
                        <div class="px-6 py-4 border-b border-gray-200">
                            <h3 id="modalTitle" class="text-lg font-medium text-gray-900">Create New Panel</h3>
                        </div>
                        <form id="panelForm" class="p-6 space-y-6">
                            <input type="hidden" id="panelId" />
                            
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label for="panelName" class="block text-sm font-medium text-gray-700 mb-2">Panel Name</label>
                                    <input 
                                        type="text" 
                                        id="panelName" 
                                        required 
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., Panel A"
                                    />
                                </div>
                                
                                <div>
                                    <label for="stageNumber" class="block text-sm font-medium text-gray-700 mb-2">Stage Number</label>
                                    <select 
                                        id="stageNumber" 
                                        required
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Stage</option>
                                        <option value="1">Stage 1</option>
                                        <option value="2">Stage 2</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Assign Judges</label>
                                <div id="judgesCheckboxes" class="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                                    <!-- Judge checkboxes will be loaded here -->
                                </div>
                            </div>
                            
                            <div>
                                <div class="flex items-center justify-between mb-2">
                                    <label class="block text-sm font-medium text-gray-700">Assign Teams</label>
                                    <button 
                                        type="button"
                                        id="autoAssignBtn"
                                        onclick="PanelManagementPage.showAutoAssignModal()"
                                        class="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                                    >
                                        Auto-Assign by Panel Number
                                    </button>
                                </div>
                                <div id="teamsCheckboxes" class="max-h-96 overflow-y-auto border border-gray-300 rounded-lg">
                                    <!-- Team checkboxes table will be loaded here -->
                                </div>
                            </div>
                            
                            <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                <button 
                                    type="button" 
                                    onclick="PanelManagementPage.hideModal()"
                                    class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                                >
                                    Save Panel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Auto-Assign Modal -->
            <div id="autoAssignModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden z-50">
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="bg-white rounded-lg max-w-md w-full">
                        <div class="px-6 py-4 border-b border-gray-200 bg-purple-50">
                            <h3 class="text-lg font-medium text-gray-900">Auto-Assign by Panel Number</h3>
                        </div>
                        <div class="p-6">
                            <p class="text-sm text-gray-600 mb-4">Select a panel number to automatically assign all teams with that panel number:</p>
                            <div id="panelNumbersList" class="space-y-2 max-h-96 overflow-y-auto">
                                <!-- Panel numbers will be loaded here -->
                            </div>
                        </div>
                        <div class="px-6 py-4 border-t border-gray-200 flex justify-end">
                            <button 
                                type="button" 
                                onclick="PanelManagementPage.hideAutoAssignModal()"
                                class="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static afterRender() {
        PanelManagementPage.loadPanels();
        PanelManagementPage.loadJudges();
        PanelManagementPage.loadTeams();
        PanelManagementPage.setupEventListeners();
        
        // Auto-refresh every 5 seconds
        if (window.panelRefreshInterval) {
            clearInterval(window.panelRefreshInterval);
        }
        window.panelRefreshInterval = setInterval(() => {
            PanelManagementPage.loadPanels();
        }, 5000); // 5 seconds
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
                PanelManagementPage.renderPanelsGrid(panels);
            }
        } catch (error) {
            console.error('Failed to load panels:', error);
        }
    }

    static async loadJudges() {
        try {
            const response = await fetch('/api/users/judges', {
                headers: {
                    'Authorization': `Bearer ${authService.token}`
                }
            });
            
            if (response.ok) {
                const judges = await response.json();
                PanelManagementPage.judges = judges;
            }
        } catch (error) {
            console.error('Failed to load judges:', error);
        }
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
                PanelManagementPage.teams = teams;
            }
        } catch (error) {
            console.error('Failed to load teams:', error);
        }
    }

    static renderPanelsGrid(panels) {
        // Separate panels by stage
        const stage1Panels = panels.filter(p => p.stage === 1 || p.stage === '1');
        const stage2Panels = panels.filter(p => p.stage === 2 || p.stage === '2');
        
        // Update counts
        document.getElementById('stage1Count').textContent = `${stage1Panels.length} panel${stage1Panels.length !== 1 ? 's' : ''}`;
        document.getElementById('stage2Count').textContent = `${stage2Panels.length} panel${stage2Panels.length !== 1 ? 's' : ''}`;
        
        // Render Stage 1 panels
        const stage1Table = document.getElementById('stage1PanelsTable');
        if (stage1Panels.length === 0) {
            stage1Table.innerHTML = `
                <tr>
                    <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                        <svg class="mx-auto h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p class="text-sm">No Stage 1 panels created yet</p>
                    </td>
                </tr>
            `;
        } else {
            stage1Table.innerHTML = stage1Panels.map(panel => PanelManagementPage.renderPanelRow(panel)).join('');
        }
        
        // Render Stage 2 panels
        const stage2Table = document.getElementById('stage2PanelsTable');
        if (stage2Panels.length === 0) {
            stage2Table.innerHTML = `
                <tr>
                    <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                        <svg class="mx-auto h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p class="text-sm">No Stage 2 panels created yet</p>
                    </td>
                </tr>
            `;
        } else {
            stage2Table.innerHTML = stage2Panels.map(panel => PanelManagementPage.renderPanelRow(panel)).join('');
        }
    }

    static renderPanelRow(panel) {
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${panel.name}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">
                        ${panel.judges?.length ? `<span class="font-medium">${panel.judges.length}</span> judge${panel.judges.length !== 1 ? 's' : ''}` : '<span class="text-gray-400">No judges</span>'}
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                        ${panel.judges?.length ? PanelManagementPage.getJudgeNames(panel.judges) : ''}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">
                        ${panel.teams?.length ? `<span class="font-medium">${panel.teams.length}</span> team${panel.teams.length !== 1 ? 's' : ''}` : '<span class="text-gray-400">No teams</span>'}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <button 
                        onclick="PanelManagementPage.editPanel('${panel._id}')"
                        class="text-blue-600 hover:text-blue-900 mr-3"
                    >
                        Edit
                    </button>
                    <button 
                        onclick="PanelManagementPage.deletePanel('${panel._id}')"
                        class="text-red-600 hover:text-red-900"
                    >
                        Delete
                    </button>
                </td>
            </tr>
        `;
    }

    static getJudgeNames(judgeIds) {
        const judges = PanelManagementPage.judges || [];
        const names = judgeIds.map(id => {
            const judge = judges.find(j => j._id === id);
            return judge ? judge.name : 'Unknown';
        });
        return names.join(', ');
    }

    static populateJudgesCheckboxes(selectedJudges = []) {
        const container = document.getElementById('judgesCheckboxes');
        const judges = PanelManagementPage.judges || [];
        
        container.innerHTML = judges.map(judge => `
            <label class="flex items-center space-x-2">
                <input 
                    type="checkbox" 
                    value="${judge._id}" 
                    ${selectedJudges.includes(judge._id) ? 'checked' : ''}
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span class="text-sm text-gray-700">${judge.name} (${judge.email})</span>
            </label>
        `).join('');
    }

    static populateTeamsCheckboxes(selectedTeams = []) {
        const container = document.getElementById('teamsCheckboxes');
        const teams = PanelManagementPage.teams || [];
        
        container.innerHTML = `
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-12">
                            <input 
                                type="checkbox" 
                                id="selectAllTeams"
                                onchange="PanelManagementPage.toggleAllTeams(this.checked)"
                                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                        </th>
                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Team Name</th>
                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Challenge</th>
                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Panel Number</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${teams.map(team => `
                        <tr class="hover:bg-gray-50">
                            <td class="px-3 py-2">
                                <input 
                                    type="checkbox" 
                                    value="${team._id}" 
                                    ${selectedTeams.includes(team._id) ? 'checked' : ''}
                                    class="team-checkbox rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                            </td>
                            <td class="px-3 py-2 text-sm text-gray-900">${team.name}</td>
                            <td class="px-3 py-2 text-sm text-gray-600">${team.challenge}</td>
                            <td class="px-3 py-2 text-sm text-gray-600">${team.panelNumber || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    static toggleAllTeams(checked) {
        const checkboxes = document.querySelectorAll('.team-checkbox');
        checkboxes.forEach(cb => cb.checked = checked);
    }

    static setupEventListeners() {
        const form = document.getElementById('panelForm');
        form.addEventListener('submit', PanelManagementPage.handleSubmit);
    }

    static showCreateModal() {
        document.getElementById('modalTitle').textContent = 'Create New Panel';
        document.getElementById('panelForm').reset();
        document.getElementById('panelId').value = '';
        
        // Hide auto-assign button initially
        document.getElementById('autoAssignBtn').classList.add('hidden');
        
        // Add stage change listener
        document.getElementById('stageNumber').addEventListener('change', function() {
            PanelManagementPage.toggleAutoAssignButton(this.value);
        });
        
        PanelManagementPage.populateJudgesCheckboxes();
        PanelManagementPage.populateTeamsCheckboxes();
        document.getElementById('panelModal').classList.remove('hidden');
    }

    static hideModal() {
        document.getElementById('panelModal').classList.add('hidden');
    }

    static async editPanel(panelId) {
        try {
            const response = await fetch(`/api/panels/${panelId}`, {
                headers: {
                    'Authorization': `Bearer ${authService.token}`
                }
            });
            
            if (response.ok) {
                const panel = await response.json();
                document.getElementById('modalTitle').textContent = 'Edit Panel';
                document.getElementById('panelId').value = panel._id;
                document.getElementById('panelName').value = panel.name;
                document.getElementById('stageNumber').value = panel.stage;
                
                // Show/hide auto-assign button based on stage
                PanelManagementPage.toggleAutoAssignButton(panel.stage);
                
                PanelManagementPage.populateJudgesCheckboxes(panel.judges || []);
                PanelManagementPage.populateTeamsCheckboxes(panel.teams || []);
                
                // Add stage change listener
                document.getElementById('stageNumber').addEventListener('change', function() {
                    PanelManagementPage.toggleAutoAssignButton(this.value);
                });
                
                document.getElementById('panelModal').classList.remove('hidden');
            }
        } catch (error) {
            console.error('Failed to load panel:', error);
        }
    }

    static toggleAutoAssignButton(stage) {
        const autoAssignBtn = document.getElementById('autoAssignBtn');
        if (stage == 1 || stage === '1') {
            autoAssignBtn.classList.remove('hidden');
        } else {
            autoAssignBtn.classList.add('hidden');
        }
    }

    static showAutoAssignModal() {
        const teams = PanelManagementPage.teams || [];
        
        // Extract unique panel numbers
        const panelNumbers = [...new Set(teams.map(t => t.panelNumber).filter(p => p && p.trim()))];
        
        const container = document.getElementById('panelNumbersList');
        container.innerHTML = panelNumbers.length > 0 ? panelNumbers.map(panelNumber => `
            <button 
                type="button"
                onclick="PanelManagementPage.autoAssignByPanelNumber('${panelNumber.replace(/'/g, "\\'")}')"
                class="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors"
            >
                <div class="flex items-center justify-between">
                    <span class="font-medium text-gray-900">${panelNumber}</span>
                    <span class="text-sm text-gray-500">${teams.filter(t => t.panelNumber === panelNumber).length} teams</span>
                </div>
            </button>
        `).join('') : '<p class="text-sm text-gray-500 text-center py-4">No panel numbers found</p>';
        
        document.getElementById('autoAssignModal').classList.remove('hidden');
    }

    static hideAutoAssignModal() {
        document.getElementById('autoAssignModal').classList.add('hidden');
    }

    static autoAssignByPanelNumber(panelNumber) {
        const teams = PanelManagementPage.teams || [];
        const matchingTeams = teams.filter(t => t.panelNumber === panelNumber);
        
        // Check all matching teams
        matchingTeams.forEach(team => {
            const checkbox = document.querySelector(`.team-checkbox[value="${team._id}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
        
        // Hide modal
        PanelManagementPage.hideAutoAssignModal();
        
        // Show success message
        alert(`Auto-assigned ${matchingTeams.length} teams with panel number: ${panelNumber}`);
    }

    static async deletePanel(panelId) {
        if (confirm('Are you sure you want to delete this panel?')) {
            try {
                const response = await fetch(`/api/panels/${panelId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${authService.token}`
                    }
                });
                
                if (response.ok) {
                    PanelManagementPage.loadPanels();
                }
            } catch (error) {
                console.error('Failed to delete panel:', error);
            }
        }
    }

    static async handleSubmit(e) {
        e.preventDefault();
        
        const panelId = document.getElementById('panelId').value;
        const formData = {
            name: document.getElementById('panelName').value,
            stage: parseInt(document.getElementById('stageNumber').value),
            judges: [],
            teams: []
        };
        
        // Get selected judges
        const judgeCheckboxes = document.querySelectorAll('#judgesCheckboxes input[type="checkbox"]:checked');
        formData.judges = Array.from(judgeCheckboxes).map(cb => cb.value);
        
        // Get selected teams
        const teamCheckboxes = document.querySelectorAll('#teamsCheckboxes input[type="checkbox"]:checked');
        formData.teams = Array.from(teamCheckboxes).map(cb => cb.value);
        
        try {
            const url = panelId ? `/api/panels/${panelId}` : '/api/panels';
            const method = panelId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authService.token}`
                },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                PanelManagementPage.hideModal();
                PanelManagementPage.loadPanels();
            }
        } catch (error) {
            console.error('Failed to save panel:', error);
        }
    }
}
