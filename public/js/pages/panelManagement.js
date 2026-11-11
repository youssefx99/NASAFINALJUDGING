// Panel Management Page
class PanelManagementPage {
  static AWARD_TYPES = [
    'Best Use of Science',
    'Best Use of Data',
    'Best Use of Technology',
    'Galactic Impact',
    'Best Mission Concept',
    'Most Inspirational',
    'Best Use of Storytelling',
    'Global Connection',
    'Art & Technology',
    'Local Impact',
  ];

  static ICONS = {
    refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    plus: 'M12 4v16m8-8H4',
    search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    close: 'M6 18L18 6M6 6l12 12',
    chevron: 'M9 5l7 7-7 7',
    alert: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  };

  static SPINNER =
    '<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>';

  static collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  static panels = [];
  static judges = [];
  static teams = [];
  static criteria = [];
  static panelNumbers = [];
  static loaded = false;
  static stage = 1;
  static query = '';
  static expanded = new Set();
  static editor = null;
  static seq = 0;
  static polling = false;
  static lastJson = '';

  static svg(d, cls = 'h-4 w-4') {
    return `<svg class="${cls}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${d}"></path></svg>`;
  }

  static id(x) {
    return String((x && x._id) || x);
  }

  static plural(n, word) {
    return `${n} ${word}${n === 1 ? '' : 's'}`;
  }

  static render() {
    const statSkeleton =
      '<div class="stat-card"><div class="skeleton h-11 w-11"></div><div class="flex-1 space-y-2"><div class="skeleton h-3 w-24"></div><div class="skeleton h-6 w-12"></div></div></div>';
    return (
      Layout.admin({
        title: 'Panels',
        subtitle: 'Assign judges and teams to Stage 1 panels and Stage 2 award panels',
        actions: `
          <button type="button" onclick="PanelManagementPage.load(true)" class="btn btn-secondary">
            ${PanelManagementPage.svg(PanelManagementPage.ICONS.refresh)} Refresh
          </button>
          <button type="button" onclick="PanelManagementPage.openEditor()" class="btn btn-primary">
            ${PanelManagementPage.svg(PanelManagementPage.ICONS.plus)} New panel
          </button>`,
        content: `
          <div id="panelStats" class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">${statSkeleton.repeat(4)}</div>
          <div class="card">
            <div class="card-header">
              <div id="panelTabs" class="inline-flex rounded-lg bg-slate-100 p-1">${PanelManagementPage.renderTabs()}</div>
              <div class="relative w-full sm:w-80">
                <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">${PanelManagementPage.svg(PanelManagementPage.ICONS.search)}</span>
                <input id="panelSearch" type="search" autocomplete="off" placeholder="Search panels, judges or teams"
                  oninput="PanelManagementPage.onSearch(this.value)" class="input pl-9">
              </div>
            </div>
            <div id="panelsTable" class="overflow-x-auto">${PanelManagementPage.loadingTable()}</div>
          </div>`,
      }) + PanelManagementPage.renderModal()
    );
  }

