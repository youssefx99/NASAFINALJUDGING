// Judges Management Page
class JudgesManagementPage {
  static PER_PAGE = 25;
  static CONFIRM_PHRASE = 'DELETE ALL JUDGES';
  static judges = [];
  static filtered = [];
  static page = 1;
  static panels = null;
  static panelsRequest = null;
  static onSearch = UI.debounce(() => JudgesManagementPage.applyFilters(), 200);

  static render() {
    return Layout.admin({
      title: 'Judges',
      subtitle: 'Manage judge accounts and their panel assignments',
      actions: `
        <button onclick="JudgesManagementPage.showCsvUploadModal()" class="btn btn-secondary">
          ${Sidebar.icon('upload', 'h-4 w-4')}
          Upload CSV
        </button>
        <button id="deleteAllJudgesBtn" onclick="JudgesManagementPage.showDeleteAllModal()" class="btn btn-danger" disabled>
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          Delete All Judges
        </button>
        <button onclick="JudgesManagementPage.showCreateModal()" class="btn btn-primary">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          Add Judge
        </button>
      `,
      content: `
        <div class="card">
          <div class="card-header">
            <div class="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
              <div class="relative flex-1">
                <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"></path></svg>
                <input id="searchJudges" type="search" autocomplete="off" oninput="JudgesManagementPage.onSearch()"
                  placeholder="Search by name, email or panel..." class="input pl-9" />
              </div>
              <p id="judgesCount" class="whitespace-nowrap text-sm text-slate-500">Loading judges...</p>
            </div>
          </div>
          <div id="judgesTable">${JudgesManagementPage.tableHtml(UI.skeletonRows(4, 6))}</div>
        </div>

        <!-- Create/Edit Judge Modal -->
        <div id="judgeModal" class="fixed inset-0 z-50 hidden flex items-center justify-center bg-slate-900/50 p-4"
          onclick="if (event.target === this) JudgesManagementPage.hideModal()"
          onkeydown="if (event.key === 'Escape') JudgesManagementPage.hideModal()">
          <form id="judgeForm" class="card flex max-h-[90vh] w-full max-w-lg flex-col" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
            <div class="card-header">
              <h3 id="modalTitle" class="card-title">Add Judge</h3>
              <button type="button" onclick="JudgesManagementPage.hideModal()" class="btn btn-ghost btn-sm" aria-label="Close">&times;</button>
            </div>
            <div class="card-body space-y-4 overflow-y-auto">
              <input type="hidden" id="judgeId" />
              <div>
                <label for="judgeName" class="label">Name</label>
                <input type="text" id="judgeName" required autocomplete="off" class="input" />
              </div>
              <div>
                <label for="judgeEmail" class="label">Email</label>
                <input type="email" id="judgeEmail" required autocomplete="off" class="input" />
              </div>
              <div id="passwordField">
                <label for="judgePassword" class="label">Password</label>
                <input type="password" id="judgePassword" required autocomplete="new-password" class="input" />
              </div>
              <div>
                <div class="mb-1 flex items-center justify-between">
                  <span class="label mb-0">Stage 1 panels</span>
                  <span id="panelStage1Count" class="text-xs text-slate-500"></span>
                </div>
                <div id="panelStage1List" class="grid max-h-44 grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-slate-200 p-2 sm:grid-cols-2"></div>
              </div>
              <div>
                <div class="mb-1 flex items-center justify-between">
                  <span class="label mb-0">Stage 2 award panels</span>
                  <span id="panelStage2Count" class="text-xs text-slate-500"></span>
                </div>
                <div id="panelStage2List" class="grid max-h-44 grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-slate-200 p-2 sm:grid-cols-2"></div>
              </div>
              <div>
                <div class="mb-1 flex items-center justify-between">
                  <span class="label mb-0">Special panels</span>
                  <span id="panelStage3Count" class="text-xs text-slate-500"></span>
                </div>
                <div id="panelStage3List" class="grid max-h-44 grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-slate-200 p-2 sm:grid-cols-2"></div>
              </div>
            </div>
            <div class="flex justify-end gap-3 rounded-b-xl border-t border-slate-200 bg-slate-50 px-5 py-4">
              <button type="button" onclick="JudgesManagementPage.hideModal()" class="btn btn-secondary">Cancel</button>
              <button type="submit" id="saveJudgeBtn" class="btn btn-primary">Save Judge</button>
            </div>
          </form>
        </div>

        <!-- CSV Upload Modal -->
        <div id="csvUploadModal" class="fixed inset-0 z-50 hidden flex items-center justify-center bg-slate-900/50 p-4"
          onclick="if (event.target === this) JudgesManagementPage.hideCsvUploadModal()"
          onkeydown="if (event.key === 'Escape') JudgesManagementPage.hideCsvUploadModal()">
          <form id="csvUploadForm" class="card flex max-h-[90vh] w-full max-w-2xl flex-col" role="dialog" aria-modal="true" aria-labelledby="csvModalTitle">
            <div class="card-header">
              <div>
                <h3 id="csvModalTitle" class="card-title">Upload judges CSV</h3>
                <p class="mt-0.5 text-sm text-slate-500">Create judge accounts in bulk from a CSV file</p>
              </div>
              <button type="button" onclick="JudgesManagementPage.hideCsvUploadModal()" class="btn btn-ghost btn-sm" aria-label="Close">&times;</button>
            </div>
            <div class="card-body space-y-4 overflow-y-auto">
              <div class="rounded-lg border border-blue-100 bg-blue-50 p-4 text-xs text-blue-900">
                <p class="mb-1 text-sm font-medium">Expected CSV format</p>
                <p><span class="font-semibold">Columns:</span> Title, Name, Last time judged in NSAC, Email, LinkedIn, Phone, Judging Area, Reached Out by Call, Response Status, Confirmed, Filled the Form</p>
                <ul class="mt-2 list-disc space-y-0.5 pl-5">
                  <li><span class="font-semibold">Name:</span> taken from the Name column</li>
                  <li><span class="font-semibold">Email:</span> generated from the name (lowercase with underscores)</li>
                  <li><span class="font-semibold">Password:</span> row number + first name (e.g. "1John", "2Sarah")</li>
                </ul>
              </div>

              <input type="file" id="csvFile" accept=".csv,text/csv" class="peer sr-only" />
              <label for="csvFile" id="csvDropZone"
                class="block cursor-pointer rounded-lg border-2 border-dashed border-slate-300 p-6 text-center transition-colors hover:border-blue-400 hover:bg-slate-50 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500">
                <div id="dropZone">
                  <svg class="mx-auto h-10 w-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                  <p class="mt-2 text-sm text-slate-700"><span class="font-medium text-blue-600">Click to choose a file</span> or drag and drop</p>
                  <p class="text-xs text-slate-500">CSV files only</p>
                </div>
                <div id="fileInfo" class="hidden">
                  <p id="fileName" class="text-sm font-medium text-slate-900"></p>
                  <p id="fileSize" class="text-xs text-slate-500"></p>
                  <p class="mt-1 text-xs text-blue-600">Click to choose a different file</p>
                </div>
              </label>

              <div id="uploadStatus" class="hidden"></div>
            </div>
            <div class="flex justify-end gap-3 rounded-b-xl border-t border-slate-200 bg-slate-50 px-5 py-4">
              <button type="button" onclick="JudgesManagementPage.hideCsvUploadModal()" class="btn btn-secondary">Close</button>
              <button type="submit" id="uploadBtn" disabled class="btn btn-primary">Upload Judges</button>
            </div>
          </form>
        </div>

        <div id="deleteAllJudgesModal" class="fixed inset-0 z-50 hidden flex items-center justify-center bg-slate-900/50 p-4"
          onclick="if (event.target === this) JudgesManagementPage.hideDeleteAllModal()"
          onkeydown="if (event.key === 'Escape') JudgesManagementPage.hideDeleteAllModal()">
          <form class="card w-full max-w-lg" role="dialog" aria-modal="true" aria-labelledby="deleteAllJudgesTitle"
            onsubmit="event.preventDefault(); JudgesManagementPage.deleteAllJudges()">
            <div class="flex items-start gap-4 p-6">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              </div>
              <div class="min-w-0 flex-1">
                <h3 id="deleteAllJudgesTitle" class="text-lg font-semibold text-slate-900">Delete all judges?</h3>
                <p class="mt-1 text-sm text-slate-600">This permanently deletes <strong id="deleteAllJudgesCount" class="text-slate-900">all</strong> judge accounts together with:</p>
                <ul class="mt-2 list-disc space-y-0.5 pl-5 text-sm text-slate-600">
                  <li>Every score they gave (Stage 1, Stage 2 and special panels)</li>
                  <li>Their seats on all panels</li>
                </ul>
                <p class="mt-2 text-sm text-slate-600">Admin accounts, teams and panels are kept.</p>
                <p class="mt-3 text-sm font-medium text-red-700">This action cannot be undone.</p>
                <label for="deleteAllJudgesInput" class="label mt-4">
                  Type <span class="font-mono font-semibold text-red-600">${JudgesManagementPage.CONFIRM_PHRASE}</span> to confirm
                </label>
                <input id="deleteAllJudgesInput" type="text" autocomplete="off" spellcheck="false"
                  placeholder="${JudgesManagementPage.CONFIRM_PHRASE}" class="input font-mono"
                  oninput="document.getElementById('confirmDeleteAllJudgesBtn').disabled = this.value.trim() !== JudgesManagementPage.CONFIRM_PHRASE" />
              </div>
            </div>
            <div class="flex justify-end gap-3 rounded-b-xl border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button type="button" onclick="JudgesManagementPage.hideDeleteAllModal()" class="btn btn-secondary">Cancel</button>
              <button type="submit" id="confirmDeleteAllJudgesBtn" class="btn btn-danger" disabled>Delete all judges</button>
            </div>
          </form>
        </div>
      `,
    });
  }

