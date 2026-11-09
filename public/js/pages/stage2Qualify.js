// Stage 2 Qualification Management Page
class Stage2QualifyPage {
  static PREVIEW_PER_PAGE = 20;

  static ICONS = {
    refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    alert: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    judges: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    close: 'M6 18L18 6M6 6l12 12',
  };

  static SPINNER =
    '<svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>';

  static stats = null;
  static preview = [];
  static previewLimit = null;
  static previewPage = 1;
  static previewSeq = 0;
  static judgesSeq = 0;
  static judgesPagination = { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 };

  static svg(d, cls = 'h-5 w-5') {
    return `<svg class="${cls}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${d}"></path></svg>`;
  }

  static errorBlock(title, message, retry) {
    return `
      <div class="flex flex-col items-center px-6 py-10 text-center">
        <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">${this.svg(this.ICONS.alert, 'h-6 w-6')}</div>
        <p class="text-sm font-medium text-slate-900">${title}</p>
        <p class="mt-1 text-sm text-slate-500">${UI.escape(message)}</p>
        <button type="button" onclick="${retry}" class="btn btn-secondary mt-4">Try again</button>
      </div>`;
  }

  static render() {
    const statSkeleton =
      '<div class="card space-y-3 p-5"><div class="skeleton h-3 w-28"></div><div class="skeleton h-7 w-16"></div><div class="skeleton h-3 w-40"></div></div>';
    return (
      Layout.admin({
        title: 'Stage 2 Qualification',
        subtitle: 'Review Stage 1 completion and send the top teams to every Stage 2 award panel',
        actions: `
          <button type="button" onclick="Stage2QualifyPage.load()" class="btn btn-secondary">
            ${Stage2QualifyPage.svg(Stage2QualifyPage.ICONS.refresh, 'h-4 w-4')} Refresh
          </button>`,
        content: `
          <div class="space-y-6">
            <div id="qualifyStats" class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">${statSkeleton.repeat(4)}</div>
            <div class="grid items-start gap-6 xl:grid-cols-3">
              <div class="card xl:col-span-2">
                <div class="card-header">
                  <div>
                    <h2 class="card-title">Ranking preview</h2>
                    <p id="previewSubtitle" class="mt-0.5 text-sm text-slate-500">Top teams by Stage 1 average score</p>
                  </div>
                </div>
                <div class="overflow-x-auto">
                  <table class="table">
                    <thead>
                      <tr>
                        <th class="w-16">Rank</th>
                        <th>Team</th>
                        <th>Challenge</th>
                        <th class="!text-right">Avg score</th>
                        <th class="!text-right">Judges</th>
                      </tr>
                    </thead>
                    <tbody id="top60Table">${UI.skeletonRows(5, 8)}</tbody>
                  </table>
                </div>
                <div id="previewPagination"></div>
              </div>

              <div class="card overflow-hidden xl:sticky xl:top-24">
                <div class="border-b border-purple-100 bg-gradient-to-br from-purple-50 to-blue-50 px-5 py-4">
                  <h2 class="card-title">Qualify teams</h2>
                  <p class="mt-0.5 text-sm text-slate-600">Send the highest Stage 1 averages to Stage 2.</p>
                </div>
                <div class="card-body space-y-4">
                  <div>
                    <label for="teamLimitInput" class="label">Number of teams</label>
                    <div class="flex gap-2">
                      <input id="teamLimitInput" type="number" min="1" max="500" step="1" value="60"
                        oninput="Stage2QualifyPage.onLimitInput()" class="input text-center text-lg font-semibold">
                      <button type="button" onclick="Stage2QualifyPage.previewTopTeams()" class="btn btn-secondary">Preview</button>
                    </div>
                    <p class="mt-1 text-xs text-slate-500">Between 1 and 500 (default 60).</p>
                  </div>
                  <div id="qualifyWarning"></div>
                  <p class="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                    The top <strong id="qualifyCount" class="text-purple-700">60</strong> teams will be assigned to <strong>every</strong> Stage 2 award panel,
                    replacing the teams those panels have now.
                  </p>
                  <button type="button" id="qualifyBtn" onclick="Stage2QualifyPage.qualifyTeams()"
                    class="btn w-full bg-purple-600 py-3 text-base text-white hover:bg-purple-700 focus-visible:ring-purple-500">
                    <span>Qualify top <span id="qualifyBtnCount">60</span> teams</span>
                  </button>
                </div>
              </div>
            </div>
          </div>`,
      }) +
      `
      <div id="incompleteJudgesModal" onclick="if (event.target === this) Stage2QualifyPage.hideIncompleteJudges()"
        class="fixed inset-0 z-50 hidden overflow-y-auto bg-slate-900/50 p-4 sm:p-6">
        <div class="card mx-auto flex max-h-[90vh] w-full max-w-4xl flex-col" role="dialog" aria-modal="true" aria-labelledby="incompleteJudgesTitle">
          <div class="card-header">
            <div class="min-w-0">
              <h3 id="incompleteJudgesTitle" class="card-title">Judges with pending Stage 1 scores</h3>
              <p id="judgesPaginationInfo" class="mt-0.5 text-sm text-slate-500">Loading…</p>
            </div>
            <div class="flex items-center gap-2">
              <label for="judgesPerPage" class="text-sm text-slate-500">Per page</label>
              <select id="judgesPerPage" onchange="Stage2QualifyPage.changeJudgesPerPage()" class="input w-auto py-1.5">
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <button type="button" onclick="Stage2QualifyPage.hideIncompleteJudges()" aria-label="Close" class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                ${Stage2QualifyPage.svg(Stage2QualifyPage.ICONS.close)}
              </button>
            </div>
          </div>
          <div class="min-h-0 flex-1 overflow-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Judge</th>
                  <th class="!text-right">Assigned</th>
                  <th class="!text-right">Scored</th>
                  <th class="!text-right">Pending</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody id="incompleteJudgesTable"></tbody>
            </table>
          </div>
          <div id="judgesPagination"></div>
        </div>
      </div>`
    );
  }

