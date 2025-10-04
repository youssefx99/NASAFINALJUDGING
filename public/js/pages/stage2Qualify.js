// Stage 2 Qualification Management Page
class Stage2QualifyPage {
  static render() {
    return `
            <div class="min-h-screen bg-gray-50 flex">
                ${Sidebar.render()}
                
                <div class="flex-1 ml-64">
                    <div class="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
                        <h1 class="text-2xl font-bold text-gray-900">Stage 2 Qualification Management</h1>
                        <p class="text-sm text-gray-600 mt-1">Review Stage 1 completion and qualify top teams for Stage 2</p>
                    </div>
                    
                    <div class="p-6 space-y-6">
                        <!-- Statistics Cards -->
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <!-- Incomplete Teams -->
                            <div class="bg-white rounded-lg shadow p-6">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm font-medium text-gray-600">Incomplete Teams</p>
                                        <p id="incompleteTeamsCount" class="text-3xl font-bold text-yellow-600 mt-2">-</p>
                                    </div>
                                    <div class="bg-yellow-100 p-3 rounded-full">
                                        <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                    </div>
                                </div>
                                <p class="text-xs text-gray-500 mt-2">Teams missing judge scores</p>
                            </div>

                            <!-- Incomplete Judges -->
                            <div class="bg-white rounded-lg shadow p-6">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm font-medium text-gray-600">Incomplete Judges</p>
                                        <p id="incompleteJudgesCount" class="text-3xl font-bold text-orange-600 mt-2">-</p>
                                    </div>
                                    <div class="bg-orange-100 p-3 rounded-full">
                                        <svg class="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                                        </svg>
                                    </div>
                                </div>
                                <button 
                                    onclick="Stage2QualifyPage.showIncompleteJudges()"
                                    class="text-xs text-blue-600 hover:text-blue-800 mt-2 font-medium"
                                >
                                    View List →
                                </button>
                            </div>

                            <!-- Ready Teams -->
                            <div class="bg-white rounded-lg shadow p-6">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm font-medium text-gray-600">Ready for Stage 2</p>
                                        <p id="readyTeamsCount" class="text-3xl font-bold text-green-600 mt-2">-</p>
                                    </div>
                                    <div class="bg-green-100 p-3 rounded-full">
                                        <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                    </div>
                                </div>
                                <p class="text-xs text-gray-500 mt-2">All judges scored</p>
                            </div>


                        </div>

                        <!-- Top 60 Teams Preview -->
                        <div class="bg-white rounded-lg shadow">
                            <div class="px-6 py-4 border-b border-gray-200">
                                <h2 class="text-lg font-medium text-gray-900">Top 60 Teams Preview (First 10)</h2>
                                <p class="text-sm text-gray-600 mt-1">Based on Stage 1 average scores</p>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team Name</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Challenge</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Average Score</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Judge Count</th>
                                        </tr>
                                    </thead>
                                    <tbody id="top60Table" class="bg-white divide-y divide-gray-200">
                                        <tr>
                                            <td colspan="5" class="px-6 py-4 text-center text-gray-500">Loading...</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Qualify Button -->
                        <div class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow p-8">
                            <h3 class="text-2xl font-bold text-gray-900 mb-4 text-center">🚀 Qualify Top Teams for Stage 2</h3>
                            
                            <!-- Team Limit Input -->
                            <div class="max-w-md mx-auto mb-6">
                                <label class="block text-sm font-medium text-gray-700 mb-2">Number of Teams to Qualify</label>
                                <div class="flex items-center space-x-4">
                                    <input 
                                        type="number" 
                                        id="teamLimitInput"
                                        value="60"
                                        min="1"
                                        max="500"
                                        required
                                        class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-lg font-semibold"
                                    />
                                    <button 
                                        onclick="Stage2QualifyPage.previewTopTeams()"
                                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                                    >
                                        Preview
                                    </button>
                                </div>
                                <p class="text-xs text-gray-500 mt-2">Enter the number of top-scoring teams to qualify (default: 60)</p>
                            </div>

                            <div class="text-center">
                                <p class="text-gray-600 mb-4">This will assign the top <span id="qualifyCount" class="font-bold text-purple-600">60</span> teams to ALL Stage 2 panels</p>
                                <button 
                                    id="qualifyBtn"
                                    onclick="Stage2QualifyPage.qualifyTeams()"
                                    class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors duration-200"
                                >
                                    Qualify Top <span id="qualifyBtnCount">60</span> Teams
                                </button>
                                <p class="text-xs text-gray-500 mt-4">⚠️ This action will overwrite current Stage 2 panel assignments</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Incomplete Judges Modal -->
            <div id="incompleteJudgesModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden z-50">
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="bg-white rounded-lg max-w-6xl w-full max-h-screen overflow-y-auto">
                        <div class="px-6 py-4 border-b border-gray-200">
                            <div class="flex justify-between items-center">
                                <h3 class="text-lg font-medium text-gray-900">Incomplete Judges</h3>
                                <div class="flex items-center space-x-4">
                                    <div class="text-sm text-gray-600">
                                        <span id="judgesPaginationInfo">Loading...</span>
                                    </div>
                                    <div class="flex items-center space-x-2">
                                        <label class="text-sm text-gray-600">Per page:</label>
                                        <select id="judgesPerPage" class="text-sm border border-gray-300 rounded px-2 py-1" onchange="Stage2QualifyPage.changeJudgesPerPage()">
                                            <option value="10">10</option>
                                            <option value="25">25</option>
                                            <option value="50">50</option>
                                            <option value="100">100</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="p-6">
                            <div class="overflow-x-auto">
                                <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Judge Name</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Teams</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scored Teams</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending Teams</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                                        </tr>
                                    </thead>
                                    <tbody id="incompleteJudgesTable" class="bg-white divide-y divide-gray-200">
                                    </tbody>
                                </table>
                            </div>
                            
                            <!-- Pagination Controls -->
                            <div class="mt-6 flex items-center justify-between">
                                <div class="flex items-center space-x-2">
                                    <button 
                                        id="prevPageBtn"
                                        onclick="Stage2QualifyPage.previousPage()"
                                        class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled
                                    >
                                        Previous
                                    </button>
                                    <div id="pageNumbers" class="flex space-x-1">
                                        <!-- Page numbers will be inserted here -->
                                    </div>
                                    <button 
                                        id="nextPageBtn"
                                        onclick="Stage2QualifyPage.nextPage()"
                                        class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled
                                    >
                                        Next
                                    </button>
                                </div>
                                <div class="text-sm text-gray-700">
                                    <span id="judgesPageInfo">Page 1 of 1</span>
                                </div>
                            </div>
                        </div>
                        <div class="px-6 py-4 border-t border-gray-200 flex justify-end">
                            <button 
                                onclick="Stage2QualifyPage.hideIncompleteJudges()"
                                class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
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
    Stage2QualifyPage.loadStats();

    // Add input change listener
    const input = document.getElementById('teamLimitInput');
    input.addEventListener('input', () => {
      const limit = parseInt(input.value) || 60;
      document.getElementById('qualifyCount').textContent = limit;
      document.getElementById('qualifyBtnCount').textContent = limit;
    });
  }

  static async loadStats() {
    try {
      const response = await fetch('/api/stage2-qualification/stats', {
        headers: { Authorization: `Bearer ${authService.token}` },
      });

      if (response.ok) {
        const data = await response.json();

        document.getElementById('incompleteTeamsCount').textContent =
          data.incompleteTeams;
        document.getElementById('incompleteJudgesCount').textContent =
          data.incompleteJudges;
        document.getElementById('readyTeamsCount').textContent =
          data.readyTeams;
        document.getElementById('totalTeamsCount').textContent =
          data.totalStage1Teams;

        // Render top teams preview
        const tbody = document.getElementById('top60Table');
        if (data.topTeamsPreview && data.topTeamsPreview.length > 0) {
          tbody.innerHTML = data.topTeamsPreview
            .map(
              (team, index) => `
                        <tr>
                            <td class="px-6 py-4 text-sm font-medium text-gray-900">#${index + 1}</td>
                            <td class="px-6 py-4 text-sm text-gray-900">${team.name}</td>
                            <td class="px-6 py-4 text-sm text-gray-600">${team.challenge}</td>
                            <td class="px-6 py-4 text-sm font-bold text-blue-600">${team.averageScore.toFixed(2)}</td>
                            <td class="px-6 py-4 text-sm text-gray-600">${team.judgeCount}</td>
                        </tr>
                    `,
            )
            .join('');
        } else {
          tbody.innerHTML =
            '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No teams available</td></tr>';
        }
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  static async previewTopTeams() {
    const limit =
      parseInt(document.getElementById('teamLimitInput').value) || 60;

    try {
      const response = await fetch(
        `/api/stage2-qualification/top-teams?limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${authService.token}` },
        },
      );

      if (response.ok) {
        const teams = await response.json();
        const tbody = document.getElementById('top60Table');

        if (teams && teams.length > 0) {
          tbody.innerHTML = teams
            .slice(0, 10)
            .map(
              (team, index) => `
                        <tr>
                            <td class="px-6 py-4 text-sm font-medium text-gray-900">#${index + 1}</td>
                            <td class="px-6 py-4 text-sm text-gray-900">${team.name}</td>
                            <td class="px-6 py-4 text-sm text-gray-600">${team.challenge}</td>
                            <td class="px-6 py-4 text-sm font-bold text-blue-600">${team.averageScore.toFixed(2)}</td>
                            <td class="px-6 py-4 text-sm text-gray-600">${team.judgeCount}</td>
                        </tr>
                    `,
            )
            .join('');

          if (teams.length > 10) {
            tbody.innerHTML += `<tr><td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">Showing first 10 of ${teams.length} teams</td></tr>`;
          }
        } else {
          tbody.innerHTML =
            '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No teams available</td></tr>';
        }
      }
    } catch (error) {
      console.error('Failed to preview teams:', error);
      alert('Failed to preview teams');
    }
  }

  // Pagination state
  static judgesPagination = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  };

  static async showIncompleteJudges() {
    Stage2QualifyPage.judgesPagination.currentPage = 1;
    Stage2QualifyPage.judgesPagination.itemsPerPage = 10;
    await Stage2QualifyPage.loadIncompleteJudges();
    document.getElementById('incompleteJudgesModal').classList.remove('hidden');
  }

  static async loadIncompleteJudges() {
    try {
      const { currentPage, itemsPerPage } = Stage2QualifyPage.judgesPagination;
      const response = await fetch(
        `/api/stage2-qualification/incomplete-judges?page=${currentPage}&limit=${itemsPerPage}`,
        {
          headers: { Authorization: `Bearer ${authService.token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        const { judges, pagination } = data;

        // Update pagination state
        Stage2QualifyPage.judgesPagination = {
          currentPage: pagination.currentPage,
          totalPages: pagination.totalPages,
          totalItems: pagination.totalItems,
          itemsPerPage: pagination.itemsPerPage,
        };

        const tbody = document.getElementById('incompleteJudgesTable');

        if (judges.length > 0) {
          tbody.innerHTML = judges
            .map((judge) => {
              const progressPercentage = Math.round(
                (judge.scoredTeams / judge.assignedTeams) * 100,
              );
              return `
                            <tr>
                                <td class="px-6 py-4 text-sm text-gray-900 font-medium">${judge.judgeName}</td>
                                <td class="px-6 py-4 text-sm text-gray-600">${judge.assignedTeams}</td>
                                <td class="px-6 py-4 text-sm text-green-600 font-medium">${judge.scoredTeams}</td>
                                <td class="px-6 py-4 text-sm text-red-600 font-medium">${judge.pendingTeams}</td>
                                <td class="px-6 py-4 text-sm">
                                    <div class="flex items-center">
                                        <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                            <div class="bg-blue-600 h-2 rounded-full" style="width: ${progressPercentage}%"></div>
                                        </div>
                                        <span class="text-xs text-gray-600">${progressPercentage}%</span>
                                    </div>
                                </td>
                            </tr>
                        `;
            })
            .join('');
        } else {
          tbody.innerHTML =
            '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">All judges have completed their assignments!</td></tr>';
        }

        // Update pagination UI
        Stage2QualifyPage.updatePaginationUI();
      }
    } catch (error) {
      console.error('Failed to load incomplete judges:', error);
      alert('Failed to load incomplete judges');
    }
  }

  static updatePaginationUI() {
    const { currentPage, totalPages, totalItems, itemsPerPage } =
      Stage2QualifyPage.judgesPagination;

    // Update pagination info
    document.getElementById('judgesPaginationInfo').textContent =
      `Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems} judges`;

    document.getElementById('judgesPageInfo').textContent =
      `Page ${currentPage} of ${totalPages}`;

    // Update per page selector
    document.getElementById('judgesPerPage').value = itemsPerPage;

    // Update navigation buttons
    document.getElementById('prevPageBtn').disabled = currentPage <= 1;
    document.getElementById('nextPageBtn').disabled = currentPage >= totalPages;

    // Generate page numbers
    Stage2QualifyPage.generatePageNumbers();
  }

  static generatePageNumbers() {
    const { currentPage, totalPages } = Stage2QualifyPage.judgesPagination;
    const pageNumbersContainer = document.getElementById('pageNumbers');

    let pageNumbers = '';
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous ellipsis
    if (startPage > 1) {
      pageNumbers += `<button onclick="Stage2QualifyPage.goToPage(1)" class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">1</button>`;
      if (startPage > 2) {
        pageNumbers += `<span class="px-3 py-2 text-sm text-gray-500">...</span>`;
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === currentPage;
      pageNumbers += `<button onclick="Stage2QualifyPage.goToPage(${i})" class="px-3 py-2 text-sm font-medium ${isActive ? 'text-blue-600 bg-blue-50 border-blue-300' : 'text-gray-500 bg-white border-gray-300'} border rounded-md hover:bg-gray-50">${i}</button>`;
    }

    // Next ellipsis
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers += `<span class="px-3 py-2 text-sm text-gray-500">...</span>`;
      }
      pageNumbers += `<button onclick="Stage2QualifyPage.goToPage(${totalPages})" class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">${totalPages}</button>`;
    }

    pageNumbersContainer.innerHTML = pageNumbers;
  }

  static async goToPage(page) {
    if (page < 1 || page > Stage2QualifyPage.judgesPagination.totalPages)
      return;

    Stage2QualifyPage.judgesPagination.currentPage = page;
    await Stage2QualifyPage.loadIncompleteJudges();
  }

  static async previousPage() {
    if (Stage2QualifyPage.judgesPagination.currentPage > 1) {
      await Stage2QualifyPage.goToPage(
        Stage2QualifyPage.judgesPagination.currentPage - 1,
      );
    }
  }

  static async nextPage() {
    if (
      Stage2QualifyPage.judgesPagination.currentPage <
      Stage2QualifyPage.judgesPagination.totalPages
    ) {
      await Stage2QualifyPage.goToPage(
        Stage2QualifyPage.judgesPagination.currentPage + 1,
      );
    }
  }

  static async changeJudgesPerPage() {
    const newPerPage = parseInt(document.getElementById('judgesPerPage').value);
    Stage2QualifyPage.judgesPagination.itemsPerPage = newPerPage;
    Stage2QualifyPage.judgesPagination.currentPage = 1; // Reset to first page
    await Stage2QualifyPage.loadIncompleteJudges();
  }

  static hideIncompleteJudges() {
    document.getElementById('incompleteJudgesModal').classList.add('hidden');
  }

  static async qualifyTeams() {
    const input = document.getElementById('teamLimitInput');
    const limit = parseInt(input.value);

    // VALIDATION
    if (!limit || limit < 1 || limit > 500) {
      alert('Please enter a valid number between 1 and 500');
      input.focus();
      return;
    }

    // DOUBLE CONFIRMATION for safety
    if (
      !confirm(
        `⚠️ IMPORTANT: Are you sure you want to qualify the top ${limit} teams for Stage 2?\n\nThis will:\n- Assign ${limit} teams to ALL Stage 2 panels\n- Overwrite current Stage 2 panel assignments\n\nThis action cannot be easily undone.`,
      )
    ) {
      return;
    }

    const btn = document.getElementById('qualifyBtn');
    btn.disabled = true;
    btn.innerHTML = '⏳ Qualifying... Please wait';

    try {
      const response = await fetch('/api/stage2-qualification/qualify', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authService.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit: limit }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `✅ SUCCESS!\n\nQualified ${result.qualifiedTeams} teams\nUpdated ${result.updatedPanels} Stage 2 panels\n\nAll Stage 2 panels now have the same ${result.qualifiedTeams} teams.`,
        );
        Stage2QualifyPage.loadStats();
      } else {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorText;
        } catch {
          errorMessage = errorText;
        }
        alert(
          `❌ FAILED TO QUALIFY TEAMS:\n\n${errorMessage}\n\nNo changes were made.`,
        );
      }
    } catch (error) {
      console.error('Failed to qualify teams:', error);
      alert(
        `❌ ERROR:\n\n${error.message}\n\nPlease check your connection and try again.`,
      );
    } finally {
      btn.disabled = false;
      btn.innerHTML = `Qualify Top <span id="qualifyBtnCount">${limit}</span> Teams`;
    }
  }
}
