// Teams Management Page
class TeamsManagementPage {
  static PER_PAGE = 25;
  static CONFIRM_PHRASE = 'DELETE ALL TEAMS';
  static SOLUTION_BADGES = { web: 'badge-blue', mobile: 'badge-green', ai: 'badge-purple' };
  static rows = [];
  static filtered = [];
  static page = 1;
  static onSearch = UI.debounce(() => TeamsManagementPage.applyFilters(), 200);

  static render() {
    return Layout.admin({
      title: 'Teams',
      subtitle: 'Search, review and manage registered teams',
      actions: `
        <a href="/admin/upload-data-stream" onclick="navigateToPage(event, '/admin/upload-data-stream')" class="btn btn-secondary">
          ${Sidebar.icon('upload', 'h-4 w-4')}
          Import Teams
        </a>
        <button id="deleteAllTeamsBtn" onclick="TeamsManagementPage.showDeleteAllModal()" class="btn btn-danger" disabled>
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          Delete All Teams
        </button>
      `,
      content: `
        <div id="teamsStats" class="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          ${`<div class="stat-card"><div class="skeleton h-11 w-11"></div><div class="flex-1 space-y-2"><div class="skeleton h-3 w-20"></div><div class="skeleton h-6 w-12"></div></div></div>`.repeat(4)}
        </div>

        <div class="card">
          <div class="card-header">
            <div class="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
              <div class="relative flex-1">
                <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"></path></svg>
                <input id="searchTeams" type="search" autocomplete="off" oninput="TeamsManagementPage.onSearch()"
                  placeholder="Search team, leader, email, challenge or panel..." class="input pl-9" />
              </div>
              <select id="filterByPanel" onchange="TeamsManagementPage.applyFilters()" class="input sm:w-56">
                <option value="">All teams</option>
                <option value="stage1">Assigned to a Stage 1 panel</option>
                <option value="stage2">In Stage 2 panels</option>
                <option value="unassigned">Unassigned</option>
              </select>
              <p id="teamsCount" class="whitespace-nowrap text-sm text-slate-500">Loading teams...</p>
            </div>
          </div>
          <div id="teamsTable">${TeamsManagementPage.tableHtml(UI.skeletonRows(5, 8))}</div>
        </div>

        <div id="deleteAllModal" class="fixed inset-0 z-50 hidden flex items-center justify-center bg-slate-900/50 p-4"
          onclick="if (event.target === this) TeamsManagementPage.hideDeleteAllModal()"
          onkeydown="if (event.key === 'Escape') TeamsManagementPage.hideDeleteAllModal()">
          <form class="card w-full max-w-lg" role="dialog" aria-modal="true" aria-labelledby="deleteAllTitle"
            onsubmit="event.preventDefault(); TeamsManagementPage.deleteAllTeams()">
            <div class="flex items-start gap-4 p-6">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              </div>
              <div class="min-w-0 flex-1">
                <h3 id="deleteAllTitle" class="text-lg font-semibold text-slate-900">Delete all teams?</h3>
                <p class="mt-1 text-sm text-slate-600">This permanently deletes <strong id="deleteAllCount" class="text-slate-900">all</strong> teams together with:</p>
                <ul class="mt-2 list-disc space-y-0.5 pl-5 text-sm text-slate-600">
                  <li>All Stage 1 and Stage 2 scores</li>
                  <li>All team assignments on panels</li>
                </ul>
                <p class="mt-3 text-sm font-medium text-red-700">This action cannot be undone.</p>
                <label for="deleteAllConfirmInput" class="label mt-4">
                  Type <span class="font-mono font-semibold text-red-600">${TeamsManagementPage.CONFIRM_PHRASE}</span> to confirm
                </label>
                <input id="deleteAllConfirmInput" type="text" autocomplete="off" spellcheck="false"
                  placeholder="${TeamsManagementPage.CONFIRM_PHRASE}" class="input font-mono"
                  oninput="TeamsManagementPage.validateDeleteAllInput()" />
              </div>
            </div>
            <div class="flex justify-end gap-3 rounded-b-xl border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button type="button" onclick="TeamsManagementPage.hideDeleteAllModal()" class="btn btn-secondary">Cancel</button>
              <button type="submit" id="confirmDeleteAllBtn" class="btn btn-danger" disabled>Delete all teams</button>
            </div>
          </form>
        </div>
      `,
    });
  }

  static afterRender() {
    TeamsManagementPage.rows = [];
    TeamsManagementPage.filtered = [];
    TeamsManagementPage.page = 1;
    TeamsManagementPage.load();
  }

  static tableHtml(body) {
    return `
      <div class="relative overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Team</th>
              <th>Challenge</th>
              <th>Solution</th>
              <th>Panels</th>
              <th><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    `;
  }