  static afterRender() {
    JudgesManagementPage.judges = [];
    JudgesManagementPage.filtered = [];
    JudgesManagementPage.page = 1;
    JudgesManagementPage.panels = null;
    JudgesManagementPage.panelsRequest = null;
    JudgesManagementPage.loadJudges();
    JudgesManagementPage.loadPanels().catch(() => {});
    JudgesManagementPage.setupEventListeners();
  }

  static tableHtml(body) {
    return `
      <div class="relative overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Judge</th>
              <th>Email</th>
              <th>Panel assignments</th>
              <th><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    `;
  }

  static async loadJudges() {
    const table = document.getElementById('judgesTable');
    if (!table) return;
    if (!JudgesManagementPage.judges.length) table.innerHTML = JudgesManagementPage.tableHtml(UI.skeletonRows(4, 6));

    try {
      const judges = await UI.api('/api/users/judges');
      JudgesManagementPage.judges = judges.map((judge) => {
        const assignments = (judge.panelAssignments || []).filter((a) => a.panel);
        const stage1 = assignments.filter((a) => Number(a.stage) === 1).map((a) => a.panel);
        const stage2 = assignments.filter((a) => Number(a.stage) === 2).map((a) => a.panel);
        const search = [judge.name, judge.email, ...stage1.map((p) => p.name), ...stage2.map((p) => p.awardType || p.name)]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return { judge, stage1, stage2, search };
      });
      JudgesManagementPage.applyFilters(false);
    } catch (error) {
      console.error('Failed to load judges:', error);
      if (!document.getElementById('judgesTable')) return;
      document.getElementById('judgesCount').textContent = '';
      table.innerHTML = `
        <div class="flex flex-col items-center px-6 py-12 text-center">
          <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <p class="text-sm font-medium text-slate-900">Couldn't load judges</p>
          <p class="mt-1 text-sm text-slate-500">${UI.escape(error.message)}</p>
          <button onclick="JudgesManagementPage.loadJudges()" class="btn btn-secondary mt-4">Try again</button>
        </div>
      `;
    }
  }

