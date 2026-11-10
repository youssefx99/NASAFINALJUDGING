// Winners Page
class WinnersPage {
  static ICONS = {
    refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    alert: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  };

  static svg(d, cls = 'h-5 w-5') {
    return `<svg class="${cls}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${d}"></path></svg>`;
  }

  static render() {
    const skeleton =
      '<div class="card space-y-4 p-5"><div class="skeleton h-3 w-1/2"></div><div class="flex items-center gap-3"><div class="skeleton h-10 w-10 rounded-full"></div><div class="skeleton h-5 w-2/3"></div></div><div class="skeleton h-8 w-1/3"></div></div>';
    return Layout.admin({
      title: 'Award Winners',
      subtitle: 'Stage 2 results for each award panel',
      actions: `
        <button type="button" id="winnersRefreshBtn" onclick="WinnersPage.loadWinners()" class="btn btn-secondary">
          ${WinnersPage.svg(WinnersPage.ICONS.refresh, 'h-4 w-4')} Refresh
        </button>
        <button type="button" onclick="router.navigate('/winners/leaderboard')" class="btn btn-primary">
          ${Sidebar.icon('presentation', 'h-4 w-4')} Ceremony presentation
        </button>`,
      content: `
        <div id="winnersSummary" class="mb-6"></div>
        <div id="winnersGrid" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">${skeleton.repeat(6)}</div>`,
    });
  }

  static afterRender() {
    WinnersPage.loadWinners();
  }

  static async loadWinners() {
    const btn = document.getElementById('winnersRefreshBtn');
    if (btn) btn.disabled = true;
    try {
      const res = await UI.api('/api/winners/award-status');
      if (!document.getElementById('winnersGrid')) return;
      if (!res || res.success === false) throw new Error((res && res.error) || 'The server could not compute award results');
      WinnersPage.renderAllPanels(res);
    } catch (e) {
      if (document.getElementById('winnersGrid')) WinnersPage.renderError(e.message);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  static renderAllPanels({ data, totalAwards, awardsWithWinners }) {
    const grid = document.getElementById('winnersGrid');
    const summary = document.getElementById('winnersSummary');
    const awards = Array.isArray(data) ? data : [];
    if (!awards.length) {
      summary.innerHTML = '';
      grid.innerHTML = `<div class="card col-span-full">${UI.emptyState('No award panels found', 'Stage 2 award panels will appear here once they are set up.')}</div>`;
      return;
    }
    const total = Number(totalAwards) || awards.length;
    const decided = Number(awardsWithWinners ?? awards.filter((a) => a.hasWinner).length) || 0;
    const pct = Math.round((decided / total) * 100);
    const remaining = total - decided;
    summary.innerHTML = `
      <div class="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div class="stat-icon bg-amber-50 text-amber-600">${this.svg(this.ICONS.star)}</div>
        <div class="flex-1">
          <p class="text-sm font-medium text-slate-900">${decided} of ${total} awards decided</p>
          <div class="progress mt-2"><div class="progress-bar bg-amber-500" style="width: ${pct}%"></div></div>
        </div>
        <p class="text-sm text-slate-500">${remaining ? `${remaining} award${remaining === 1 ? '' : 's'} still in judging` : 'Every award has a winner'}</p>
      </div>`;
    grid.innerHTML = awards.map((award) => (award.hasWinner ? this.winnerCard(award) : this.pendingCard(award))).join('');
  }

  static winnerCard(award) {
    const score = typeof award.winnerScore === 'number' ? award.winnerScore.toFixed(2) : '--';
    const judges = Number(award.judgeCount) || 0;
    return `
      <div class="card relative overflow-hidden border-amber-200">
        <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400"></div>
        <div class="p-5">
          <div class="flex items-start justify-between gap-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${UI.escape(award.awardType)}</p>
            <span class="badge badge-yellow shrink-0">Winner</span>
          </div>
          <div class="mt-3 flex items-center gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">${this.svg(this.ICONS.star)}</div>
            <p class="min-w-0 break-words text-lg font-semibold text-slate-900">${UI.escape(award.winnerTeam || 'Unknown team')}</p>
          </div>
          <div class="mt-5 flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
            <div>
              <p class="text-2xl font-semibold tabular-nums text-amber-600">${score}</p>
              <p class="text-xs text-slate-500">Final score</p>
            </div>
            <p class="text-sm text-slate-500">${judges} judge${judges === 1 ? '' : 's'}</p>
          </div>
        </div>
      </div>`;
  }

  static pendingCard(award) {
    return `
      <div class="card border-dashed p-5">
        <div class="flex items-start justify-between gap-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${UI.escape(award.awardType)}</p>
          <span class="badge badge-gray shrink-0">Pending</span>
        </div>
        <div class="mt-3 flex items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">${this.svg(this.ICONS.clock)}</div>
          <p class="text-lg font-semibold text-slate-400">No winner yet</p>
        </div>
        <div class="mt-5 border-t border-slate-100 pt-4">
          <p class="text-2xl font-semibold text-slate-300">--</p>
          <p class="text-xs text-slate-500">Stage 2 judging in progress</p>
        </div>
      </div>`;
  }

  static renderError(message) {
    document.getElementById('winnersSummary').innerHTML = '';
    document.getElementById('winnersGrid').innerHTML = `
      <div class="card col-span-full flex flex-col items-center px-6 py-12 text-center">
        <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">${this.svg(this.ICONS.alert, 'h-6 w-6')}</div>
        <p class="text-sm font-medium text-slate-900">Couldn't load award results</p>
        <p class="mt-1 text-sm text-slate-500">${UI.escape(message)}</p>
        <button type="button" onclick="WinnersPage.loadWinners()" class="btn btn-secondary mt-4">Try again</button>
      </div>`;
  }
}
