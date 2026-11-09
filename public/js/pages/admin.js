// Admin Page
class AdminPage {
  static render() {
    const stat = (id, label, icon, tone) => `
      <div class="stat-card">
        <div class="stat-icon ${tone}">${Sidebar.icon(icon, 'h-6 w-6')}</div>
        <div class="min-w-0">
          <p class="stat-label">${label}</p>
          <p class="stat-value" id="${id}"><span class="skeleton inline-block h-7 w-14 align-middle"></span></p>
        </div>
      </div>`;
    const stageProgress = (stage, barClass) => `
      <div class="card p-5">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-slate-700">Stage ${stage} judging</p>
          <span id="stage${stage}Percent" class="text-sm font-semibold text-slate-900">–</span>
        </div>
        <div class="progress mt-3"><div id="stage${stage}Bar" class="progress-bar ${barClass}" style="width: 0%"></div></div>
        <div class="mt-3 flex justify-between text-xs text-slate-500">
          <span><span id="stage${stage}Scored" class="font-semibold text-emerald-600">–</span> fully scored</span>
          <span><span id="stage${stage}NotScored" class="font-semibold text-amber-600">–</span> pending</span>
          <span><span id="stage${stage}Total" class="font-semibold text-slate-700">–</span> teams</span>
        </div>
      </div>`;

    return Layout.admin({
      title: 'Dashboard',
      subtitle: `Welcome back, ${UI.escape(authService.getUser()?.name || 'Admin')}`,
      actions: `
        <button onclick="router.navigate('/admin/stage2-qualify')" class="btn btn-primary">
          ${Sidebar.icon('rocket', 'h-4 w-4')} Manage Stage 2
        </button>`,
      content: `
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          ${stat('totalTeams', 'Total Teams', 'teams', 'bg-blue-100 text-blue-600')}
          ${stat('totalJudges', 'Total Judges', 'judges', 'bg-emerald-100 text-emerald-600')}
          ${stageProgress(1, 'bg-blue-600')}
          ${stageProgress(2, 'bg-purple-600')}
        </div>

        <div class="card mt-6">
          <div class="card-header">
            <div>
              <h3 class="card-title">Top Teams</h3>
              <p class="mt-0.5 text-xs text-slate-500">Final score = 60% Stage 1 average + 40% best Stage 2 award average · refreshes every 10s</p>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <div class="inline-flex rounded-lg border border-slate-300 bg-white p-0.5" role="tablist">
                ${[['1', 'Stage 1'], ['2', 'Stage 2'], ['final', 'Final']].map(([value, label]) => `
                  <button data-stage="${value}" onclick="AdminPage.setStage('${value}')"
                    class="top-stage-tab rounded-md px-3 py-1.5 text-sm font-medium ${value === '1' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}">${label}</button>`).join('')}
              </div>
              <label class="flex items-center gap-2 text-sm text-slate-600">
                Top
                <select id="topTeamsCount" class="input w-24 py-1.5" onchange="AdminPage.loadTopTeams()">
                  ${[10, 25, 50, 100, 1000].map((n) => `<option value="${n}">${n === 1000 ? 'All' : n}</option>`).join('')}
                </select>
              </label>
            </div>
          </div>
          <div id="topTeamsTable" class="overflow-x-auto">
            <table class="table"><tbody>${UI.skeletonRows(6, 6)}</tbody></table>
          </div>
        </div>
      `,
    });
  }

  static stage = '1';

  static afterRender() {
    AdminPage.stage = '1';
    AdminPage.loadStats();
    AdminPage.loadScoringOverview();
    AdminPage.loadTopTeams();

    if (window.adminRefreshInterval) {
      clearInterval(window.adminRefreshInterval);
    }
    window.adminRefreshInterval = setInterval(() => {
      AdminPage.loadScoringOverview();
      AdminPage.loadTopTeams();
    }, 10000);
  }

  static setStage(stage) {
    AdminPage.stage = stage;
    document.querySelectorAll('.top-stage-tab').forEach((tab) => {
      const active = tab.dataset.stage === stage;
      tab.classList.toggle('bg-blue-600', active);
      tab.classList.toggle('text-white', active);
      tab.classList.toggle('text-slate-600', !active);
      tab.classList.toggle('hover:bg-slate-100', !active);
    });
    document.getElementById('topTeamsTable').innerHTML = `<table class="table"><tbody>${UI.skeletonRows(6, 6)}</tbody></table>`;
    AdminPage.loadTopTeams();
  }

  static async loadStats() {
    const [teams, judges] = await Promise.allSettled([
      UI.api('/api/teams/count'),
      UI.api('/api/users/judges'),
    ]);
    if (!document.getElementById('totalTeams')) return;
    document.getElementById('totalTeams').textContent =
      teams.status === 'fulfilled' ? teams.value.count.toLocaleString() : '–';
    document.getElementById('totalJudges').textContent =
      judges.status === 'fulfilled' ? judges.value.length.toLocaleString() : '–';
  }