  static renderModal() {
    return `
      <div id="panelModal" class="fixed inset-0 z-50 hidden overflow-y-auto bg-slate-900/50 p-4 sm:p-6">
        <form id="panelForm" onsubmit="PanelManagementPage.save(event)" novalidate role="dialog" aria-modal="true" aria-labelledby="panelModalTitle"
          class="card mx-auto flex max-h-[90vh] w-full max-w-5xl flex-col">
          <div class="card-header flex-nowrap">
            <div class="min-w-0">
              <h3 id="panelModalTitle" class="card-title truncate">New panel</h3>
              <p class="mt-0.5 text-sm text-slate-500">Choose the judges and teams for this panel.</p>
            </div>
            <button type="button" onclick="PanelManagementPage.closeEditor()" aria-label="Close" class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              ${PanelManagementPage.svg(PanelManagementPage.ICONS.close, 'h-5 w-5')}
            </button>
          </div>
          <div class="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
            <div class="grid gap-4 sm:grid-cols-3">
              <div>
                <label for="panelName" class="label">Panel name</label>
                <input id="panelName" type="text" maxlength="120" placeholder="e.g., Panel 12" oninput="PanelManagementPage.markDirty()" class="input">
              </div>
              <div>
                <label for="panelStage" class="label">Stage</label>
                <select id="panelStage" onchange="PanelManagementPage.onStageChange(this.value)" class="input">
                  <option value="1">Stage 1</option>
                  <option value="2">Stage 2 (award panel)</option>
                </select>
              </div>
              <div id="panelAwardWrap" class="hidden">
                <label for="panelAward" class="label">Award</label>
                <select id="panelAward" onchange="PanelManagementPage.markDirty()" class="input"></select>
              </div>
            </div>
            <div id="panelEditorTabs" class="flex gap-1 border-b border-slate-200">
              <button type="button" data-tab="members" onclick="PanelManagementPage.setEditorTab('members')" class="-mb-px border-b-2 px-3 py-2 text-sm font-medium">Judges &amp; teams</button>
              <button type="button" data-tab="criteria" onclick="PanelManagementPage.setEditorTab('criteria')" class="-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium">
                Criteria <span id="criteriaTabBadge" class="badge badge-yellow">Choose</span>
              </button>
            </div>
            <div id="panelMembersTab" class="grid gap-5 lg:grid-cols-5">
              <div class="lg:col-span-2">${PanelManagementPage.renderPickerShell('judges', 'Judges', 'Search by name or email')}</div>
              <div class="lg:col-span-3">${PanelManagementPage.renderPickerShell('teams', 'Teams', 'Search by team, challenge or panel number')}</div>
            </div>
            <div id="panelCriteriaTab" class="hidden space-y-2">
              <p class="text-sm text-slate-500">Judges on this panel score only the Stage 1 criteria you select; their score out of 5 is based on these criteria.</p>
              ${PanelManagementPage.renderPickerShell('criteria', 'Stage 1 criteria', 'Search criteria')}
            </div>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
            <p id="panelSummary" class="text-sm text-slate-500"></p>
            <div class="flex gap-3">
              <button type="button" onclick="PanelManagementPage.closeEditor()" class="btn btn-secondary">Cancel</button>
              <button type="submit" id="panelSaveBtn" class="btn btn-primary">Save panel</button>
            </div>
          </div>
        </form>
      </div>`;
  }

  static renderPickerShell(kind, label, placeholder) {
    return `
      <div class="rounded-lg border border-slate-200">
        <div class="space-y-2 border-b border-slate-200 p-3">
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm font-semibold text-slate-900">${label}</p>
            <span id="${kind}Count" class="badge badge-blue">0 selected</span>
          </div>
          <input id="${kind}Search" type="search" autocomplete="off" placeholder="${placeholder}"
            oninput="PanelManagementPage.onPickerSearch('${kind}', this.value)" onkeydown="if (event.key === 'Enter') event.preventDefault()" class="input">
          <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <label class="inline-flex cursor-pointer items-center gap-1.5 text-slate-600">
              <input id="${kind}SelectedOnly" type="checkbox" onchange="PanelManagementPage.toggleSelectedOnly('${kind}', this.checked)" class="h-3.5 w-3.5 accent-blue-600">
              Selected only
            </label>
            <button type="button" onclick="PanelManagementPage.selectVisible('${kind}')" class="font-medium text-blue-600 hover:text-blue-800">Select shown</button>
            <button type="button" onclick="PanelManagementPage.clearSelection('${kind}')" class="font-medium text-slate-500 hover:text-red-600">Clear</button>
            ${
              kind === 'teams'
                ? `<span id="panelNumberWrap" class="sm:ml-auto">
                    <select id="panelNumberSelect" onchange="PanelManagementPage.addByPanelNumber(this.value)" aria-label="Add teams by panel number"
                      class="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"></select>
                  </span>`
                : ''
            }
          </div>
        </div>
        <div id="${kind}List" onchange="PanelManagementPage.onPick(event, '${kind}')" class="${kind === 'teams' ? 'h-80' : 'h-64 lg:h-80'} divide-y divide-slate-100 overflow-y-auto"></div>
      </div>`;
  }

  static loadingTable() {
    return `<table class="table"><tbody>${UI.skeletonRows(4, 6)}</tbody></table>`;
  }

  static afterRender() {
    this.editor = null;
    this.query = '';
    if (this.loaded) this.renderAll();
    this.load();
    clearInterval(window.panelRefreshInterval);
    window.panelRefreshInterval = setInterval(() => PanelManagementPage.poll(), 5000);
  }