  static afterRender() {
    Stage2QualifyPage.stats = null;
    Stage2QualifyPage.previewLimit = null;
    Stage2QualifyPage.load();
  }

  // Stats and ranking preview are independent, so fetch them in parallel
  static async load() {
    this.previewTopTeams(true);
    try {
      const stats = await UI.api('/api/stage2-qualification/stats');
      if (!document.getElementById('qualifyStats')) return;
      this.stats = stats || {};
      this.renderStats();
      this.renderWarning();
    } catch (e) {
      const el = document.getElementById('qualifyStats');
      if (el) el.innerHTML = `<div class="card sm:col-span-2 xl:col-span-4">${this.errorBlock("Couldn't load Stage 1 progress", e.message, 'Stage2QualifyPage.load()')}</div>`;
    }
  }

  static renderStats() {
    const s = this.stats;
    const ready = Number(s.readyTeams) || 0;
    const incompleteTeams = Number(s.incompleteTeams) || 0;
    const incompleteJudges = Number(s.incompleteJudges) || 0;
    const total = Number(s.totalStage1Teams) || 0;
    const pct = total ? Math.round((ready / total) * 100) : 0;
    const card = ({ label, value, sub, icon, tone, extra = '' }) => `
      <div class="card p-5">
        <div class="flex items-center justify-between gap-3">
          <p class="stat-label">${label}</p>
          <div class="stat-icon h-9 w-9 ${tone}">${this.svg(icon)}</div>
        </div>
        <p class="stat-value tabular-nums">${value}</p>
        <p class="mt-1 text-xs text-slate-500">${sub}</p>
        ${extra}
      </div>`;
    document.getElementById('qualifyStats').innerHTML = [
      card({
        label: 'Ready for Stage 2',
        value: ready,
        sub: `${pct}% of ${total} teams fully scored`,
        icon: this.ICONS.check,
        tone: 'bg-emerald-50 text-emerald-600',
        extra: `<div class="progress mt-3"><div class="progress-bar bg-emerald-500" style="width: ${pct}%"></div></div>`,
      }),
      card({
        label: 'Incomplete teams',
        value: incompleteTeams,
        sub: 'Still missing at least one judge score',
        icon: this.ICONS.alert,
        tone: 'bg-amber-50 text-amber-600',
      }),
      card({
        label: 'Incomplete judges',
        value: incompleteJudges,
        sub: 'Judges with teams left to score',
        icon: this.ICONS.judges,
        tone: 'bg-orange-50 text-orange-600',
        extra: incompleteJudges
          ? '<button type="button" onclick="Stage2QualifyPage.showIncompleteJudges()" class="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800">View judges →</button>'
          : '',
      }),
      card({
        label: 'Stage 1 teams',
        value: total,
        sub: 'Teams assigned to Stage 1 panels',
        icon: Sidebar.icons.teams,
        tone: 'bg-blue-50 text-blue-600',
      }),
    ].join('');
  }