  static async loadScoringOverview() {
    try {
      const data = await UI.api('/api/scores/overview');
      if (!document.getElementById('stage1Bar')) return;
      for (const stage of [1, 2]) {
        const overview = data[`stage${stage}`] || { scored: 0, notScored: 0, total: 0 };
        const percent = overview.total ? Math.round((overview.scored / overview.total) * 100) : 0;
        document.getElementById(`stage${stage}Scored`).textContent = overview.scored;
        document.getElementById(`stage${stage}NotScored`).textContent = overview.notScored;
        document.getElementById(`stage${stage}Total`).textContent = overview.total;
        document.getElementById(`stage${stage}Percent`).textContent = `${percent}%`;
        document.getElementById(`stage${stage}Bar`).style.width = `${percent}%`;
      }
    } catch (error) {
      console.error('Could not load scoring overview', error);
    }
  }

  static async loadTopTeams() {
    const stage = AdminPage.stage;
    const count = document.getElementById('topTeamsCount')?.value || 10;
    const container = document.getElementById('topTeamsTable');
    try {
      const teams = await UI.api(`/api/scores/top?stage=${stage}&limit=${count}`);
      if (AdminPage.stage !== stage || !document.getElementById('topTeamsTable')) return;
      if (stage === 'final') {
        AdminPage.renderFinalScores(teams);
      } else {
        AdminPage.renderTopTeams(teams);
      }
    } catch (error) {
      if (!container) return;
      container.innerHTML = `
        <div class="flex flex-col items-center gap-3 py-10 text-sm text-slate-500">
          <p>Could not load top teams: ${UI.escape(error.message)}</p>
          <button onclick="AdminPage.loadTopTeams()" class="btn btn-secondary btn-sm">Retry</button>
        </div>`;
    }
  }

  static rank(index, hasScore) {
    if (!hasScore) return '<span class="text-slate-400">–</span>';
    const medals = ['🥇', '🥈', '🥉'];
    return index < 3
      ? `<span class="text-lg">${medals[index]}</span>`
      : `<span class="font-semibold text-slate-700">#${index + 1}</span>`;
  }

  static statusBadge(hasScore) {
    return hasScore
      ? '<span class="badge badge-green">Scored</span>'
      : '<span class="badge badge-gray">Pending</span>';
  }

  static renderTopTeams(teams) {
    const container = document.getElementById('topTeamsTable');
    if (!teams || teams.length === 0) {
      container.innerHTML = UI.emptyState('No teams yet', 'Import teams to see rankings here');
      return;
    }

    container.innerHTML = `
      <table class="table">
        <thead>
          <tr><th class="w-16">Rank</th><th>Team</th><th>Challenge</th><th>Average Score</th><th>Judges</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${teams
            .map(
              (team, index) => `
            <tr class="cursor-pointer ${team.hasScore && index < 3 ? 'bg-amber-50/60' : ''}" onclick="router.navigate('/admin/teams/${team._id}')">
              <td>${AdminPage.rank(index, team.hasScore)}</td>
              <td class="font-medium text-slate-900">${UI.escape(team.name)}</td>
              <td class="text-slate-600">${UI.escape(team.challenge)}</td>
              <td>${team.hasScore ? `<span class="font-semibold text-blue-600">${team.averageScore.toFixed(2)}</span>` : '<span class="text-slate-400">No score</span>'}</td>
              <td class="text-slate-500">${team.hasScore ? `${team.judgeCount} judge${team.judgeCount === 1 ? '' : 's'}` : '–'}</td>
              <td>${AdminPage.statusBadge(team.hasScore)}</td>
            </tr>`,
            )
            .join('')}
        </tbody>
      </table>
    `;
  }

  static renderFinalScores(teams) {
    const container = document.getElementById('topTeamsTable');
    if (!teams || teams.length === 0) {
      container.innerHTML = UI.emptyState('No teams yet', 'Import teams to see rankings here');
      return;
    }

    container.innerHTML = `
      <table class="table">
        <thead>
          <tr><th class="w-16">Rank</th><th>Team</th><th>Challenge</th><th>Stage 1 (60%)</th><th>Stage 2 Best (40%)</th><th>Best Award</th><th>Final Score</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${teams
            .map(
              (team, index) => `
            <tr class="cursor-pointer ${team.hasAnyScore && index < 3 ? 'bg-amber-50/60' : ''}" onclick="router.navigate('/admin/teams/${team._id}')">
              <td>${AdminPage.rank(index, team.hasAnyScore)}</td>
              <td class="font-medium text-slate-900">${UI.escape(team.name)}</td>
              <td class="text-slate-600">${UI.escape(team.challenge)}</td>
              <td>${team.hasStage1Score ? `<span class="font-medium text-blue-600">${team.stage1Score.toFixed(2)}</span>` : '<span class="text-slate-400">No score</span>'}</td>
              <td>${team.hasStage2Score ? `<span class="font-medium text-purple-600">${team.stage2BestScore.toFixed(2)}</span>` : '<span class="text-slate-400">No score</span>'}</td>
              <td class="text-xs text-slate-600">${team.hasStage2Score ? UI.escape(team.bestAward) : 'N/A'}</td>
              <td>${team.hasAnyScore ? `<span class="text-base font-bold text-emerald-600">${team.finalScore.toFixed(2)}</span>` : '<span class="text-slate-400">No score</span>'}</td>
              <td>${AdminPage.statusBadge(team.hasAnyScore)}</td>
            </tr>`,
            )
            .join('')}
        </tbody>
      </table>
    `;
  }
}
