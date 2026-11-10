// Special Panels: custom panels outside Stage 1/2. Only the assigned judges see them; each has its own 1–5 questions.
class SpecialPanelsPage {
  static panels = [];
  static judges = [];
  static teams = [];
  static editor = null;
  static PICKER_LIMIT = 150;

  static icons = {
    plus: 'M12 4v16m8-8H4',
    edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    close: 'M6 18L18 6M6 6l12 12',
  };

  static svg(name, cls = 'h-4 w-4') {
    return `<svg class="${cls}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${SpecialPanelsPage.icons[name]}"></path></svg>`;
  }

  static render() {
    const P = SpecialPanelsPage;
    return Layout.admin({
      title: 'Special Panels',
      subtitle: 'Extra panels outside Stage 1 and Stage 2 — only the judges you assign will see them',
      actions: `<button onclick="SpecialPanelsPage.openEditor()" class="btn btn-primary">${P.svg('plus')} New special panel</button>`,
      content: `
        <div class="mb-6 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          Special panels are independent: teams keep their Stage 1 / Stage 2 panels, qualification ignores special panels,
          and each panel's winner appears as an extra category in the Winners Leaderboard ceremony.
        </div>
        <div id="specialPanelList" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          ${'<div class="card p-5 space-y-3"><div class="skeleton h-5 w-1/2"></div><div class="skeleton h-4 w-3/4"></div><div class="skeleton h-8 w-full"></div></div>'.repeat(3)}
        </div>
        <div id="specialModalRoot"></div>
      `,
    });
  }

  static afterRender() {
    SpecialPanelsPage.editor = null;
    SpecialPanelsPage.load();
  }

  static async load() {
    const P = SpecialPanelsPage;
    try {
      const [panels, judges, teams] = await Promise.all([UI.api('/api/panels'), UI.api('/api/users/judges'), UI.api('/api/teams')]);
      P.panels = panels.filter((panel) => panel.stage === 3);
      P.judges = judges;
      P.teams = teams;
      P.renderList();
    } catch (error) {
      const list = document.getElementById('specialPanelList');
      if (list) {
        list.innerHTML = `<div class="card col-span-full p-6 text-center text-sm text-slate-500">Could not load special panels: ${UI.escape(error.message)}
          <div class="mt-3"><button onclick="SpecialPanelsPage.load()" class="btn btn-secondary btn-sm">Retry</button></div></div>`;
      }
    }
  }

  static renderList() {
    const P = SpecialPanelsPage;
    const list = document.getElementById('specialPanelList');
    if (!list) return;
    if (!P.panels.length) {
      list.innerHTML = `<div class="card col-span-full">${UI.emptyState('No special panels yet', 'Create one to judge a custom set of teams with your own questions')}</div>`;
      return;
    }
    list.innerHTML = P.panels
      .map(
        (panel) => `
        <div class="card flex flex-col">
          <div class="h-1 rounded-t-xl bg-teal-500"></div>
          <div class="flex-1 p-5">
            <div class="flex items-start justify-between gap-3">
              <h3 class="break-words text-base font-semibold text-slate-900">${UI.escape(panel.name)}</h3>
              <span class="badge badge-blue shrink-0">Special</span>
            </div>
            <div class="mt-3 flex flex-wrap gap-2 text-xs">
              <span class="badge badge-gray">${(panel.awardCriteria || []).length} question${(panel.awardCriteria || []).length === 1 ? '' : 's'}</span>
              <span class="badge badge-gray">${panel.judges.length} judge${panel.judges.length === 1 ? '' : 's'}</span>
              <span class="badge badge-gray">${panel.teams.length} team${panel.teams.length === 1 ? '' : 's'}</span>
            </div>
            <p class="mt-3 line-clamp-2 text-sm text-slate-500">${panel.judges.length ? UI.escape(panel.judges.map((j) => j.name).join(', ')) : 'No judges assigned yet'}</p>
          </div>
          <div class="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-3">
            <button onclick="SpecialPanelsPage.showResults('${panel._id}')" class="btn btn-secondary btn-sm">${P.svg('chart')} Results</button>
            <button onclick="SpecialPanelsPage.openEditor('${panel._id}')" class="btn btn-secondary btn-sm">${P.svg('edit')} Edit</button>
            <button onclick="SpecialPanelsPage.deletePanel('${panel._id}')" class="btn btn-ghost btn-sm text-red-600 hover:bg-red-50 hover:text-red-700">${P.svg('trash')} Delete</button>
          </div>
        </div>`,
      )
      .join('');
  }