  static renderWarning() {
    const el = document.getElementById('qualifyWarning');
    if (!el) return;
    const notes = [];
    const incomplete = Number(this.stats && this.stats.incompleteTeams) || 0;
    if (incomplete) notes.push(`${incomplete} Stage 1 team${incomplete === 1 ? ' is' : 's are'} still missing scores, so the ranking may still change.`);
    if (this.previewLimit && this.preview.length < this.previewLimit && this.previewLimit === this.readLimit()) {
      notes.push(`Only ${this.preview.length} teams have Stage 1 scores, so only ${this.preview.length} will qualify.`);
    }
    el.innerHTML = notes.length
      ? `<div class="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">${notes.map((n) => `<p>${n}</p>`).join('')}</div>`
      : '';
  }

  static readLimit() {
    const value = Number(document.getElementById('teamLimitInput')?.value);
    return Number.isInteger(value) && value >= 1 && value <= 500 ? value : null;
  }

  static onLimitInput() {
    const limit = this.readLimit();
    document.getElementById('qualifyCount').textContent = limit || '–';
    const btnCount = document.getElementById('qualifyBtnCount');
    if (btnCount) btnCount.textContent = limit || '–';
    document.getElementById('qualifyBtn').disabled = !limit;
    this.renderWarning();
    if (limit) this.autoPreview();
  }

  static autoPreview = UI.debounce(() => Stage2QualifyPage.previewTopTeams(true), 500);

  static async previewTopTeams(silent = false) {
    const limit = this.readLimit();
    if (!limit) {
      if (!silent) {
        UI.toast('Enter a number between 1 and 500', 'error');
        document.getElementById('teamLimitInput').focus();
      }
      return;
    }
    const seq = ++this.previewSeq;
    const tbody = document.getElementById('top60Table');
    tbody.innerHTML = UI.skeletonRows(5, 8);
    document.getElementById('previewPagination').innerHTML = '';
    try {
      const teams = await UI.api(`/api/stage2-qualification/top-teams?limit=${limit}`);
      if (seq !== this.previewSeq || !document.getElementById('top60Table')) return;
      this.preview = Array.isArray(teams) ? teams : [];
      this.previewLimit = limit;
      this.previewPage = 1;
      this.renderPreview();
      this.renderWarning();
    } catch (e) {
      if (seq !== this.previewSeq || !document.getElementById('top60Table')) return;
      tbody.innerHTML = `<tr><td colspan="5">${this.errorBlock("Couldn't load the ranking", e.message, 'Stage2QualifyPage.previewTopTeams()')}</td></tr>`;
    }
  }

