// Judge Detail Page
class JudgeDetailPage {
    static render() {
        return `
            <div class="min-h-screen bg-gray-50 flex">
                ${Sidebar.render()}
                
                <div class="flex-1 ml-64">
                    <div class="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center space-x-4">
                                <button onclick="router.navigate('/admin/judges')" class="text-gray-600 hover:text-gray-900">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                                    </svg>
                                </button>
                                <h1 id="judgeName" class="text-2xl font-bold text-gray-900">Loading...</h1>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-6">
                        <div id="judgeContent">
                            <div class="text-center py-12">
                                <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                <p class="mt-4 text-gray-600">Loading judge details...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static afterRender() {
        const pathParts = window.location.pathname.split('/');
        const judgeId = pathParts[pathParts.length - 1];
        JudgeDetailPage.loadJudgeDetails(judgeId);
    }

    static async loadJudgeDetails(judgeId) {
        try {
            // Load judge data
            const judgeResponse = await fetch(`/api/users/${judgeId}`, {
                headers: { 'Authorization': `Bearer ${authService.token}` }
            });

            if (!judgeResponse.ok) {
                throw new Error('Judge not found');
            }

            const judge = await judgeResponse.json();
            
            // Load all panels to find assignments
            const panelsResponse = await fetch('/api/panels', {
                headers: { 'Authorization': `Bearer ${authService.token}` }
            });
            
            let stage1Panels = [];
            let stage2Panels = [];
            
            if (panelsResponse.ok) {
                const panels = await panelsResponse.json();
                stage1Panels = panels.filter(panel => 
                    panel.stage === 1 && 
                    panel.judges?.some(j => {
                        const jId = typeof j === 'string' ? j : j._id;
                        return jId === judgeId;
                    })
                );
                stage2Panels = panels.filter(panel => 
                    panel.stage === 2 && 
                    panel.judges?.some(j => {
                        const jId = typeof j === 'string' ? j : j._id;
                        return jId === judgeId;
                    })
                );
            }

            // Load all scores by this judge
            const scoresResponse = await fetch(`/api/scores/judge/${judgeId}`, {
                headers: { 'Authorization': `Bearer ${authService.token}` }
            });

            let scores = [];
            if (scoresResponse.ok) {
                scores = await scoresResponse.json();
            }

            // Load all teams to get names for pending teams
            const teamsResponse = await fetch('/api/teams', {
                headers: { 'Authorization': `Bearer ${authService.token}` }
            });

            let allTeams = [];
            if (teamsResponse.ok) {
                allTeams = await teamsResponse.json();
            }

            // Update page title
            document.getElementById('judgeName').textContent = judge.name;

            // Render judge details
            JudgeDetailPage.renderJudgeDetails(judge, stage1Panels, stage2Panels, scores, allTeams);

        } catch (error) {
            console.error('Failed to load judge details:', error);
            document.getElementById('judgeContent').innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <svg class="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    <h3 class="text-lg font-medium text-red-900 mb-2">Failed to Load Judge</h3>
                    <p class="text-red-700">${error.message}</p>
                    <button onclick="router.navigate('/admin/judges')" class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        Back to Judges
                    </button>
                </div>
            `;
        }
    }

    static renderJudgeDetails(judge, stage1Panels, stage2Panels, scores, allTeams) {
        // Separate scores by stage
        const stage1Scores = scores.filter(s => s.stage === 1);
        const stage2Scores = scores.filter(s => s.stage === 2);

        // Get all teams from panels
        const stage1Teams = stage1Panels.flatMap(p => p.teams || []);
        const stage2Teams = stage2Panels.flatMap(p => p.teams || []);

        // Find scored and unscored teams
        const stage1ScoredTeamIds = stage1Scores.map(s => {
            const teamId = typeof s.team === 'string' ? s.team : s.team?._id;
            return teamId;
        });
        const stage2ScoredTeamIds = stage2Scores.map(s => {
            const teamId = typeof s.team === 'string' ? s.team : s.team?._id;
            return teamId;
        });

        document.getElementById('judgeContent').innerHTML = `
            <div class="space-y-6">
                <!-- Judge Info Card -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">Judge Information</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="text-sm font-medium text-gray-500">Name</label>
                            <p class="text-gray-900 font-medium">${judge.name}</p>
                        </div>
                        <div>
                            <label class="text-sm font-medium text-gray-500">Email</label>
                            <p class="text-gray-900">${judge.email}</p>
                        </div>
                        <div>
                            <label class="text-sm font-medium text-gray-500">Role</label>
                            <p class="text-gray-900 capitalize">${judge.role}</p>
                        </div>
                        <div>
                            <label class="text-sm font-medium text-gray-500">Total Scores Submitted</label>
                            <p class="text-gray-900 font-bold text-2xl">${scores.length}</p>
                        </div>
                    </div>
                </div>


                <!-- Detailed Scoring Tracking -->
                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                        <h2 class="text-lg font-bold text-gray-900">Detailed Scoring Tracking</h2>
                    </div>
                    <div class="p-6">
                        <div id="detailedScoring">
                            ${JudgeDetailPage.renderDetailedScoring(stage1Panels, stage2Panels, scores, judge._id, allTeams)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static renderDetailedScoring(stage1Panels, stage2Panels, scores, judgeId, allTeams) {
        let html = '';

        // Stage 1 Detailed Tracking
        if (stage1Panels.length > 0) {
            html += `<div class="mb-8">
                <h3 class="text-md font-bold text-blue-900 mb-4">Stage 1 Teams</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-blue-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team Name</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Panel</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">`;

            for (const panel of stage1Panels) {
                for (const teamId of (panel.teams || [])) {
                    const score = scores.find(s => {
                        const sTeamId = typeof s.team === 'string' ? s.team : s.team?._id;
                        return sTeamId === teamId && s.stage === 1;
                    });
                    const team = allTeams.find(t => t._id === teamId);
                    const teamName = score?.team?.name || team?.name || 'Unknown Team';
                    const isScored = !!score;
                    const scoreValue = score?.totalScore || 0;
                    const scoreDate = score?.createdAt ? new Date(score.createdAt).toLocaleDateString() : '-';

                    html += `<tr class="${isScored ? 'bg-green-50' : 'bg-yellow-50'}">
                        <td class="px-4 py-3 text-sm text-gray-900">${teamName}</td>
                        <td class="px-4 py-3 text-sm text-gray-600">${panel.name}</td>
                        <td class="px-4 py-3 text-sm">
                            ${isScored ? 
                                '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">✓ Scored</span>' : 
                                '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">⏳ Pending</span>'}
                        </td>
                        <td class="px-4 py-3 text-sm font-bold ${isScored ? 'text-blue-600' : 'text-gray-400'}">
                            ${isScored ? scoreValue.toFixed(2) : '-'}
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-500">${scoreDate}</td>
                    </tr>`;
                }
            }

            html += `</tbody></table></div></div>`;
        }

        // Stage 2 Detailed Tracking
        if (stage2Panels.length > 0) {
            html += `<div>
                <h3 class="text-md font-bold text-purple-900 mb-4">Stage 2 Teams</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-purple-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team Name</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Panel</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Award Type</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">`;

            for (const panel of stage2Panels) {
                for (const teamId of (panel.teams || [])) {
                    const score = scores.find(s => {
                        const sTeamId = typeof s.team === 'string' ? s.team : s.team?._id;
                        return sTeamId === teamId && s.stage === 2;
                    });
                    const team = allTeams.find(t => t._id === teamId);
                    const teamName = score?.team?.name || team?.name || 'Unknown Team';
                    const isScored = !!score;
                    const scoreValue = score?.totalScore || 0;
                    const scoreDate = score?.createdAt ? new Date(score.createdAt).toLocaleDateString() : '-';

                    html += `<tr class="${isScored ? 'bg-green-50' : 'bg-yellow-50'}">
                        <td class="px-4 py-3 text-sm text-gray-900">${teamName}</td>
                        <td class="px-4 py-3 text-sm text-gray-600">${panel.name}</td>
                        <td class="px-4 py-3 text-xs text-purple-600">${panel.awardType || 'N/A'}</td>
                        <td class="px-4 py-3 text-sm">
                            ${isScored ? 
                                '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">✓ Scored</span>' : 
                                '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">⏳ Pending</span>'}
                        </td>
                        <td class="px-4 py-3 text-sm font-bold ${isScored ? 'text-purple-600' : 'text-gray-400'}">
                            ${isScored ? scoreValue.toFixed(2) : '-'}
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-500">${scoreDate}</td>
                    </tr>`;
                }
            }

            html += `</tbody></table></div></div>`;
        }

        if (stage1Panels.length === 0 && stage2Panels.length === 0) {
            html = '<p class="text-gray-500 text-center py-8">No panel assignments found</p>';
        }

        return html;
    }
}