  static modal(content, wide = true) {
    document.getElementById('specialModalRoot').innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onclick="if (event.target === this) SpecialPanelsPage.closeModal()">
        <div class="card flex max-h-[92vh] w-full ${wide ? 'max-w-5xl' : 'max-w-2xl'} flex-col" role="dialog" aria-modal="true">${content}</div>
      </div>`;
  }

  static closeModal() {
    SpecialPanelsPage.editor = null;
    const root = document.getElementById('specialModalRoot');
    if (root) root.innerHTML = '';
  }

  static openEditor(panelId) {
    const P = SpecialPanelsPage;
    const panel = panelId ? P.panels.find((p) => p._id === panelId) : null;
    P.editor = {
      id: panel?._id || null,
      questions: panel ? (panel.awardCriteria || []).map((q) => ({ question: q.question, descriptions: q.descriptions })) : [{ question: '' }],
      judges: new Set(panel ? panel.judges.map((j) => j._id) : []),
      teams: new Set(panel ? panel.teams.map((t) => t._id) : []),
      search: { judges: '', teams: '' },
      selectedOnly: { judges: false, teams: false },
    };
    const picker = (kind, label, placeholder) => `
      <div class="flex min-h-0 flex-col rounded-lg border border-slate-200">
        <div class="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
          <span class="text-sm font-medium text-slate-700">${label}</span>
          <span id="sp_${kind}_count" class="text-xs text-slate-500"></span>
        </div>
        <div class="space-y-2 border-b border-slate-100 p-3">
          <input type="search" class="input" placeholder="${placeholder}" oninput="SpecialPanelsPage.onSearch('${kind}', this.value)">
          <label class="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" class="accent-blue-600" onchange="SpecialPanelsPage.toggleSelectedOnly('${kind}', this.checked)"> Show selected only</label>
        </div>
        <div id="sp_${kind}_list" class="max-h-64 overflow-y-auto" onchange="SpecialPanelsPage.onPick(event, '${kind}')"></div>
      </div>`;

    P.modal(`
      <form onsubmit="SpecialPanelsPage.save(event)" class="flex min-h-0 flex-1 flex-col" novalidate>
        <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 class="text-lg font-semibold text-slate-900">${panel ? 'Edit special panel' : 'New special panel'}</h3>
          <button type="button" onclick="SpecialPanelsPage.closeModal()" class="btn btn-ghost btn-sm" aria-label="Close">${P.svg('close')}</button>
        </div>
        <div class="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <div>
            <label class="label" for="spName">Panel name</label>
            <input id="spName" class="input" maxlength="120" placeholder="e.g. Best Hardware Prototype" value="${UI.escape(panel?.name || '')}">
          </div>
          <div>
            <div class="mb-2 flex items-center justify-between">
              <span class="label mb-0">Questions <span class="font-normal text-slate-500">· judges rate each 1–5</span></span>
              <button type="button" onclick="SpecialPanelsPage.addQuestion()" class="btn btn-secondary btn-sm">${P.svg('plus')} Add question</button>
            </div>
            <div id="spQuestions" class="space-y-2"></div>
          </div>
          <div class="grid gap-4 lg:grid-cols-2">
            ${picker('judges', 'Judges who will see this panel', 'Search judges')}
            ${picker('teams', 'Teams', 'Search team or challenge')}
          </div>
        </div>
        <div class="flex justify-end gap-3 rounded-b-xl border-t border-slate-200 bg-slate-50 px-5 py-4">
          <button type="button" onclick="SpecialPanelsPage.closeModal()" class="btn btn-secondary">Cancel</button>
          <button type="submit" id="spSaveBtn" class="btn btn-primary">Save panel</button>
        </div>
      </form>`);
    P.renderQuestions();
    P.renderPicker('judges');
    P.renderPicker('teams');
    document.getElementById('spName').focus();
  }

  static renderQuestions() {
    const ed = SpecialPanelsPage.editor;
    document.getElementById('spQuestions').innerHTML = ed.questions
      .map(
        (q, i) => `
        <div class="flex items-center gap-2">
          <span class="w-6 shrink-0 text-right text-sm text-slate-400">${i + 1}.</span>
          <input class="input" maxlength="300" placeholder="Question judges will rate from 1 to 5" value="${UI.escape(q.question)}"
            oninput="SpecialPanelsPage.editor.questions[${i}].question = this.value">
          <button type="button" onclick="SpecialPanelsPage.removeQuestion(${i})" class="btn btn-ghost btn-sm px-2 text-slate-400 hover:text-red-600" title="Remove question" ${ed.questions.length === 1 ? 'disabled' : ''}>${SpecialPanelsPage.svg('trash')}</button>
        </div>`,
      )
      .join('');
  }

  static addQuestion() {
    SpecialPanelsPage.editor.questions.push({ question: '' });
    SpecialPanelsPage.renderQuestions();
    const inputs = document.querySelectorAll('#spQuestions input');
    inputs[inputs.length - 1]?.focus();
  }

  static removeQuestion(index) {
    SpecialPanelsPage.editor.questions.splice(index, 1);
    SpecialPanelsPage.renderQuestions();
  }

  static renderPicker(kind) {
    const P = SpecialPanelsPage;
    const ed = P.editor;
    if (!ed) return;
    const selected = ed[kind];
    const search = ed.search[kind].toLowerCase();
    const items = (kind === 'judges' ? P.judges : P.teams).filter((item) => {
      if (ed.selectedOnly[kind] && !selected.has(item._id)) return false;
      const text = kind === 'judges' ? `${item.name} ${item.email}` : `${item.name} ${item.challenge}`;
      return !search || text.toLowerCase().includes(search);
    });
    const shown = items.slice(0, P.PICKER_LIMIT);
    document.getElementById(`sp_${kind}_list`).innerHTML =
      (shown.length
        ? shown
            .map(
              (item) => `
          <label class="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-slate-50">
            <input type="checkbox" value="${item._id}" ${selected.has(item._id) ? 'checked' : ''} class="h-4 w-4 shrink-0 accent-blue-600">
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium text-slate-900">${UI.escape(item.name)}</span>
              <span class="block truncate text-xs text-slate-500">${UI.escape(kind === 'judges' ? item.email : item.challenge)}</span>
            </span>
          </label>`,
            )
            .join('')
        : '<p class="px-3 py-6 text-center text-sm text-slate-500">No matches</p>') +
      (items.length > shown.length ? `<p class="px-3 py-2 text-xs text-slate-500">Showing ${shown.length} of ${items.length} — type to narrow the list</p>` : '');
    document.getElementById(`sp_${kind}_count`).textContent = `${selected.size} selected`;
  }

  static onSearch = UI.debounce((kind, value) => {
    if (!SpecialPanelsPage.editor) return;
    SpecialPanelsPage.editor.search[kind] = value;
    SpecialPanelsPage.renderPicker(kind);
  }, 150);

  static toggleSelectedOnly(kind, checked) {
    SpecialPanelsPage.editor.selectedOnly[kind] = checked;
    SpecialPanelsPage.renderPicker(kind);
  }

  static onPick(event, kind) {
    const input = event.target;
    if (input.type !== 'checkbox' || !input.value) return;
    const selected = SpecialPanelsPage.editor[kind];
    if (input.checked) selected.add(input.value);
    else selected.delete(input.value);
    document.getElementById(`sp_${kind}_count`).textContent = `${selected.size} selected`;
  }

  static async save(event) {
    event.preventDefault();
    const P = SpecialPanelsPage;
    const ed = P.editor;
    const name = document.getElementById('spName').value.trim();
    const questions = ed.questions.map((q) => ({ ...q, question: q.question.trim() })).filter((q) => q.question);
    if (!name) {
      UI.toast('Please give the panel a name', 'warning');
      return;
    }
    if (!questions.length) {
      UI.toast('Add at least one question for the judges to rate', 'warning');
      return;
    }
    const button = document.getElementById('spSaveBtn');
    button.disabled = true;
    button.textContent = 'Saving…';
    const body = { name, stage: 3, judges: [...ed.judges], teams: [...ed.teams], awardCriteria: questions };
    try {
      await UI.api(ed.id ? `/api/panels/${ed.id}` : '/api/panels', { method: ed.id ? 'PUT' : 'POST', body });
      UI.toast(ed.id ? 'Special panel updated' : 'Special panel created', 'success');
      P.closeModal();
      P.load();
    } catch (error) {
      UI.toast(`Could not save: ${error.message}`, 'error');
      button.disabled = false;
      button.textContent = 'Save panel';
    }
  }

  static async deletePanel(panelId) {
    const panel = SpecialPanelsPage.panels.find((p) => p._id === panelId);
    const ok = await UI.confirm({
      title: `Delete “${panel?.name || 'this panel'}”?`,
      message: 'Its judges will no longer see it and all scores given in this panel will be permanently deleted.',
      confirmText: 'Delete panel',
      danger: true,
    });
    if (!ok) return;
    try {
      await UI.api(`/api/panels/${panelId}`, { method: 'DELETE' });
      UI.toast('Special panel deleted', 'success');
      SpecialPanelsPage.load();
    } catch (error) {
      UI.toast(`Could not delete: ${error.message}`, 'error');
    }
  }

  static async showResults(panelId) {
    const P = SpecialPanelsPage;
    P.modal(`<div class="p-6">${UI.spinner('Loading results…')}</div>`, false);
    try {
      const results = await UI.api(`/api/scores/panel/${panelId}`);
      let rank = 0;
      P.modal(`
        <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 class="text-lg font-semibold text-slate-900">${UI.escape(results.name)} · Results</h3>
            <p class="text-sm text-slate-500">Average of the judges' 1–5 ratings · ${results.judgeCount} judge${results.judgeCount === 1 ? '' : 's'} · ${results.questionCount} question${results.questionCount === 1 ? '' : 's'}</p>
          </div>
          <button type="button" onclick="SpecialPanelsPage.closeModal()" class="btn btn-ghost btn-sm" aria-label="Close">${P.svg('close')}</button>
        </div>
        <div class="flex-1 overflow-y-auto">
          ${results.teams.length ? `
          <table class="table">
            <thead><tr><th class="w-16">Rank</th><th>Team</th><th>Average</th><th>Judges scored</th></tr></thead>
            <tbody>
              ${results.teams
                .map((team) => {
                  if (team.hasScore) rank++;
                  return `
                <tr>
                  <td>${team.hasScore ? (rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`) : '–'}</td>
                  <td><p class="font-medium text-slate-900">${UI.escape(team.name)}</p><p class="text-xs text-slate-500">${UI.escape(team.challenge)}</p></td>
                  <td>${team.hasScore ? `<span class="font-semibold text-teal-700">${Number(team.averageScore).toFixed(2)}</span>` : '<span class="text-slate-400">No score</span>'}</td>
                  <td class="text-slate-600">${Number(team.judgeCount)} / ${Number(results.judgeCount)}</td>
                </tr>`;
                })
                .join('')}
            </tbody>
          </table>` : UI.emptyState('No teams in this panel yet')}
        </div>`, false);
    } catch (error) {
      P.modal(`<div class="p-6 text-sm text-red-700">Could not load results: ${UI.escape(error.message)}
        <div class="mt-4"><button onclick="SpecialPanelsPage.closeModal()" class="btn btn-secondary btn-sm">Close</button></div></div>`, false);
    }
  }
}
