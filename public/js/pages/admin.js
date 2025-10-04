// Admin Page
class AdminPage {
  static render() {
    return `
            <div class="min-h-screen bg-gray-50 flex">
                ${Sidebar.render()}
                
                <div class="flex-1 ml-64">
                    <div class="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
                        <div class="flex justify-between items-center">
                            <h1 class="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                            <div class="flex items-center space-x-4">
                                <span class="text-gray-600">Welcome, ${authService.getUser()?.name || 'Admin'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-6">
                        <!-- Quick Stats -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div class="bg-white rounded-lg shadow p-6">
                                <div class="flex items-center">
                                    <div class="p-2 bg-blue-100 rounded-lg">
                                        <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                        </svg>
                                    </div>
                                    <div class="ml-4">
                                        <p class="text-sm font-medium text-gray-600">Total Teams</p>
                                        <p class="text-2xl font-semibold text-gray-900" id="totalTeams">--</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-white rounded-lg shadow p-6">
                                <div class="flex items-center">
                                    <div class="p-2 bg-green-100 rounded-lg">
                                        <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                                        </svg>
                                    </div>
                                    <div class="ml-4">
                                        <p class="text-sm font-medium text-gray-600">Total Judges</p>
                                        <p class="text-2xl font-semibold text-gray-900" id="totalJudges">--</p>
                                    </div>
                                </div>
                            </div>
                            
<div class="bg-white rounded-xl shadow p-4 flex items-center justify-between max-w-md">

  <!-- Left Section -->
  <div class="flex items-center space-x-4">
    <!-- Icon box -->
    <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100">
      <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>
    </div>

    <!-- Stage text -->
    <div>
      <p class="text-sm text-gray-500">Current Stage</p>
      <p class="text-xl font-bold text-gray-900">Stage 1</p>
    </div>
  </div>

  <!-- Right Section -->
  <button
    onclick="router.navigate('/admin/stage2-qualify')"
    class="flex items-center gap-2 px-4 py-2 rounded-lg font-medium
           bg-gradient-to-r from-purple-600 to-blue-600 text-white
           hover:from-purple-700 hover:to-blue-700
           transition-all duration-200 shadow-sm hover:shadow-md"
  >
    🚀 <span>Manage Stage&nbsp;2</span>
  </button>

</div>

                        </div>

                        <!-- Scoring Overview -->
                        <div class="bg-white rounded-lg shadow mb-6">

                        <!-- Top N Teams -->
                        <div class="bg-white rounded-lg shadow">
                            <div class="px-6 py-4 border-b border-gray-200">
                                <div class="flex justify-between items-center">
                                    <h3 class="text-lg font-medium text-gray-900">Top Teams</h3>
                                    <div class="flex items-center space-x-4">
                                        <div class="flex items-center space-x-2">
                                            <label class="text-sm text-gray-600">Stage:</label>
                                            <select id="topTeamsStage" class="px-3 py-1 border border-gray-300 rounded-md text-sm" onchange="AdminPage.loadTopTeams()">
                                                <option value="1">Stage 1</option>
                                                <option value="2">Stage 2</option>
                                                <option value="final">Final Score</option>
                                            </select>
                                        </div>
                                        <div class="flex items-center space-x-2">
                                            <label class="text-sm text-gray-600">Top:</label>
                                            <input 
                                                type="number" 
                                                id="topTeamsCount" 
                                                value="10" 
                                                min="1" 
                                                max="50"
                                                class="w-20 px-3 py-1 border border-gray-300 rounded-md text-sm"
                                                onchange="AdminPage.loadTopTeams()"
                                            >
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="p-6">
                                <div id="topTeamsTable">
                                    <!-- Top teams will be loaded here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  static afterRender() {
    // Load team statistics
    AdminPage.loadStats();
    AdminPage.loadScoringOverview();
    AdminPage.loadTopTeams();

    // Setup event listeners for form controls
    AdminPage.setupEventListeners();

    // Auto-refresh every 10 seconds
    if (window.adminRefreshInterval) {
      clearInterval(window.adminRefreshInterval);
    }

    window.adminRefreshInterval = setInterval(() => {
      AdminPage.loadScoringOverview();
      AdminPage.loadTopTeams();
    }, 10000); // 10 seconds
  }

  static setupEventListeners() {
    // Remove existing event listeners to prevent duplicates
    const stageSelect = document.getElementById('topTeamsStage');
    const countInput = document.getElementById('topTeamsCount');

    if (stageSelect) {
      // Remove any existing listeners
      stageSelect.removeEventListener('change', AdminPage.handleStageChange);
      // Add new listener
      stageSelect.addEventListener('change', AdminPage.handleStageChange);
    }

    if (countInput) {
      // Remove any existing listeners
      countInput.removeEventListener('change', AdminPage.handleCountChange);
      // Add new listener
      countInput.addEventListener('change', AdminPage.handleCountChange);
    }
  }

  static handleStageChange() {
    AdminPage.loadTopTeams();
  }

  static handleCountChange() {
    AdminPage.loadTopTeams();
  }

  static async loadStats() {
    try {
      // Load teams count
      const teamsResponse = await fetch('/api/teams/count', {
        headers: {
          Authorization: `Bearer ${authService.token}`,
        },
      });

      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json();
        document.getElementById('totalTeams').textContent =
          teamsData.count || 0;
      }

      // Load judges count
      const judgesResponse = await fetch('/api/users/judges', {
        headers: {
          Authorization: `Bearer ${authService.token}`,
        },
      });

      if (judgesResponse.ok) {
        const judgesData = await judgesResponse.json();
        console.log('Judges data:', judgesData);
        const judgesCount = judgesData.length;
        console.log('Total judges count:', judgesCount);
        document.getElementById('totalJudges').textContent = judgesCount;
      } else {
        console.error('Failed to fetch judges:', judgesResponse.status);
        document.getElementById('totalJudges').textContent = '0';
      }
    } catch (error) {
      console.log('Could not load statistics');
    }
  }

  static async loadScoringOverview() {
    try {
      const response = await fetch('/api/scores/overview', {
        headers: {
          Authorization: `Bearer ${authService.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Stage 1
        document.getElementById('stage1Scored').textContent =
          data.stage1?.scored || 0;
        document.getElementById('stage1NotScored').textContent =
          data.stage1?.notScored || 0;
        document.getElementById('stage1Total').textContent =
          data.stage1?.total || 0;

        // Stage 2
        document.getElementById('stage2Scored').textContent =
          data.stage2?.scored || 0;
        document.getElementById('stage2NotScored').textContent =
          data.stage2?.notScored || 0;
        document.getElementById('stage2Total').textContent =
          data.stage2?.total || 0;
      }
    } catch (error) {
      console.log('Could not load scoring overview');
    }
  }

  static async loadTopTeams() {
    const stage = document.getElementById('topTeamsStage')?.value || 1;
    const count = document.getElementById('topTeamsCount')?.value || 10;

    try {
      if (stage === 'final') {
        // Calculate final scores
        await AdminPage.loadFinalScores(count);
      } else {
        const response = await fetch(
          `/api/scores/top?stage=${stage}&limit=${count}`,
          {
            headers: {
              Authorization: `Bearer ${authService.token}`,
            },
          },
        );

        if (response.ok) {
          const teams = await response.json();
          AdminPage.renderTopTeams(teams, stage);
        }
      }
    } catch (error) {
      console.log('Could not load top teams');
    }
  }

  static async loadFinalScores(count) {
    try {
      // Get all teams
      const teamsResponse = await fetch('/api/teams', {
        headers: { Authorization: `Bearer ${authService.token}` },
      });

      if (!teamsResponse.ok) return;

      const teams = await teamsResponse.json();
      const finalScores = [];

      for (const team of teams) {
        // Get Stage 1 average score
        const stage1Response = await fetch(
          `/api/scores/team/${team._id}/stage/1`,
          {
            headers: { Authorization: `Bearer ${authService.token}` },
          },
        );

        let stage1Score = 0;
        if (stage1Response.ok) {
          const stage1Scores = await stage1Response.json();
          if (stage1Scores.length > 0) {
            const total = stage1Scores.reduce(
              (sum, s) => sum + s.totalScore,
              0,
            );
            stage1Score = total / stage1Scores.length;
          }
        }

        // Get Stage 2 scores (best award score: MAX of per-award averages)
        const stage2Response = await fetch(
          `/api/scores/team/${team._id}/stage/2`,
          {
            headers: { Authorization: `Bearer ${authService.token}` },
          },
        );

        let bestStage2Score = 0;
        let bestAward = 'N/A';
        if (stage2Response.ok) {
          const stage2Scores = await stage2Response.json();
          if (stage2Scores.length > 0) {
            // Build judge -> awardType map from Stage 2 panels (fallback if awardType missing)
            let judgeAwardMap = {};
            try {
              const panelsRes = await fetch('/api/panels', {
                headers: { Authorization: `Bearer ${authService.token}` },
              });
              if (panelsRes.ok) {
                const panels = await panelsRes.json();
                panels
                  .filter((p) => p.stage === 2)
                  .forEach((p) => {
                    const award = p.awardType || 'Unknown Award';
                    (p.judges || []).forEach((j) => {
                      const id =
                        typeof j === 'string' ? j : j?._id || j?.toString();
                      if (id) judgeAwardMap[id] = award;
                    });
                  });
              }
            } catch (e) {}

            // Group by awardType and find average per award
            const awardScores = {};
            for (const score of stage2Scores) {
              const judgeId = score.judge?._id || score.judge;
              const award =
                score.awardType || judgeAwardMap[judgeId] || 'Unknown Award';
              if (!awardScores[award]) awardScores[award] = [];
              awardScores[award].push(score.totalScore);
            }

            for (const award in awardScores) {
              const scores = awardScores[award];
              const avgScore =
                scores.reduce((sum, s) => sum + s, 0) / scores.length;
              if (avgScore > bestStage2Score) {
                bestStage2Score = avgScore;
                bestAward = award;
              }
            }
          }
        }

        // Calculate final score: 60% Stage 1 + 40% Stage 2 (best panel)
        const finalScore = 0.6 * stage1Score + 0.4 * bestStage2Score;
        finalScores.push({
          name: team.name,
          challenge: team.challenge,
          stage1Score: stage1Score,
          stage2BestScore: bestStage2Score,
          bestAward: bestAward,
          finalScore: finalScore,
          hasStage1Score: stage1Score > 0,
          hasStage2Score: bestStage2Score > 0,
          hasAnyScore: stage1Score > 0 || bestStage2Score > 0,
        });
      }

      // Sort: teams with scores first (by final score desc), then teams without scores
      finalScores.sort((a, b) => {
        if (a.hasAnyScore && !b.hasAnyScore) return -1;
        if (!a.hasAnyScore && b.hasAnyScore) return 1;
        if (a.hasAnyScore && b.hasAnyScore) return b.finalScore - a.finalScore;
        return 0; // Both unscored, maintain original order
      });

      // Take top N
      const topTeams = finalScores.slice(0, parseInt(count));

      AdminPage.renderFinalScores(topTeams);
    } catch (error) {
      console.error('Failed to load final scores:', error);
    }
  }

  static renderTopTeams(teams) {
    const container = document.getElementById('topTeamsTable');

    if (!teams || teams.length === 0) {
      container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <p class="text-sm">No teams available</p>
                </div>
            `;
      return;
    }

    container.innerHTML = `
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Name</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Challenge</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Score</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Judges</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${teams
                      .map(
                        (team, index) => `
                        <tr class="${team.hasScore && index < 3 ? 'bg-yellow-50' : !team.hasScore ? 'bg-gray-50' : ''}">
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="text-sm font-bold ${team.hasScore && index === 0 ? 'text-yellow-600' : team.hasScore && index === 1 ? 'text-gray-500' : team.hasScore && index === 2 ? 'text-orange-600' : 'text-gray-900'}">
                                    ${team.hasScore ? (index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '#' + (index + 1)) : '--'}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm font-medium text-gray-900">${team.name}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm text-gray-900">${team.challenge}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                ${
                                  team.hasScore
                                    ? `<div class="text-sm font-bold text-blue-600">${team.averageScore.toFixed(2)}</div>`
                                    : `<div class="text-sm text-gray-400">No Score</div>`
                                }
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                ${
                                  team.hasScore
                                    ? `<div class="text-sm text-gray-500">${team.judgeCount} judge(s)</div>`
                                    : `<div class="text-sm text-gray-400">--</div>`
                                }
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                ${
                                  team.hasScore
                                    ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Scored</span>`
                                    : `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Pending</span>`
                                }
                            </td>
                        </tr>
                    `,
                      )
                      .join('')}
                </tbody>
            </table>
        `;
  }

  static renderFinalScores(teams) {
    const container = document.getElementById('topTeamsTable');

    if (!teams || teams.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <p class="text-sm">No teams available</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Name</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Challenge</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage 1 (60%)</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage 2 Best (40%)</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Best Award</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Final Score</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${teams
            .map(
              (team, index) => `
            <tr class="${team.hasAnyScore && index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : !team.hasAnyScore ? 'bg-gray-50' : ''}">
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm font-bold ${team.hasAnyScore && index === 0 ? 'text-yellow-600' : team.hasAnyScore && index === 1 ? 'text-gray-500' : team.hasAnyScore && index === 2 ? 'text-orange-600' : 'text-gray-900'}">
                  ${team.hasAnyScore ? (index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '#' + (index + 1)) : '--'}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm font-medium text-gray-900">${team.name}</div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900">${team.challenge}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                ${
                  team.hasStage1Score
                    ? `<div class="text-sm text-blue-600 font-medium">${team.stage1Score.toFixed(2)}</div>`
                    : `<div class="text-sm text-gray-400">No Score</div>`
                }
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                ${
                  team.hasStage2Score
                    ? `<div class="text-sm text-purple-600 font-medium">${team.stage2BestScore.toFixed(2)}</div>`
                    : `<div class="text-sm text-gray-400">No Score</div>`
                }
              </td>
              <td class="px-6 py-4">
                <div class="text-xs text-gray-600">${team.hasStage2Score ? team.bestAward : 'N/A'}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                ${
                  team.hasAnyScore
                    ? `<div class="text-lg font-bold text-green-600">${team.finalScore.toFixed(2)}</div>`
                    : `<div class="text-sm text-gray-400">No Score</div>`
                }
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                ${
                  team.hasAnyScore
                    ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Scored</span>`
                    : `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Pending</span>`
                }
              </td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    `;
  }
}