  // Cached so the modal opens instantly; a failed request is retried on next use
  static loadPanels() {
    if (!JudgesManagementPage.panelsRequest) {
      JudgesManagementPage.panelsRequest = UI.api('/api/panels')
        .then((panels) => (JudgesManagementPage.panels = panels))
        .catch((error) => {
          JudgesManagementPage.panelsRequest = null;
          throw error;
        });
    }
    return JudgesManagementPage.panelsRequest;
  }

  static applyFilters(resetPage = true) {
    const term = (document.getElementById('searchJudges')?.value || '').trim().toLowerCase();
    const tokens = term ? term.split(/\s+/) : [];
    JudgesManagementPage.filtered = JudgesManagementPage.judges.filter((r) => tokens.every((t) => r.search.includes(t)));
    document.getElementById('deleteAllJudgesBtn').disabled = !JudgesManagementPage.judges.length;
    if (resetPage) JudgesManagementPage.page = 1;
    JudgesManagementPage.renderTable();
  }

  static renderTable() {
    const table = document.getElementById('judgesTable');
    if (!table) return;
    const { judges, filtered, PER_PAGE } = JudgesManagementPage;
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const page = Math.min(Math.max(1, JudgesManagementPage.page), totalPages);
    JudgesManagementPage.page = page;

    document.getElementById('judgesCount').textContent =
      filtered.length === judges.length ? `${judges.length} judges` : `${filtered.length} of ${judges.length} judges`;

    if (filtered.length === 0) {
      table.innerHTML = judges.length
        ? UI.emptyState('No judges match your search', 'Try a different name, email or panel.')
        : UI.emptyState('No judges yet', 'Add a judge or upload a CSV to get started.');
      return;
    }

    const start = (page - 1) * PER_PAGE;
    table.innerHTML =
      JudgesManagementPage.tableHtml(filtered.slice(start, start + PER_PAGE).map(JudgesManagementPage.rowHtml).join('')) +
      UI.pagination({ page, perPage: PER_PAGE, total: filtered.length, onChange: 'JudgesManagementPage.goToPage' });
  }