  static renderPreview() {
    const tbody = document.getElementById('top60Table');
    const pager = document.getElementById('previewPagination');
    const total = this.preview.length;
    document.getElementById('previewSubtitle').textContent = !total
      ? 'No ranked teams yet'
      : total < this.previewLimit
        ? `Only ${total} of the ${this.previewLimit} requested teams have Stage 1 scores`
        : `The ${total} teams that would qualify, ranked by Stage 1 average score`;
    if (!total) {
      tbody.innerHTML = `<tr><td colspan="5">${UI.emptyState('No scored teams yet', 'Teams appear here once Stage 1 judges submit scores.')}</td></tr>`;
      pager.innerHTML = '';
      return;
    }
    const per = this.PREVIEW_PER_PAGE;
    const start = (this.previewPage - 1) * per;
    tbody.innerHTML = this.preview
      .slice(start, start + per)
      .map((team, i) => {
        const rank = start + i + 1;
        const id = UI.escape(team._id);
        const rankTone =
          rank === 1 ? 'bg-amber-100 text-amber-800' : rank === 2 ? 'bg-slate-200 text-slate-700' : rank === 3 ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-600';
        return `
          <tr>
            <td><span class="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full px-2 text-xs font-semibold tabular-nums ${rankTone}">${rank}</span></td>
            <td><a href="/admin/teams/${id}" onclick="navigateToPage(event, '/admin/teams/${id}')" class="font-medium text-slate-900 hover:text-blue-600">${UI.escape(team.name)}</a></td>
            <td><span class="text-slate-500">${UI.escape(team.challenge)}</span></td>
            <td><p class="text-right font-semibold tabular-nums text-blue-600">${(Number(team.averageScore) || 0).toFixed(2)}</p></td>
            <td><p class="text-right tabular-nums">${Number(team.judgeCount) || 0}</p></td>
          </tr>`;
      })
      .join('');
    pager.innerHTML = UI.pagination({ page: this.previewPage, perPage: per, total, onChange: 'Stage2QualifyPage.goToPreviewPage' });
  }

  static goToPreviewPage(page) {
    const pages = Math.ceil(this.preview.length / this.PREVIEW_PER_PAGE);
    if (page < 1 || page > pages) return;
    this.previewPage = page;
    this.renderPreview();
  }

  static showIncompleteJudges() {
    this.judgesPagination.currentPage = 1;
    document.getElementById('judgesPerPage').value = String(this.judgesPagination.itemsPerPage);
    document.getElementById('incompleteJudgesModal').classList.remove('hidden');
    this.loadIncompleteJudges();
  }

  static hideIncompleteJudges() {
    this.judgesSeq++;
    document.getElementById('incompleteJudgesModal')?.classList.add('hidden');
  }

  static async loadIncompleteJudges() {
    const { currentPage, itemsPerPage } = this.judgesPagination;
    const seq = ++this.judgesSeq;
    const tbody = document.getElementById('incompleteJudgesTable');
    tbody.innerHTML = UI.skeletonRows(5, Math.min(itemsPerPage, 8));
    document.getElementById('judgesPagination').innerHTML = '';
    try {
      const data = await UI.api(`/api/stage2-qualification/incomplete-judges?page=${currentPage}&limit=${itemsPerPage}`);
      if (seq !== this.judgesSeq || !document.getElementById('incompleteJudgesTable')) return;
      const judges = (data && data.judges) || [];
      const pagination = (data && data.pagination) || {};
      this.judgesPagination = {
        currentPage: pagination.currentPage || currentPage,
        totalPages: pagination.totalPages || 1,
        totalItems: pagination.totalItems || 0,
        itemsPerPage: pagination.itemsPerPage || itemsPerPage,
      };
      const { totalItems, totalPages } = this.judgesPagination;
      if (!judges.length && totalItems && currentPage > totalPages) {
        this.goToPage(totalPages);
        return;
      }
      document.getElementById('judgesPaginationInfo').textContent = totalItems
        ? `${totalItems} judge${totalItems === 1 ? " hasn't" : "s haven't"} finished scoring their assigned teams`
        : 'Every judge has finished scoring';
      tbody.innerHTML = judges.length
        ? judges.map((judge) => this.renderJudgeRow(judge)).join('')
        : `<tr><td colspan="5">${UI.emptyState('All judges are done', 'Every judge has scored all of their assigned teams.')}</td></tr>`;
      document.getElementById('judgesPagination').innerHTML = UI.pagination({
        page: this.judgesPagination.currentPage,
        perPage: this.judgesPagination.itemsPerPage,
        total: totalItems,
        onChange: 'Stage2QualifyPage.goToPage',
      });
    } catch (e) {
      if (seq !== this.judgesSeq) return;
      document.getElementById('judgesPaginationInfo').textContent = '';
      tbody.innerHTML = `<tr><td colspan="5">${this.errorBlock("Couldn't load judges", e.message, 'Stage2QualifyPage.loadIncompleteJudges()')}</td></tr>`;
    }
  }

