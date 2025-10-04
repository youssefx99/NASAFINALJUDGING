// Winners Page
class WinnersPage {
  static render() {
    return `
      <div class="min-h-screen bg-gray-50 flex">
        ${Sidebar.render()}
        
        <div class="flex-1 ml-64">
          <!-- Header -->
          <div class="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <h1 class="text-2xl font-bold text-gray-900">🏆 Award Winners</h1>
            <p class="text-sm text-gray-600 mt-1">Stage 2 Award Panel Winners</p>
          </div>
          
           <!-- Main Content -->
           <div class="p-6">
             <!-- Winners Grid -->
             <div class="mb-6">
               <h2 class="text-xl font-semibold text-gray-900 mb-4">Stage 2 Award Panels</h2>
              <div id="winnersGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Loading skeleton -->
                <div class="animate-pulse">
                  <div class="bg-white rounded-lg shadow p-6">
                    <div class="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div class="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div class="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div class="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
                <div class="animate-pulse">
                  <div class="bg-white rounded-lg shadow p-6">
                    <div class="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div class="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div class="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div class="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
                <div class="animate-pulse">
                  <div class="bg-white rounded-lg shadow p-6">
                    <div class="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div class="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div class="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div class="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  static async afterRender() {
    await WinnersPage.loadWinners();
  }

  static async loadWinners() {
    try {
      // Load award status (all panels with winner info)
      const response = await fetch('/api/winners/award-status', {
        headers: {
          Authorization: `Bearer ${authService.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        WinnersPage.renderAllPanels(data.data);
      } else {
        WinnersPage.renderError('Failed to load award panels data');
      }
    } catch (error) {
      console.error('Error loading award panels:', error);
      WinnersPage.renderError('Error loading award panels data');
    }
  }

  static renderAllPanels(panels) {
    const winnersGrid = document.getElementById('winnersGrid');

    if (!panels || panels.length === 0) {
      winnersGrid.innerHTML = `
        <div class="col-span-full text-center py-12">
          <div class="text-gray-400 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading Panels</h3>
          <p class="text-gray-500">Unable to load award panels data.</p>
        </div>
      `;
      return;
    }

    winnersGrid.innerHTML = panels
      .map(
        (panel) => `
      <div class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 p-6 border-l-4 ${panel.hasWinner ? 'border-yellow-400' : 'border-gray-300'}">
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">${panel.awardType}</h3>
            <div class="flex items-center mb-2">
              ${
                panel.hasWinner
                  ? `
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mr-2">
                  🥇 Winner
                </span>
                <span class="text-sm text-gray-500">${panel.judgeCount} judge${panel.judgeCount !== 1 ? 's' : ''}</span>
              `
                  : `
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 mr-2">
                  ⏳ Pending
                </span>
                <span class="text-sm text-gray-500">No winner yet</span>
              `
              }
            </div>
          </div>
          <div class="text-right">
            ${
              panel.hasWinner
                ? `
              <div class="text-3xl font-bold text-yellow-600">${panel.winnerScore.toFixed(1)}</div>
              <div class="text-sm text-gray-500">Final Score</div>
            `
                : `
              <div class="text-3xl font-bold text-gray-400">--</div>
              <div class="text-sm text-gray-500">No Score</div>
            `
            }
          </div>
        </div>
        
        <div class="border-t pt-4">
          ${
            panel.hasWinner
              ? `
            <h4 class="font-medium text-gray-900 mb-2">${panel.winnerTeam}</h4>
            <p class="text-sm text-gray-600 mb-2">Winner Team</p>
          `
              : `
            <h4 class="font-medium text-gray-500 mb-2">No Winner Yet</h4>
            <p class="text-sm text-gray-500 mb-2">Stage 2 judging in progress</p>
          `
          }
        </div>
      </div>
    `,
      )
      .join('');
  }

  static renderError(message) {
    const winnersGrid = document.getElementById('winnersGrid');
    winnersGrid.innerHTML = `
      <div class="col-span-full text-center py-12">
        <div class="text-red-400 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading Winners</h3>
        <p class="text-gray-500">${message}</p>
        <button onclick="WinnersPage.loadWinners()" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Try Again
        </button>
      </div>
    `;
  }
}