  static async load(manual = false) {
    const seq = ++this.seq;
    if (!this.loaded) document.getElementById('panelsTable').innerHTML = this.loadingTable();
    try {
      const [panels, judges, teams, stage1] = await Promise.all([
        UI.api('/api/panels'),
        UI.api('/api/users/judges'),
        UI.api('/api/teams'),
        UI.api('/api/stages/Stage%201'),
      ]);
      if (!document.getElementById('panelsTable')) return;
      this.setTeams(teams);
      this.criteria = ((stage1 && stage1.criteria) || []).map((c) => ({
        _id: this.id(c),
        name: c.name || '',
        detail: `${this.plural((c.questions || []).length, 'question')} · weight ${Math.round((Number(c.weight) || 0) * 1000) / 10}%`,
        _search: (c.name || '').toLowerCase(),
      }));
      if (seq === this.seq) this.setPanelsAndJudges(panels, judges);
      this.loaded = true;
      if (!this.editor) this.renderAll();
      if (manual) UI.toast('Panels refreshed', 'info', 2000);
    } catch (e) {
      if (seq !== this.seq || !document.getElementById('panelsTable')) return;
      if (this.loaded) {
        UI.toast(`Could not refresh panels: ${e.message}`, 'error');
        return;
      }
      document.getElementById('panelStats').innerHTML = '';
      document.getElementById('panelsTable').innerHTML = `
        <div class="flex flex-col items-center px-6 py-12 text-center">
          <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">${this.svg(this.ICONS.alert, 'h-6 w-6')}</div>
          <p class="text-sm font-medium text-slate-900">Couldn't load panels</p>
          <p class="mt-1 text-sm text-slate-500">${UI.escape(e.message)}</p>
          <button type="button" onclick="PanelManagementPage.load()" class="btn btn-secondary mt-4">Try again</button>
        </div>`;
    }
  }

  // Panels + judges only; teams rarely change and are fetched by load()
  static async syncPanels(force = false) {
    const seq = ++this.seq;
    const [panels, judges] = await Promise.all([UI.api('/api/panels'), UI.api('/api/users/judges')]);
    if (seq !== this.seq || !document.getElementById('panelsTable')) return;
    const changed = this.setPanelsAndJudges(panels, judges);
    if ((changed || force) && !this.editor) this.renderAll();
  }

  static async poll() {
    if (this.polling || this.editor || !this.loaded || document.hidden) return;
    this.polling = true;
    try {
      await this.syncPanels();
    } catch (e) {
      console.warn('Panel refresh failed:', e.message);
    } finally {
      this.polling = false;
    }
  }

  static setTeams(teams) {
    this.teams = (teams || [])
      .map((t) => ({
        _id: this.id(t),
        name: t.name || '',
        challenge: t.challenge || '',
        panelNumber: t.panelNumber,
        _search: `${t.name || ''} ${t.challenge || ''} ${t.panelNumber || ''}`.toLowerCase(),
      }))
      .sort((a, b) => this.collator.compare(a.name, b.name));
    const counts = new Map();
    this.teams.forEach((t) => {
      if (t.panelNumber && String(t.panelNumber).trim()) counts.set(t.panelNumber, (counts.get(t.panelNumber) || 0) + 1);
    });
    this.panelNumbers = [...counts].sort((a, b) => this.collator.compare(String(a[0]), String(b[0])));
  }

  static setPanelsAndJudges(panels, judges) {
    const json = JSON.stringify([panels, judges]);
    if (json === this.lastJson) return false;
    this.lastJson = json;
    this.panels = (panels || [])
      .map((p) => ({
        ...p,
        _id: this.id(p),
        stage: Number(p.stage),
        judges: (p.judges || []).filter(Boolean),
        teams: (p.teams || []).filter(Boolean),
      }))
      .sort((a, b) => this.collator.compare(a.name || '', b.name || ''));
    this.judges = (judges || [])
      .map((j) => ({
        _id: this.id(j),
        name: j.name || '',
        email: j.email || '',
        _search: `${j.name || ''} ${j.email || ''}`.toLowerCase(),
      }))
      .sort((a, b) => this.collator.compare(a.name, b.name));
    return true;
  }

  static renderAll() {
    this.renderStats();
    const tabs = document.getElementById('panelTabs');
    if (tabs) tabs.innerHTML = this.renderTabs();
    this.renderTable();
  }