  static rowHtml({ judge, stage1, stage2 }) {
    const href = `/admin/judges/${judge._id}`;
    const firstName = (judge.name || '').split(/\s+/).find((w) => w && !w.endsWith('.')) || judge.name || '?';
    const initial = firstName.charAt(0).toUpperCase();
    const badges = [
      ...stage1.map((p) => `<span class="badge badge-blue">S1 · ${UI.escape(p.name)}</span>`),
      ...stage2.map((p) => `<span class="badge badge-purple">S2 · ${UI.escape(p.awardType || p.name)}</span>`),
    ];
    return `
      <tr>
        <td>
          <div class="flex items-center gap-3">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">${UI.escape(initial)}</div>
            <a href="${href}" onclick="navigateToPage(event, '${href}')" class="whitespace-nowrap font-medium text-slate-900 hover:text-blue-600">${UI.escape(judge.name)}</a>
          </div>
        </td>
        <td class="whitespace-nowrap">${UI.escape(judge.email)}</td>
        <td>
          <div class="flex min-w-[12rem] flex-wrap gap-1">
            ${badges.length ? badges.join('') : '<span class="badge badge-yellow">Unassigned</span>'}
          </div>
        </td>
        <td>
          <div class="flex justify-end gap-1">
            <button onclick="router.navigate('${href}')" class="btn btn-ghost btn-sm">View</button>
            <button onclick="JudgesManagementPage.editJudge('${judge._id}')" class="btn btn-ghost btn-sm">Edit</button>
            <button onclick="JudgesManagementPage.deleteJudge('${judge._id}')" class="btn btn-ghost btn-sm text-red-600 hover:bg-red-50 hover:text-red-700">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }

  static goToPage(page) {
    JudgesManagementPage.page = page;
    JudgesManagementPage.renderTable();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  static setupEventListeners() {
    document.getElementById('judgeForm').addEventListener('submit', JudgesManagementPage.handleSubmit);
    document.getElementById('csvUploadForm').addEventListener('submit', JudgesManagementPage.handleCsvUpload);
    document.getElementById('csvFile').addEventListener('change', JudgesManagementPage.handleFileSelect);

    const dropZone = document.getElementById('csvDropZone');
    dropZone.addEventListener('dragover', JudgesManagementPage.handleDragOver);
    dropZone.addEventListener('dragleave', (e) => e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50'));
    dropZone.addEventListener('drop', JudgesManagementPage.handleDrop);

    for (const stage of [1, 2, 3]) {
      document.getElementById(`panelStage${stage}List`).addEventListener('change', () => JudgesManagementPage.updatePanelCount(stage));
    }
  }

  static async renderPanelOptions(selectedIds) {
    const lists = [1, 2, 3].map((stage) => document.getElementById(`panelStage${stage}List`));
    if (!JudgesManagementPage.panels) {
      lists.forEach((list) => (list.innerHTML = '<p class="col-span-full px-2 py-1 text-sm text-slate-500">Loading panels...</p>'));
    }

    try {
      await JudgesManagementPage.loadPanels();
    } catch (error) {
      console.error('Failed to load panels:', error);
      lists.forEach((list) => (list.innerHTML = '<p class="col-span-full px-2 py-1 text-sm text-red-600">Couldn\'t load panels. Close and reopen to retry.</p>'));
      return;
    }

    lists.forEach((list, i) => {
      const stage = i + 1;
      const panels = JudgesManagementPage.panels.filter((p) => Number(p.stage) === stage);
      list.innerHTML = panels.length
        ? panels
            .map(
              (p) => `
              <label class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                <input type="checkbox" name="panelStage${stage}" value="${p._id}" ${selectedIds.has(p._id) ? 'checked' : ''}
                  class="h-4 w-4 shrink-0 accent-blue-600" />
                <span class="truncate">${UI.escape(stage === 2 ? p.awardType || p.name : p.name)}</span>
              </label>`,
            )
            .join('')
        : `<p class="col-span-full px-2 py-1 text-sm text-slate-500">No ${stage === 3 ? 'special' : `Stage ${stage}`} panels yet</p>`;
      JudgesManagementPage.updatePanelCount(stage);
    });
  }

  static updatePanelCount(stage) {
    const count = document.querySelectorAll(`input[name="panelStage${stage}"]:checked`).length;
    document.getElementById(`panelStage${stage}Count`).textContent = count ? `${count} selected` : '';
  }

  static openModal(judge) {
    document.getElementById('judgeForm').reset();
    document.getElementById('modalTitle').textContent = judge ? 'Edit Judge' : 'Add Judge';
    document.getElementById('judgeId').value = judge?._id || '';
    document.getElementById('judgeName').value = judge?.name || '';
    document.getElementById('judgeEmail').value = judge?.email || '';
    document.getElementById('passwordField').classList.toggle('hidden', !!judge);
    document.getElementById('judgePassword').required = !judge;

    const selectedIds = new Set(
      (judge?.panelAssignments || []).map((a) => a.panel?._id || a.panel).filter(Boolean),
    );
    JudgesManagementPage.renderPanelOptions(selectedIds);

    document.getElementById('judgeModal').classList.remove('hidden');
    document.getElementById('judgeName').focus();
  }

  static showCreateModal() {
    JudgesManagementPage.openModal(null);
  }

  static async editJudge(judgeId) {
    try {
      JudgesManagementPage.openModal(await UI.api(`/api/users/${judgeId}`));
    } catch (error) {
      console.error('Failed to load judge:', error);
      UI.toast(`Failed to load judge: ${error.message}`, 'error');
    }
  }

  static hideModal() {
    document.getElementById('judgeModal')?.classList.add('hidden');
  }

  static async deleteJudge(judgeId) {
    const row = JudgesManagementPage.judges.find((r) => r.judge._id === judgeId);
    if (!row) return;
    const confirmed = await UI.confirm({
      title: 'Delete judge?',
      message: `${row.judge.name} (${row.judge.email}) will be removed from all panels, can no longer sign in, and all scores they gave will be permanently deleted.`,
      confirmText: 'Delete judge',
      danger: true,
    });
    if (!confirmed) return;

    try {
      await UI.api(`/api/users/${judgeId}`, { method: 'DELETE' });
      JudgesManagementPage.judges = JudgesManagementPage.judges.filter((r) => r !== row);
      JudgesManagementPage.filtered = JudgesManagementPage.filtered.filter((r) => r !== row);
      JudgesManagementPage.renderTable();
      UI.toast(`Deleted ${row.judge.name}`, 'success');
    } catch (error) {
      console.error('Failed to delete judge:', error);
      UI.toast(`Failed to delete judge: ${error.message}`, 'error');
    }
  }

  static showDeleteAllModal() {
    if (!JudgesManagementPage.judges.length) return;
    document.getElementById('deleteAllJudgesCount').textContent = JudgesManagementPage.judges.length.toLocaleString();
    const input = document.getElementById('deleteAllJudgesInput');
    input.value = '';
    input.disabled = false;
    const button = document.getElementById('confirmDeleteAllJudgesBtn');
    button.disabled = true;
    button.textContent = 'Delete all judges';
    document.getElementById('deleteAllJudgesModal').classList.remove('hidden');
    input.focus();
  }

  static hideDeleteAllModal() {
    document.getElementById('deleteAllJudgesModal')?.classList.add('hidden');
  }

  static async deleteAllJudges() {
    const input = document.getElementById('deleteAllJudgesInput');
    const button = document.getElementById('confirmDeleteAllJudgesBtn');
    if (input.value.trim() !== JudgesManagementPage.CONFIRM_PHRASE) return;
    input.disabled = true;
    button.disabled = true;
    button.textContent = 'Deleting...';
    try {
      const result = await UI.api('/api/users/judges', { method: 'DELETE' });
      JudgesManagementPage.hideDeleteAllModal();
      JudgesManagementPage.panels = null;
      UI.toast(`Deleted ${result?.deletedCount ?? 0} judges with their scores and panel seats`, 'success');
      JudgesManagementPage.loadJudges();
    } catch (error) {
      UI.toast(`Failed to delete all judges: ${error.message}`, 'error');
      input.disabled = false;
      button.disabled = false;
      button.textContent = 'Delete all judges';
    }
  }

  static async handleSubmit(e) {
    e.preventDefault();
    if (!JudgesManagementPage.panels) {
      UI.toast('Panels have not loaded yet, so assignments cannot be saved. Close and reopen the form to retry.', 'warning');
      return;
    }

    const judgeId = document.getElementById('judgeId').value;
    const selected = (stage) =>
      [...document.querySelectorAll(`input[name="panelStage${stage}"]:checked`)].map((input) => ({ stage, panel: input.value }));
    const body = {
      name: document.getElementById('judgeName').value.trim(),
      email: document.getElementById('judgeEmail').value.trim(),
      role: 'judge',
      panelAssignments: [...selected(1), ...selected(2), ...selected(3)],
    };
    if (!judgeId) body.password = document.getElementById('judgePassword').value;

    const saveBtn = document.getElementById('saveJudgeBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      await UI.api(judgeId ? `/api/users/${judgeId}` : '/api/users', { method: judgeId ? 'PUT' : 'POST', body });
      JudgesManagementPage.hideModal();
      UI.toast(judgeId ? `Updated ${body.name}` : `Created ${body.name}`, 'success');
      JudgesManagementPage.loadJudges();
    } catch (error) {
      console.error('Failed to save judge:', error);
      UI.toast(`Failed to save judge: ${error.message}`, 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Judge';
    }
  }

  // CSV Upload
  static showCsvUploadModal() {
    JudgesManagementPage.resetCsvForm();
    const status = document.getElementById('uploadStatus');
    status.classList.add('hidden');
    status.innerHTML = '';
    document.getElementById('csvUploadModal').classList.remove('hidden');
    document.getElementById('csvFile').focus();
  }

  static hideCsvUploadModal() {
    document.getElementById('csvUploadModal')?.classList.add('hidden');
  }

  static resetCsvForm() {
    document.getElementById('csvUploadForm').reset();
    document.getElementById('fileInfo').classList.add('hidden');
    document.getElementById('dropZone').classList.remove('hidden');
    document.getElementById('uploadBtn').disabled = true;
  }

  static handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) JudgesManagementPage.displayFileInfo(file);
  }

  static displayFileInfo(file) {
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = `${(file.size / 1024).toFixed(1)} KB`;
    document.getElementById('fileInfo').classList.remove('hidden');
    document.getElementById('dropZone').classList.add('hidden');
    document.getElementById('uploadBtn').disabled = false;
  }

  static handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
  }

  static handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
    const files = e.dataTransfer.files;
    if (!files.length) return;
    const file = files[0];
    if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
      document.getElementById('csvFile').files = files;
      JudgesManagementPage.displayFileInfo(file);
    } else {
      UI.toast('Please select a CSV file.', 'warning');
    }
  }

  static async handleCsvUpload(e) {
    e.preventDefault();
    const file = document.getElementById('csvFile').files[0];
    if (!file) return;

    const uploadBtn = document.getElementById('uploadBtn');
    const status = document.getElementById('uploadStatus');
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';
    status.classList.add('hidden');

    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      const response = await fetch('/api/judges/upload-csv', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authService.token}` },
        body: formData,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || `Upload failed (${response.status})`);

      const skipped = result.errors || [];
      const credentials = result.credentials || [];
      status.innerHTML = `
        <div class="rounded-lg border p-4 text-sm ${skipped.length ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}">
          <p class="font-medium">Created ${Number(result.count) || 0} judge${result.count === 1 ? '' : 's'}${skipped.length ? `, ${skipped.length} row${skipped.length === 1 ? '' : 's'} skipped` : ''}.</p>
          ${skipped.length
            ? `<ul class="mt-2 max-h-40 list-disc space-y-0.5 overflow-y-auto pl-5 text-xs">${skipped.map((msg) => `<li>${UI.escape(msg)}</li>`).join('')}</ul>`
            : ''}
        </div>
        ${credentials.length ? `
          <div class="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            <p class="font-medium">Download the login details now — passwords are generated randomly and are shown only once.</p>
            <button type="button" id="downloadCredentialsBtn" class="btn btn-primary btn-sm mt-3">Download judge logins (CSV)</button>
          </div>` : ''}
      `;
      document.getElementById('downloadCredentialsBtn')?.addEventListener('click', () => {
        // Leading = + - @ would run as a spreadsheet formula when the file is opened
        const cell = (value) => `"${String(value ?? '').replace(/^[=+\-@\t\r]/, "'$&").replace(/"/g, '""')}"`;
        const csv = ['name,email,password', ...credentials.map((c) => [c.name, c.email, c.password].map(cell).join(','))].join('\n');
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        link.download = 'judge-logins.csv';
        link.click();
        URL.revokeObjectURL(link.href);
      });
      status.classList.remove('hidden');
      UI.toast(`Uploaded ${result.count ?? 0} judges`, 'success');
      JudgesManagementPage.resetCsvForm();
      JudgesManagementPage.loadJudges();
    } catch (error) {
      console.error('CSV upload failed:', error);
      status.innerHTML = `
        <div class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">${UI.escape(error.message || 'Upload failed')}</div>
      `;
      status.classList.remove('hidden');
      uploadBtn.disabled = !document.getElementById('csvFile').files[0];
    } finally {
      uploadBtn.textContent = 'Upload Judges';
    }
  }
}