  static renderJudgeRow(judge) {
    const assigned = Number(judge.assignedTeams) || 0;
    const scored = Number(judge.scoredTeams) || 0;
    const pct = assigned ? Math.round((scored / assigned) * 100) : 0;
    const name = UI.escape(judge.judgeName || 'Unknown judge');
    const id = judge.judgeId ? UI.escape(judge.judgeId) : '';
    return `
      <tr>
        <td>${
          id
            ? `<a href="/admin/judges/${id}" onclick="navigateToPage(event, '/admin/judges/${id}')" class="font-medium text-slate-900 hover:text-blue-600">${name}</a>`
            : `<span class="font-medium text-slate-900">${name}</span>`
        }</td>
        <td><p class="text-right tabular-nums">${assigned}</p></td>
        <td><p class="text-right font-medium tabular-nums text-emerald-600">${scored}</p></td>
        <td><p class="text-right font-medium tabular-nums text-red-600">${Number(judge.pendingTeams) || 0}</p></td>
        <td>
          <div class="flex items-center gap-2">
            <div class="progress w-24"><div class="progress-bar" style="width: ${pct}%"></div></div>
            <span class="w-9 text-xs tabular-nums text-slate-500">${pct}%</span>
          </div>
        </td>
      </tr>`;
  }

  static goToPage(page) {
    if (page < 1 || page > this.judgesPagination.totalPages) return;
    this.judgesPagination.currentPage = page;
    this.loadIncompleteJudges();
  }

  static changeJudgesPerPage() {
    this.judgesPagination.itemsPerPage = parseInt(document.getElementById('judgesPerPage').value, 10) || 10;
    this.judgesPagination.currentPage = 1;
    this.loadIncompleteJudges();
  }

  static async qualifyTeams() {
    const input = document.getElementById('teamLimitInput');
    const limit = this.readLimit();
    if (!limit) {
      UI.toast('Enter a number between 1 and 500', 'error');
      input.focus();
      return;
    }
    const incomplete = Number(this.stats && this.stats.incompleteTeams) || 0;
    const ok = await UI.confirm({
      title: `Qualify the top ${limit} teams for Stage 2?`,
      message:
        `Every Stage 2 award panel will have its team list replaced with the top ${limit} teams by Stage 1 average score. ` +
        'The teams currently assigned to Stage 2 panels will be overwritten.' +
        (incomplete ? `\n\nHeads up: ${incomplete} Stage 1 teams are still missing scores, so this ranking may not be final.` : ''),
      confirmText: `Qualify ${limit} teams`,
      danger: true,
    });
    if (!ok) return;

    const btn = document.getElementById('qualifyBtn');
    btn.disabled = true;
    input.disabled = true;
    btn.innerHTML = `${this.SPINNER} Qualifying teams…`;
    try {
      const result = (await UI.api('/api/stage2-qualification/qualify', { method: 'POST', body: { limit } })) || {};
      UI.toast(`Qualified ${result.qualifiedTeams ?? limit} teams into ${result.updatedPanels ?? 'all'} Stage 2 panels.`, 'success', 6000);
      this.load();
    } catch (e) {
      UI.toast(
        `Qualification failed: ${e.message}. ${e instanceof TypeError ? 'Check your connection and try again.' : 'Stage 2 panels were left unchanged.'}`,
        'error',
        8000,
      );
    } finally {
      input.disabled = false;
      btn.disabled = false;
      btn.innerHTML = `<span>Qualify top <span id="qualifyBtnCount">${limit}</span> teams</span>`;
    }
  }
}