  static renderStats() {
    const el = document.getElementById('panelStats');
    if (!el) return;
    const s1 = this.panels.filter((p) => p.stage === 1);
    const s2 = this.panels.filter((p) => p.stage === 2);
    const onPanels = new Set(this.panels.flatMap((p) => p.judges.map((j) => this.id(j))));
    const s1Teams = new Set(s1.flatMap((p) => p.teams.map((t) => this.id(t))));
    const s2Teams = new Set(s2.flatMap((p) => p.teams.map((t) => this.id(t))));
    const judgesOnPanels = this.judges.filter((j) => onPanels.has(j._id)).length;
    const unassignedTeams = this.teams.filter((t) => !s1Teams.has(t._id)).length;
    const card = (label, value, sub, icon, tone) => `
      <div class="stat-card">
        <div class="stat-icon ${tone}">${this.svg(icon, 'h-5 w-5')}</div>
        <div class="min-w-0">
          <p class="stat-label">${label}</p>
          <p class="stat-value">${value}</p>
          <p class="truncate text-xs text-slate-500">${sub}</p>
        </div>
      </div>`;
    el.innerHTML = [
      card('Stage 1 panels', s1.length, `${this.plural(s1Teams.size, 'team')} assigned`, Sidebar.icons.panels, 'bg-blue-50 text-blue-600'),
      card('Stage 2 award panels', s2.length, `${this.plural(s2Teams.size, 'qualified team')}`, Sidebar.icons.trophy, 'bg-purple-50 text-purple-600'),
      card(
        'Judges on panels',
        `${judgesOnPanels}<span class="text-base font-normal text-slate-400"> / ${this.judges.length}</span>`,
        `${this.judges.length - judgesOnPanels} not on any panel`,
        Sidebar.icons.judges,
        'bg-emerald-50 text-emerald-600',
      ),
      card(
        'Teams without a Stage 1 panel',
        unassignedTeams,
        unassignedTeams ? 'Assign them before judging starts' : 'Every team has a panel',
        Sidebar.icons.teams,
        unassignedTeams ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600',
      ),
    ].join('');
  }

