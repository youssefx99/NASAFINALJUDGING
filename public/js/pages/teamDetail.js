// Team Detail Page
class TeamDetailPage {
  static render() {
    return `
            <div class="min-h-screen bg-gray-50 flex">
                ${Sidebar.render()}
                
                <div class="flex-1 ml-64">
                    <div class="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center space-x-4">
                                <button onclick="router.navigate('/admin/teams')" class="text-gray-600 hover:text-gray-900">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                                    </svg>
                                </button>
                                <h1 id="teamName" class="text-2xl font-bold text-gray-900">Loading...</h1>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-6">
                        <div id="teamContent">
                            <div class="text-center py-12">
                                <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                <p class="mt-4 text-gray-600">Loading team details...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  static afterRender() {
    const pathParts = window.location.pathname.split('/');
    const teamId = pathParts[pathParts.length - 1];
    TeamDetailPage.loadTeamDetails(teamId);
  }

  static async loadTeamDetails(teamId) {
    try {
      // Load team data
      const teamResponse = await fetch(`/api/teams/${teamId}`, {
        headers: {
          Authorization: `Bearer ${authService.token}`,
        },
      });

      if (!teamResponse.ok) {
        throw new Error('Team not found');
      }

      const team = await teamResponse.json();

      // Load panels to find assignments
      const panelsResponse = await fetch('/api/panels', {
        headers: {
          Authorization: `Bearer ${authService.token}`,
        },
      });

      let stage1Panel = null;
      let stage2Panel = null;

      if (panelsResponse.ok) {
        const panels = await panelsResponse.json();
        stage1Panel = panels.find(
          (panel) => panel.stage === 1 && panel.teams?.includes(teamId),
        );
        stage2Panel = panels.find(
          (panel) => panel.stage === 2 && panel.teams?.includes(teamId),
        );
      }

      // Update page title
      document.getElementById('teamName').textContent = team.name;

      // Render team details
      TeamDetailPage.renderTeamDetails(team, stage1Panel, stage2Panel, teamId);
    } catch (error) {
      console.error('Failed to load team details:', error);
      document.getElementById('teamContent').innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <svg class="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    <h3 class="text-lg font-medium text-red-900 mb-2">Failed to Load Team</h3>
                    <p class="text-red-700">${error.message}</p>
                    <button onclick="router.navigate('/admin/teams')" class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        Back to Teams
                    </button>
                </div>
            `;
    }
  }

  static renderTeamDetails(team, stage1Panel, stage2Panel, teamId) {
    document.getElementById('teamContent').innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Left Column - Team Information -->
                <div class="lg:col-span-2 space-y-6">
                    <!-- Basic Info Card -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <h2 class="text-xl font-bold text-gray-900 mb-4">Team Information</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="text-sm font-medium text-gray-500">Team Name</label>
                                <p class="text-gray-900 font-medium">${team.name}</p>
                            </div>
                            <div>
                                <label class="text-sm font-medium text-gray-500">Challenge</label>
                                <p class="text-gray-900">${team.challenge}</p>
                            </div>
                            <div>
                                <label class="text-sm font-medium text-gray-500">Team Leader</label>
                                <p class="text-gray-900">${team.leaderName}</p>
                            </div>
                            <div>
                                <label class="text-sm font-medium text-gray-500">Leader Email</label>
                                <p class="text-gray-900">${team.leaderEmail}</p>
                            </div>
                        </div>

                        ${
                          team.subjects && team.subjects.length > 0
                            ? `
                            <div class="mt-4">
                                <label class="text-sm font-medium text-gray-500 block mb-2">Subjects</label>
                                <div class="flex flex-wrap gap-2">
                                    ${team.subjects
                                      .map(
                                        (subject) => `
                                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                            ${subject}
                                        </span>
                                    `,
                                      )
                                      .join('')}
                                </div>
                            </div>
                        `
                            : ''
                        }
                    </div>

                    <!-- Solution Card -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <h2 class="text-xl font-bold text-gray-900 mb-4">Solution Description</h2>
                        <p class="text-gray-700 whitespace-pre-wrap">${team.actualSolution || 'No solution description provided'}</p>
                    </div>

                    <!-- Links Card -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <h2 class="text-xl font-bold text-gray-900 mb-4">Project Links</h2>
                        <div class="space-y-3">
                            ${
                              team.demoLink
                                ? `
                                <a href="${team.demoLink}" target="_blank" class="flex items-center text-blue-600 hover:text-blue-800">
                                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                    </svg>
                                    <span>Demo Video</span>
                                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                                    </svg>
                                </a>
                            `
                                : '<p class="text-gray-500">No demo link provided</p>'
                            }
                            
                            ${
                              team.proposalLink
                                ? `
                                <a href="${team.proposalLink}" target="_blank" class="flex items-center text-blue-600 hover:text-blue-800">
                                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                    <span>Project Proposal</span>
                                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                                    </svg>
                                </a>
                            `
                                : '<p class="text-gray-500">No proposal link provided</p>'
                            }
                            
                            ${
                              team.projectLink
                                ? `
                                <a href="${team.projectLink}" target="_blank" class="flex items-center text-blue-600 hover:text-blue-800">
                                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
                                    </svg>
                                    <span>Project Link</span>
                                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                                    </svg>
                                </a>
                            `
                                : '<p class="text-gray-500">No project link provided</p>'
                            }
                            
                            ${
                              team.nasaSubmitLink
                                ? `
                                <a href="${team.nasaSubmitLink}" target="_blank" class="flex items-center text-blue-600 hover:text-blue-800">
                                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                                    </svg>
                                    <span>NASA Submit Link</span>
                                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                                    </svg>
                                </a>
                            `
                                : '<p class="text-gray-500">No NASA submit link provided</p>'
                            }
                        </div>
                    </div>
                </div>

                <!-- Right Column - Panel Assignments & Scores -->
                <div class="space-y-6">
                    <!-- Stage 1 Card -->
                    <div class="bg-white rounded-lg shadow overflow-hidden">
                        <div class="bg-blue-50 px-6 py-4 border-b border-blue-100">
                            <h2 class="text-lg font-bold text-blue-900">Stage 1</h2>
                        </div>
                        <div class="p-6 space-y-4">
                            <div>
                                <label class="text-sm font-medium text-gray-500 block mb-1">Panel Assignment</label>
                                ${
                                  stage1Panel
                                    ? `
                                    <div class="flex items-center text-blue-600">
                                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                        <span class="font-medium">${stage1Panel.name}</span>
                                    </div>
                                `
                                    : `
                                    <div class="flex items-center text-gray-400">
                                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
                                        </svg>
                                        <span>Not assigned</span>
                                    </div>
                                `
                                }
                            </div>

                            <div>
                                <label class="text-sm font-medium text-gray-500 block mb-1">Current Score</label>
                                <div class="text-3xl font-bold text-blue-600" id="stage1Score">
                                    <div class="inline-block animate-pulse">--</div>
                                </div>
                                <p class="text-xs text-gray-500 mt-1">Average from all judges</p>
                            </div>

                            <div id="stage1Judges" class="border-t pt-4">
                                <label class="text-sm font-medium text-gray-500 block mb-2">Individual Judge Scores</label>
                                <div class="space-y-2" id="stage1JudgesList">
                                    <p class="text-sm text-gray-400">Loading...</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Stage 2 Card -->
                    <div class="bg-white rounded-lg shadow overflow-hidden">
                        <div class="bg-purple-50 px-6 py-4 border-b border-purple-100">
                            <h2 class="text-lg font-bold text-purple-900">Stage 2</h2>
                        </div>
                        <div class="p-6 space-y-4">
                            <div>
                                <label class="text-sm font-medium text-gray-500 block mb-1">Panel Assignment</label>
                                ${
                                  stage2Panel
                                    ? `
                                    <div class="flex items-center text-purple-600">
                                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                        <span class="font-medium">${stage2Panel.name}</span>
                                    </div>
                                `
                                    : `
                                    <div class="flex items-center text-gray-400">
                                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
                                        </svg>
                                        <span>Not assigned</span>
                                    </div>
                                `
                                }
                            </div>

                            <div>
                                <label class="text-sm font-medium text-gray-500 block mb-1">Current Score</label>
                                <div class="text-3xl font-bold text-purple-600" id="stage2Score">
                                    <div class="inline-block animate-pulse">--</div>
                                </div>
                                <p class="text-xs text-gray-500 mt-1">Best panel average (MAX)</p>
                            </div>

                            <div id="stage2Judges" class="border-t pt-4">
                                <label class="text-sm font-medium text-gray-500 block mb-2">Individual Judge Scores</label>
                                <div class="space-y-2" id="stage2JudgesList">
                                    <p class="text-sm text-gray-400">Loading...</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Total Score Card -->
                    <div class="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow p-6 text-white">
                        <label class="text-sm font-medium opacity-90 block mb-1">Total Combined Score</label>
                        <div class="text-4xl font-bold" id="totalScore">
                            <div class="inline-block animate-pulse">--</div>
                        </div>
                        <p class="text-xs opacity-75 mt-2">Stage 1 + Stage 2</p>
                    </div>
                </div>
            </div>
        `;

    // Load scores after rendering
    TeamDetailPage.loadScores(teamId);
  }

  static async loadScores(teamId) {
    try {
      let stage1Score = 0;
      let stage2Score = 0;

      // Load Stage 1 scores
      const stage1Response = await fetch(`/api/scores/team/${teamId}/stage/1`, {
        headers: {
          Authorization: `Bearer ${authService.token}`,
        },
      });

      if (stage1Response.ok) {
        const stage1Scores = await stage1Response.json();

        if (stage1Scores.length > 0) {
          const total = stage1Scores.reduce(
            (sum, score) => sum + score.totalScore,
            0,
          );
          stage1Score = total / stage1Scores.length;

          document.getElementById('stage1Score').innerHTML =
            stage1Score.toFixed(2);

          // Display individual judge scores
          document.getElementById('stage1JudgesList').innerHTML = stage1Scores
            .map(
              (score) => `
                        <div class="flex justify-between items-center text-sm">
                            <span class="text-gray-600">${score.judge?.name || 'Unknown Judge'}</span>
                            <span class="font-medium text-blue-600">${score.totalScore.toFixed(2)}</span>
                        </div>
                    `,
            )
            .join('');
        } else {
          document.getElementById('stage1Score').innerHTML = '0.00';
          document.getElementById('stage1JudgesList').innerHTML =
            '<p class="text-sm text-gray-400">No scores yet</p>';
        }
      } else {
        document.getElementById('stage1Score').innerHTML = '0.00';
        document.getElementById('stage1JudgesList').innerHTML =
          '<p class="text-sm text-red-400">Error loading</p>';
      }

      // Load Stage 2 scores
      const stage2Response = await fetch(`/api/scores/team/${teamId}/stage/2`, {
        headers: {
          Authorization: `Bearer ${authService.token}`,
        },
      });

      if (stage2Response.ok) {
        const stage2Scores = await stage2Response.json();

        if (stage2Scores.length > 0) {
          // Build judge -> awardType map from Stage 2 panels, used if awardType missing on score
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

          // Group scores by award type (Stage 2 awards)
          const awardScores = {};
          for (const score of stage2Scores) {
            const judgeId = score.judge?._id || score.judge;
            const award =
              score.awardType || judgeAwardMap[judgeId] || 'Unknown Award';
            if (!awardScores[award]) awardScores[award] = [];
            awardScores[award].push(score.totalScore);
          }

          // Calculate average per award and take MAX
          let maxAwardAverage = 0;
          for (const award in awardScores) {
            const scores = awardScores[award];
            const avgScore =
              scores.reduce((sum, s) => sum + s, 0) / scores.length;
            if (avgScore > maxAwardAverage) maxAwardAverage = avgScore;
          }

          stage2Score = maxAwardAverage;
          document.getElementById('stage2Score').innerHTML =
            stage2Score.toFixed(2);

          // Display individual judge scores grouped by award type
          let judgeScoresHtml = '';
          for (const award in awardScores) {
            const awardAvg =
              awardScores[award].reduce((sum, s) => sum + s, 0) /
              awardScores[award].length;
            judgeScoresHtml += `<div class="mb-3"><div class="text-xs font-semibold text-gray-500 mb-1">${award} (Avg: ${awardAvg.toFixed(2)})</div>`;
            const awardJudges = stage2Scores.filter(
              (s) =>
                (s.awardType ||
                  judgeAwardMap[s.judge?._id || s.judge] ||
                  'Unknown Award') === award,
            );
            judgeScoresHtml += awardJudges
              .map(
                (score) => `
                            <div class="flex justify-between items-center text-sm pl-2">
                                <span class="text-gray-600">${score.judge?.name || 'Unknown Judge'}</span>
                                <span class="font-medium text-purple-600">${score.totalScore.toFixed(2)}</span>
                            </div>
                        `,
              )
              .join('');
            judgeScoresHtml += '</div>';
          }

          document.getElementById('stage2JudgesList').innerHTML =
            judgeScoresHtml;
        } else {
          document.getElementById('stage2Score').innerHTML = '0.00';
          document.getElementById('stage2JudgesList').innerHTML =
            '<p class="text-sm text-gray-400">No scores yet</p>';
        }
      } else {
        document.getElementById('stage2Score').innerHTML = '0.00';
        document.getElementById('stage2JudgesList').innerHTML =
          '<p class="text-sm text-red-400">Error loading</p>';
      }

      // Calculate and display total (60% Stage 1 + 40% Stage 2)
      const totalScore = 0.6 * stage1Score + 0.4 * stage2Score;
      document.getElementById('totalScore').innerHTML = totalScore.toFixed(2);
    } catch (error) {
      console.error('Failed to load scores:', error);
      document.getElementById('stage1Score').innerHTML = 'Error';
      document.getElementById('stage2Score').innerHTML = 'Error';
      document.getElementById('totalScore').innerHTML = 'Error';
    }
  }
}