  static async load() {
    const table = document.getElementById('teamsTable');
    if (!table) return;
    table.innerHTML = TeamsManagementPage.tableHtml(UI.skeletonRows(5, 8));
    document.getElementById('teamsCount').textContent = 'Loading teams...';

    try {
      const [teams, panels] = await Promise.all([UI.api('/api/teams'), UI.api('/api/panels')]);

      const assignments = new Map();
      for (const panel of panels) {
        const stage = Number(panel.stage);
        for (const t of panel.teams || []) {
          if (!t) continue;
          const id = t._id || t;
          if (!assignments.has(id)) assignments.set(id, { stage1: null, stage2: [] });
          if (stage === 1) assignments.get(id).stage1 = panel;
          else if (stage === 2) assignments.get(id).stage2.push(panel);
        }
      }

      TeamsManagementPage.rows = teams.map((team) => {
        const { stage1, stage2 } = assignments.get(team._id) || { stage1: null, stage2: [] };
        const search = [
          team.name,
          team.challenge,
          team.actualSolution,
          team.leaderName,
          team.leaderEmail,
          stage1?.name,
          ...stage2.map((p) => p.awardType || p.name),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return { team, stage1, stage2, search };
      });

      TeamsManagementPage.renderStats();
      TeamsManagementPage.applyFilters(false);
    } catch (error) {
      console.error('Failed to load teams:', error);
      if (!document.getElementById('teamsTable')) return;
      document.getElementById('teamsCount').textContent = '';
      table.innerHTML = `
        <div class="flex flex-col items-center px-6 py-12 text-center">
          <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <p class="text-sm font-medium text-slate-900">Couldn't load teams</p>
          <p class="mt-1 text-sm text-slate-500">${UI.escape(error.message)}</p>
          <button onclick="TeamsManagementPage.load()" class="btn btn-secondary mt-4">Try again</button>
        </div>
      `;
    }
  }

  static renderStats() {
    const container = document.getElementById('teamsStats');
    if (!container) return;
    const rows = TeamsManagementPage.rows;
    const stats = [
      ['Total teams', rows.length, 'teams', 'bg-blue-50 text-blue-600'],
      ['Stage 1 assigned', rows.filter((r) => r.stage1).length, 'panels', 'bg-emerald-50 text-emerald-600'],
      ['In Stage 2 panels', rows.filter((r) => r.stage2.length).length, 'rocket', 'bg-purple-50 text-purple-600'],
      ['Unassigned', rows.filter((r) => !r.stage1 && !r.stage2.length).length, 'criteria', 'bg-amber-50 text-amber-600'],
    ];
    container.innerHTML = stats
      .map(
        ([label, value, icon, color]) => `
        <div class="stat-card">
          <div class="stat-icon ${color}">${Sidebar.icon(icon)}</div>
          <div class="min-w-0">
            <p class="stat-label truncate">${label}</p>
            <p class="stat-value">${value.toLocaleString()}</p>
          </div>
        </div>`,
      )
      .join('');
    document.getElementById('deleteAllTeamsBtn').disabled = rows.length === 0;
  }

  static applyFilters(resetPage = true) {
    const term = (document.getElementById('searchTeams')?.value || '').trim().toLowerCase();
    const tokens = term ? term.split(/\s+/) : [];
    const matchesPanel = {
      stage1: (r) => !!r.stage1,
      stage2: (r) => r.stage2.length > 0,
      unassigned: (r) => !r.stage1 && r.stage2.length === 0,
    }[document.getElementById('filterByPanel')?.value];

    TeamsManagementPage.filtered = TeamsManagementPage.rows.filter(
      (r) => (!matchesPanel || matchesPanel(r)) && tokens.every((t) => r.search.includes(t)),
    );
    if (resetPage) TeamsManagementPage.page = 1;
    TeamsManagementPage.renderTable();
  }

  static renderTable() {
    const table = document.getElementById('teamsTable');
    if (!table) return;
    const { rows, filtered, PER_PAGE } = TeamsManagementPage;
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const page = Math.min(Math.max(1, TeamsManagementPage.page), totalPages);
    TeamsManagementPage.page = page;

    document.getElementById('teamsCount').textContent =
      filtered.length === rows.length
        ? `${rows.length.toLocaleString()} teams`
        : `${filtered.length.toLocaleString()} of ${rows.length.toLocaleString()} teams`;

    if (filtered.length === 0) {
      table.innerHTML = rows.length
        ? UI.emptyState('No teams match your filters', 'Try a different search term or filter.')
        : UI.emptyState('No teams yet', 'Use "Import Teams" to upload your teams CSV.');
      return;
    }

    const start = (page - 1) * PER_PAGE;
    table.innerHTML =
      TeamsManagementPage.tableHtml(
        filtered.slice(start, start + PER_PAGE).map(TeamsManagementPage.rowHtml).join(''),
      ) + UI.pagination({ page, perPage: PER_PAGE, total: filtered.length, onChange: 'TeamsManagementPage.goToPage' });
  }

  static rowHtml({ team, stage1, stage2 }) {
    const href = `/admin/teams/${team._id}`;
    const solution = team.actualSolution || '';
    const stage2Names = stage2.map((p) => p.awardType || p.name);
    const stage2Label = stage2.length === 1 ? stage2Names[0] : `${stage2.length} award panels`;

    return `
      <tr>
        <td>
          <div class="min-w-[11rem]">
            <a href="${href}" onclick="navigateToPage(event, '${href}')" class="font-medium text-slate-900 hover:text-blue-600">${UI.escape(team.name)}</a>
            ${team.leaderName ? `<p class="mt-0.5 text-xs text-slate-500">${UI.escape(team.leaderName)}</p>` : ''}
          </div>
        </td>
        <td><p class="line-clamp-2 min-w-[10rem] max-w-xs">${UI.escape(team.challenge || '—')}</p></td>
        <td>
          ${solution
            ? `<span class="badge ${TeamsManagementPage.SOLUTION_BADGES[solution.toLowerCase()] || 'badge-gray'}">${UI.escape(solution)}</span>`
            : '<span class="text-slate-400">—</span>'}
        </td>
        <td>
          <div class="flex min-w-[10rem] flex-wrap gap-1">
            ${stage1
              ? `<span class="badge badge-blue">S1 · ${UI.escape(stage1.name)}</span>`
              : '<span class="badge badge-gray">S1 · Unassigned</span>'}
            ${stage2.length
              ? `<span class="badge badge-purple" title="${UI.escape(stage2Names.join(', '))}">S2 · ${UI.escape(stage2Label)}</span>`
              : ''}
          </div>
        </td>
        <td>
          <div class="flex justify-end gap-1">
            <button onclick="router.navigate('${href}')" class="btn btn-ghost btn-sm">View</button>
            <button onclick="TeamsManagementPage.deleteTeam('${team._id}')" class="btn btn-ghost btn-sm text-red-600 hover:bg-red-50 hover:text-red-700">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }

  static goToPage(page) {
    TeamsManagementPage.page = page;
    TeamsManagementPage.renderTable();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  static async deleteTeam(teamId) {
    const row = TeamsManagementPage.rows.find((r) => r.team._id === teamId);
    if (!row) return;
    const confirmed = await UI.confirm({
      title: 'Delete team?',
      message: `"${row.team.name}" and all of its scores will be permanently deleted. This cannot be undone.`,
      confirmText: 'Delete team',
      danger: true,
    });
    if (!confirmed) return;

    try {
      await UI.api(`/api/teams/${teamId}`, { method: 'DELETE' });
      TeamsManagementPage.rows = TeamsManagementPage.rows.filter((r) => r !== row);
      TeamsManagementPage.filtered = TeamsManagementPage.filtered.filter((r) => r !== row);
      TeamsManagementPage.renderStats();
      TeamsManagementPage.renderTable();
      UI.toast(`Deleted "${row.team.name}"`, 'success');
    } catch (error) {
      console.error('Failed to delete team:', error);
      UI.toast(`Failed to delete team: ${error.message}`, 'error');
    }
  }

  static showDeleteAllModal() {
    if (!TeamsManagementPage.rows.length) return;
    document.getElementById('deleteAllCount').textContent = TeamsManagementPage.rows.length.toLocaleString();
    TeamsManagementPage.resetDeleteAllForm();
    document.getElementById('deleteAllModal').classList.remove('hidden');
    document.getElementById('deleteAllConfirmInput').focus();
  }

  static hideDeleteAllModal() {
    document.getElementById('deleteAllModal')?.classList.add('hidden');
    TeamsManagementPage.resetDeleteAllForm();
  }

  static resetDeleteAllForm() {
    const input = document.getElementById('deleteAllConfirmInput');
    if (!input) return;
    input.value = '';
    input.disabled = false;
    const button = document.getElementById('confirmDeleteAllBtn');
    button.disabled = true;
    button.textContent = 'Delete all teams';
  }

  static validateDeleteAllInput() {
    document.getElementById('confirmDeleteAllBtn').disabled =
      document.getElementById('deleteAllConfirmInput').value.trim() !== TeamsManagementPage.CONFIRM_PHRASE;
  }

  static async deleteAllTeams() {
    const input = document.getElementById('deleteAllConfirmInput');
    const button = document.getElementById('confirmDeleteAllBtn');
    if (input.value.trim() !== TeamsManagementPage.CONFIRM_PHRASE) return;

    input.disabled = true;
    button.disabled = true;
    button.innerHTML = `
      <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
      Deleting...
    `;

    try {
      const result = await UI.api('/api/teams', { method: 'DELETE' });
      TeamsManagementPage.hideDeleteAllModal();
      UI.toast(`Deleted ${result?.deletedCount ?? 0} teams and all associated data`, 'success');
      TeamsManagementPage.load();
    } catch (error) {
      console.error('Failed to delete all teams:', error);
      UI.toast(`Failed to delete all teams: ${error.message}`, 'error');
      input.disabled = false;
      button.textContent = 'Delete all teams';
      TeamsManagementPage.validateDeleteAllInput();
    }
  }
}