  static renderTabs() {
    return [1, 2]
      .map((stage) => {
        const active = this.stage === stage;
        const count = this.panels.filter((p) => p.stage === stage).length;
        const pill = active ? (stage === 1 ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700') : 'bg-slate-200 text-slate-600';
        return `
          <button type="button" onclick="PanelManagementPage.setStage(${stage})" aria-pressed="${active}"
            class="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
            Stage ${stage}
            <span class="rounded-full px-1.5 text-xs ${pill}">${count}</span>
          </button>`;
      })
      .join('');
  }

  static setStage(stage) {
    this.stage = stage;
    document.getElementById('panelTabs').innerHTML = this.renderTabs();
    this.renderTable();
  }

  static onSearch = UI.debounce((value) => {
    PanelManagementPage.query = value.trim().toLowerCase();
    PanelManagementPage.renderTable();
  }, 150);

  // Stage 1 criteria a panel scores (a panel without a selection scores all of them)
  static panelCriteria(p) {
    const ids = (p.criteria || []).map(String);
    return ids.length ? this.criteria.filter((c) => ids.includes(c._id)) : this.criteria;
  }

  static matches(p, q) {
    return (
      [p.name, p.awardType].some((v) => (v || '').toLowerCase().includes(q)) ||
      p.judges.some((j) => `${j.name || ''} ${j.email || ''}`.toLowerCase().includes(q)) ||
      p.teams.some((t) => (t.name || '').toLowerCase().includes(q))
    );
  }

  static renderTable() {
    const el = document.getElementById('panelsTable');
    if (!el || !this.loaded) return;
    const q = this.query;
    const list = this.panels.filter((p) => p.stage === this.stage);
    const rows = q ? list.filter((p) => this.matches(p, q)) : list;
    if (!list.length) {
      el.innerHTML = `
        ${UI.emptyState(`No Stage ${this.stage} panels yet`, 'Create a panel to start assigning judges and teams.')}
        <div class="-mt-6 pb-10 text-center">
          <button type="button" onclick="PanelManagementPage.openEditor()" class="btn btn-primary">${this.svg(this.ICONS.plus)} New panel</button>
        </div>`;
      return;
    }
    if (!rows.length) {
      el.innerHTML = UI.emptyState('No panels match your search', `Nothing in Stage ${this.stage} matches "${q}".`);
      return;
    }
    el.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th class="w-10"><span class="sr-only">Expand</span></th>
            <th>Panel</th>
            <th>Judges</th>
            <th>Teams</th>
            <th class="!text-right">Actions</th>
          </tr>
        </thead>
        <tbody>${rows.map((p) => this.renderRow(p, q)).join('')}</tbody>
      </table>
      ${q ? `<p class="border-t border-slate-200 px-5 py-3 text-sm text-slate-500">${rows.length} of ${this.plural(list.length, 'panel')} match</p>` : ''}`;
  }

  static renderRow(p, q) {
    const id = UI.escape(p._id);
    const open = this.expanded.has(p._id);
    const judgeNames = p.judges.map((j) => j.name).filter(Boolean).join(', ');
    const teamHits = q ? p.teams.filter((t) => (t.name || '').toLowerCase().includes(q)) : [];
    const criteriaNames = p.stage === 1 ? this.panelCriteria(p).map((c) => c.name).join(', ') : '';
    return `
      <tr class="cursor-pointer" onclick="PanelManagementPage.toggleExpand('${id}')" aria-expanded="${open}">
        <td class="!pr-0">
          <span class="block text-slate-400 transition-transform ${open ? 'rotate-90' : ''}">${this.svg(this.ICONS.chevron)}</span>
        </td>
        <td>
          <p class="font-medium text-slate-900">${UI.escape(p.name)}</p>
          ${p.stage === 2 ? `<span class="badge ${p.awardType ? 'badge-purple' : 'badge-red'} mt-1">${UI.escape(p.awardType || 'No award set')}</span>` : ''}
          ${
            p.stage !== 1
              ? ''
              : criteriaNames
                ? `<p class="mt-1 max-w-[18rem] truncate text-xs text-slate-500" title="${UI.escape(criteriaNames)}">Criteria: ${UI.escape(criteriaNames)}</p>`
                : '<span class="badge badge-red mt-1">No criteria</span>'
          }
          ${
            teamHits.length
              ? `<p class="mt-1 text-xs text-blue-700">Team match: ${UI.escape(teamHits.slice(0, 2).map((t) => t.name).join(', '))}${teamHits.length > 2 ? ` +${teamHits.length - 2}` : ''}</p>`
              : ''
          }
        </td>
        <td>
          ${
            p.judges.length
              ? `<p class="font-medium text-slate-900">${this.plural(p.judges.length, 'judge')}</p>
                 <p class="max-w-[16rem] truncate text-xs text-slate-500" title="${UI.escape(judgeNames)}">${UI.escape(judgeNames)}</p>`
              : '<span class="badge badge-yellow">No judges</span>'
          }
        </td>
        <td>${p.teams.length ? `<span class="badge badge-blue">${this.plural(p.teams.length, 'team')}</span>` : '<span class="badge badge-yellow">No teams</span>'}</td>
        <td>
          <div class="flex justify-end gap-1">
            <button type="button" onclick="event.stopPropagation(); PanelManagementPage.openEditor('${id}')" class="btn btn-ghost btn-sm">Edit</button>
            <button type="button" onclick="event.stopPropagation(); PanelManagementPage.deletePanel('${id}')" class="btn btn-ghost btn-sm text-red-600 hover:bg-red-50 hover:text-red-700">Delete</button>
          </div>
        </td>
      </tr>
      ${open ? this.renderDetails(p) : ''}`;
  }

  static renderDetails(p) {
    const link = (path, text, cls) => `<a href="${path}" onclick="navigateToPage(event, '${path}')" class="${cls}">${UI.escape(text)}</a>`;
    const heading = (text) => `<h4 class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">${text}</h4>`;
    return `
      <tr class="bg-slate-50/70">
        <td></td>
        <td colspan="4">
          <div class="grid gap-6 py-1 lg:grid-cols-3">
            <div class="min-w-0">
              ${heading(`Judges (${p.judges.length})`)}
              ${
                p.judges.length
                  ? `<ul class="space-y-2">${p.judges
                      .map(
                        (j) => `
                    <li class="min-w-0">
                      ${link(`/admin/judges/${UI.escape(this.id(j))}`, j.name || 'Unnamed judge', 'block truncate text-sm font-medium text-slate-800 hover:text-blue-600')}
                      <span class="block truncate text-xs text-slate-500">${UI.escape(j.email)}</span>
                    </li>`,
                      )
                      .join('')}</ul>`
                  : '<p class="text-sm text-slate-500">No judges assigned.</p>'
              }
            </div>
            <div class="min-w-0 lg:col-span-2">
              ${heading(`Teams (${p.teams.length})`)}
              ${
                p.teams.length
                  ? `<ul class="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">${p.teams
                      .map(
                        (t) => `
                    <li class="truncate text-sm">
                      ${link(`/admin/teams/${UI.escape(this.id(t))}`, t.name || 'Unnamed team', 'font-medium text-slate-800 hover:text-blue-600')}
                      <span class="text-slate-500">· ${UI.escape(t.challenge)}</span>
                    </li>`,
                      )
                      .join('')}</ul>`
                  : '<p class="text-sm text-slate-500">No teams assigned.</p>'
              }
            </div>
          </div>
        </td>
      </tr>`;
  }

  static toggleExpand(panelId) {
    if (!this.expanded.delete(panelId)) this.expanded.add(panelId);
    this.renderTable();
  }

  // ---------- Editor ----------

  static openEditor(panelId) {
    if (!this.loaded) {
      UI.toast('Panels are still loading', 'info');
      return;
    }
    const panel = panelId ? this.panels.find((p) => p._id === panelId) : null;
    if (panelId && !panel) {
      UI.toast('This panel no longer exists', 'error');
      return;
    }
    this.editor = {
      id: panel ? panel._id : null,
      stage: panel ? panel.stage : this.stage,
      selected: {
        judges: new Set(panel ? panel.judges.map((j) => this.id(j)) : []),
        teams: new Set(panel ? panel.teams.map((t) => this.id(t)) : []),
        criteria: new Set(panel && panel.stage === 1 ? this.panelCriteria(panel).map((c) => c._id) : []),
      },
      query: { judges: '', teams: '', criteria: '' },
      selectedOnly: { judges: false, teams: false, criteria: false },
      visible: { judges: [], teams: [], criteria: [] },
      membership: { judges: new Map(), teams: new Map(), criteria: new Map() },
      dirty: false,
      saving: false,
    };
    document.getElementById('panelModalTitle').textContent = panel ? `Edit ${panel.name}` : 'New panel';
    document.getElementById('panelName').value = panel ? panel.name : '';
    document.getElementById('panelStage').value = String(this.editor.stage);
    ['judges', 'teams', 'criteria'].forEach((kind) => {
      document.getElementById(`${kind}Search`).value = '';
      document.getElementById(`${kind}SelectedOnly`).checked = false;
    });
    this.renderAwardOptions(panel && panel.awardType);
    document.getElementById('panelNumberSelect').innerHTML =
      '<option value="">Add by panel number…</option>' +
      this.panelNumbers.map(([pn, count]) => `<option value="${UI.escape(pn)}">Panel number ${UI.escape(pn)} (${count})</option>`).join('');
    const saveBtn = document.getElementById('panelSaveBtn');
    saveBtn.disabled = false;
    saveBtn.textContent = panel ? 'Save changes' : 'Create panel';
    this.setEditorTab('members');
    this.applyStage();
    document.getElementById('panelModal').classList.remove('hidden');
    document.getElementById('panelName').focus();
  }

  static renderAwardOptions(current) {
    const used = new Map(
      this.panels.filter((p) => p.stage === 2 && p._id !== this.editor.id && p.awardType).map((p) => [p.awardType, p.name]),
    );
    const value = current || this.AWARD_TYPES.find((a) => !used.has(a)) || '';
    document.getElementById('panelAward').innerHTML =
      '<option value="">Select an award…</option>' +
      this.AWARD_TYPES.map(
        (a) => `<option value="${UI.escape(a)}" ${a === value ? 'selected' : ''}>${UI.escape(a)}${used.has(a) ? ' (in use)' : ''}</option>`,
      ).join('');
  }

  static onStageChange(value) {
    if (!this.editor) return;
    this.editor.stage = Number(value);
    this.editor.dirty = true;
    this.applyStage();
  }

  static setEditorTab(tab) {
    document.getElementById('panelMembersTab').classList.toggle('hidden', tab !== 'members');
    document.getElementById('panelCriteriaTab').classList.toggle('hidden', tab !== 'criteria');
    document.querySelectorAll('#panelEditorTabs [data-tab]').forEach((btn) => {
      const active = btn.dataset.tab === tab;
      btn.classList.toggle('border-blue-600', active);
      btn.classList.toggle('text-blue-700', active);
      btn.classList.toggle('border-transparent', !active);
      btn.classList.toggle('text-slate-500', !active);
    });
  }

  static applyStage() {
    const ed = this.editor;
    document.getElementById('panelAwardWrap').classList.toggle('hidden', ed.stage !== 2);
    document.getElementById('panelNumberWrap').classList.toggle('hidden', ed.stage !== 1);
    document.getElementById('panelEditorTabs').classList.toggle('hidden', ed.stage !== 1);
    if (ed.stage !== 1) this.setEditorTab('members');
    // Other panels of the same stage each judge/team already sits on (teams only matter for Stage 1)
    const judges = new Map();
    const teams = new Map();
    const add = (map, key, name) => (map.get(key) || map.set(key, []).get(key)).push(name);
    this.panels.forEach((p) => {
      if (p.stage !== ed.stage || p._id === ed.id) return;
      p.judges.forEach((j) => add(judges, this.id(j), p.name));
      if (ed.stage === 1) p.teams.forEach((t) => add(teams, this.id(t), p.name));
    });
    ed.membership = { judges, teams, criteria: new Map() };
    this.renderPicker('judges');
    this.renderPicker('teams');
    this.renderPicker('criteria');
  }

  static renderPicker(kind) {
    const ed = this.editor;
    const list = document.getElementById(`${kind}List`);
    if (!ed || !list) return;
    const sel = ed.selected[kind];
    const q = ed.query[kind];
    const source = kind === 'teams' ? this.teams : kind === 'criteria' ? this.criteria : this.judges;
    const matches = source.filter((x) => (!ed.selectedOnly[kind] || sel.has(x._id)) && (!q || x._search.includes(q)));
    const items = matches.filter((x) => sel.has(x._id)).concat(matches.filter((x) => !sel.has(x._id)));
    ed.visible[kind] = items.map((x) => x._id);
    list.innerHTML = items.length
      ? items.map((x) => this.pickerOption(kind, x, sel.has(x._id), ed.membership[kind].get(x._id))).join('')
      : `<p class="px-4 py-10 text-center text-sm text-slate-500">${source.length ? 'Nothing matches your filters' : `No ${kind} found`}</p>`;
    this.updateCounts();
  }

  static pickerOption(kind, item, checked, others) {
    const isTeam = kind === 'teams';
    const note = others ? (isTeam ? `Also in ${others[0]}${others.length > 1 ? ` +${others.length - 1}` : ''}` : `${this.plural(others.length, 'other panel')}`) : '';
    return `
      <label class="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-slate-50 ${checked ? 'bg-blue-50/60' : ''}">
        <input type="checkbox" value="${UI.escape(item._id)}" ${checked ? 'checked' : ''} class="h-4 w-4 shrink-0 accent-blue-600">
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm font-medium text-slate-900">${UI.escape(item.name)}</span>
          <span class="block truncate text-xs text-slate-500">${UI.escape(isTeam ? item.challenge : kind === 'criteria' ? item.detail : item.email)}</span>
        </span>
        ${note ? `<span class="shrink-0 text-xs ${isTeam ? 'text-amber-600' : 'text-slate-400'}" title="${UI.escape(others.join(', '))}">${UI.escape(note)}</span>` : ''}
        ${isTeam && item.panelNumber ? `<span class="badge badge-gray shrink-0">#${UI.escape(item.panelNumber)}</span>` : ''}
      </label>`;
  }

  static updateCounts() {
    const ed = this.editor;
    const judges = ed.selected.judges.size;
    const teams = ed.selected.teams.size;
    document.getElementById('judgesCount').textContent = `${judges} selected`;
    document.getElementById('teamsCount').textContent = `${teams} of ${this.teams.length} selected`;
    const criteria = ed.selected.criteria.size;
    document.getElementById('criteriaCount').textContent = `${criteria} of ${this.criteria.length} selected`;
    const badge = document.getElementById('criteriaTabBadge');
    badge.className = `badge ${criteria ? 'badge-blue' : 'badge-yellow'}`;
    badge.textContent = criteria ? `${criteria} of ${this.criteria.length}` : 'Choose';
    const shared = [...ed.selected.teams].filter((id) => ed.membership.teams.has(id)).length;
    document.getElementById('panelSummary').innerHTML = `${this.plural(judges, 'judge')} · ${this.plural(teams, 'team')}${
      shared ? ` · <span class="text-amber-600">${this.plural(shared, 'team')} also in another Stage 1 panel</span>` : ''
    }`;
  }

  static onPick(event, kind) {
    const box = event.target;
    if (!this.editor || box.type !== 'checkbox') return;
    const sel = this.editor.selected[kind];
    if (box.checked) sel.add(box.value);
    else sel.delete(box.value);
    box.closest('label').classList.toggle('bg-blue-50/60', box.checked);
    this.editor.dirty = true;
    this.updateCounts();
  }

  static onPickerSearch = UI.debounce((kind, value) => {
    const ed = PanelManagementPage.editor;
    if (!ed) return;
    ed.query[kind] = value.trim().toLowerCase();
    PanelManagementPage.renderPicker(kind);
  }, 120);

  static toggleSelectedOnly(kind, checked) {
    if (!this.editor) return;
    this.editor.selectedOnly[kind] = checked;
    this.renderPicker(kind);
  }

  static selectVisible(kind) {
    const ed = this.editor;
    if (!ed) return;
    ed.visible[kind].forEach((id) => ed.selected[kind].add(id));
    ed.dirty = true;
    this.renderPicker(kind);
  }

  static clearSelection(kind) {
    const ed = this.editor;
    if (!ed || !ed.selected[kind].size) return;
    ed.selected[kind].clear();
    ed.dirty = true;
    this.renderPicker(kind);
  }

  static addByPanelNumber(value) {
    const ed = this.editor;
    document.getElementById('panelNumberSelect').value = '';
    if (!ed || !value) return;
    const matching = this.teams.filter((t) => t.panelNumber === value);
    matching.forEach((t) => ed.selected.teams.add(t._id));
    ed.dirty = true;
    this.renderPicker('teams');
    UI.toast(`Selected ${this.plural(matching.length, 'team')} with panel number ${value}`, 'success');
  }

  static markDirty() {
    if (this.editor) this.editor.dirty = true;
  }

  static async closeEditor(force = false) {
    const ed = this.editor;
    if (!ed || (!force && ed.saving)) return;
    if (
      !force &&
      ed.dirty &&
      !(await UI.confirm({
        title: 'Discard changes?',
        message: 'Your changes to this panel have not been saved.',
        confirmText: 'Discard',
        danger: true,
      }))
    ) {
      return;
    }
    this.editor = null;
    document.getElementById('panelModal')?.classList.add('hidden');
    if (!force) this.poll();
  }

  static async save(event) {
    event.preventDefault();
    const ed = this.editor;
    if (!ed || ed.saving) return;
    const nameInput = document.getElementById('panelName');
    const awardSelect = document.getElementById('panelAward');
    const name = nameInput.value.trim();
    if (!name) {
      UI.toast('Give the panel a name', 'error');
      nameInput.focus();
      return;
    }
    if (ed.stage === 2 && !awardSelect.value) {
      UI.toast('Choose the award this Stage 2 panel judges', 'error');
      awardSelect.focus();
      return;
    }
    if (ed.stage === 1 && !ed.selected.criteria.size) {
      UI.toast('Choose the Stage 1 criteria this panel scores', 'error');
      this.setEditorTab('criteria');
      return;
    }
    const body = { name, stage: ed.stage, judges: [...ed.selected.judges], teams: [...ed.selected.teams] };
    if (ed.stage === 2) body.awardType = awardSelect.value;
    if (ed.stage === 1) body.criteria = [...ed.selected.criteria];

    const btn = document.getElementById('panelSaveBtn');
    const label = btn.textContent;
    ed.saving = true;
    btn.disabled = true;
    btn.innerHTML = `${this.SPINNER} Saving…`;
    try {
      await UI.api(ed.id ? `/api/panels/${ed.id}` : '/api/panels', { method: ed.id ? 'PUT' : 'POST', body });
      UI.toast(ed.id ? `Saved ${name}` : `Created ${name}`, 'success');
      this.stage = ed.stage;
      this.closeEditor(true);
      await this.syncPanels(true).catch((e) => UI.toast(`Saved, but refreshing the list failed: ${e.message}`, 'warning'));
    } catch (e) {
      UI.toast(`Could not save panel: ${e.message}`, 'error');
    } finally {
      ed.saving = false;
      btn.disabled = false;
      btn.textContent = label;
    }
  }

  static async deletePanel(panelId) {
    const panel = this.panels.find((p) => p._id === panelId);
    if (!panel) return;
    const ok = await UI.confirm({
      title: `Delete ${panel.name}?`,
      message: `This permanently deletes the panel and unassigns its ${this.plural(panel.judges.length, 'judge')} and ${this.plural(panel.teams.length, 'team')}. This cannot be undone.`,
      confirmText: 'Delete panel',
      danger: true,
    });
    if (!ok) return;
    try {
      await UI.api(`/api/panels/${panel._id}`, { method: 'DELETE' });
    } catch (e) {
      UI.toast(`Could not delete panel: ${e.message}`, 'error');
      return;
    }
    this.expanded.delete(panel._id);
    this.panels = this.panels.filter((p) => p._id !== panel._id);
    this.renderAll();
    UI.toast(`Deleted ${panel.name}`, 'success');
    this.syncPanels(true).catch(() => {});
  }
}
