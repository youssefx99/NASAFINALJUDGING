// Stage 2 Management Page - award-specific criteria
class Stage2ManagementPage {
  static levels(scaleMax = 5) {
    return Array.from({ length: scaleMax }, (_, i) => i + 1);
  }

  static typesOf(award) {
    return (award.questions || []).map((_, qi) => (award.questionTypes && award.questionTypes[qi]) || 'scale');
  }

  static PLACEHOLDERS = [
    'Meets elite threshold (good advanced performance)',
    'Exceeds elite expectations (strong advanced performance)',
    'Superior elite achievement (excellent advanced performance)',
    'Outstanding elite excellence (exceptional advanced performance)',
    'Globally competitive mastery (world-class performance)',
  ];

  static ICONS = {
    trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    close: 'M6 18L18 6M6 6l12 12',
    alert: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  };

  static SPINNER =
    '<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>';

  static awards = [];
  static savedTimer = 30;
  static editIndex = null;
  static draft = null;
  static snapshot = '';
  static saving = false;

  static svg(d, cls = 'h-4 w-4') {
    return `<svg class="${cls}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${d}"></path></svg>`;
  }

  static render() {
    const cardSkeleton =
      '<div class="card card-body space-y-3"><div class="skeleton h-5 w-48"></div><div class="skeleton h-4 w-full"></div><div class="skeleton h-4 w-5/6"></div><div class="skeleton h-4 w-2/3"></div></div>';
    return (
      Layout.admin({
        title: 'Stage 2 Criteria',
        subtitle: 'Judging timer and the questions for each award category',
        content: `
          <div class="mx-auto max-w-6xl space-y-6">
            <div class="card">
              <div class="card-body flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 class="card-title">Judging timer</h2>
                  <p class="mt-0.5 text-sm text-slate-500">Shown to judges while they score each Stage 2 team (1–180 minutes).</p>
                </div>
                <div class="flex items-end gap-3">
                  <div>
                    <label for="timerMinutes" class="label">Minutes per team</label>
                    <input id="timerMinutes" type="number" min="1" max="180" step="1" value="30" disabled class="input w-32">
                  </div>
                  <button type="button" id="stage2TimerBtn" onclick="Stage2ManagementPage.saveTimer()" disabled class="btn btn-secondary">Save timer</button>
                </div>
              </div>
            </div>
            <div>
              <div class="mb-3 flex items-center justify-between gap-3">
                <h2 class="text-base font-semibold text-slate-900">Award criteria</h2>
                <span id="awardCount" class="badge badge-purple hidden"></span>
              </div>
              <div id="awardCriteriaList" class="grid gap-4 md:grid-cols-2">${cardSkeleton.repeat(4)}</div>
            </div>
          </div>`,
      }) +
      `
      <div id="editAwardModal" class="fixed inset-0 z-50 hidden overflow-y-auto bg-slate-900/50 p-4 sm:p-6">
        <div class="card mx-auto flex max-h-[90vh] w-full max-w-4xl flex-col" role="dialog" aria-modal="true" aria-labelledby="modalAwardTitle">
          <div class="card-header flex-nowrap">
            <div class="min-w-0">
              <h3 id="modalAwardTitle" class="card-title truncate"></h3>
              <p class="mt-0.5 text-sm text-slate-500">Each question is Yes/No or rated on a scale. Describe what each scale score means so judges score consistently.</p>
            </div>
            <button type="button" onclick="Stage2ManagementPage.closeEditModal()" aria-label="Close" class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              ${Stage2ManagementPage.svg(Stage2ManagementPage.ICONS.close, 'h-5 w-5')}
            </button>
          </div>
          <div id="editQuestionsForm" class="min-h-0 flex-1 space-y-4 overflow-y-auto p-5"></div>
          <div class="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
            <button type="button" onclick="Stage2ManagementPage.closeEditModal()" class="btn btn-secondary">Cancel</button>
            <button type="button" id="saveAwardBtn" onclick="Stage2ManagementPage.saveAwardCriteria()" class="btn btn-primary">Save changes</button>
          </div>
        </div>
      </div>`
    );
  }

  static afterRender() {
    Stage2ManagementPage.draft = null;
    Stage2ManagementPage.loadAwardCriteria();
  }

  static async loadAwardCriteria() {
    const list = document.getElementById('awardCriteriaList');
    if (!list.querySelector('.skeleton')) list.innerHTML = `<div class="card md:col-span-2">${UI.spinner('Loading award criteria...')}</div>`;
    try {
      const stage = await UI.api('/api/stages/Stage%202');
      if (!document.getElementById('awardCriteriaList')) return;
      this.awards = (stage && Array.isArray(stage.criteria) && stage.criteria) || [];
      this.savedTimer = (stage && stage.timerMinutes) || 30;
      const timer = document.getElementById('timerMinutes');
      timer.value = this.savedTimer;
      timer.disabled = false;
      document.getElementById('stage2TimerBtn').disabled = false;
      this.renderAwardList();
    } catch (e) {
      if (!document.getElementById('awardCriteriaList')) return;
      list.innerHTML = `
        <div class="card flex flex-col items-center px-6 py-12 text-center md:col-span-2">
          <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">${this.svg(this.ICONS.alert, 'h-6 w-6')}</div>
          <p class="text-sm font-medium text-slate-900">Couldn't load award criteria</p>
          <p class="mt-1 text-sm text-slate-500">${UI.escape(e.message)}</p>
          <button type="button" onclick="Stage2ManagementPage.loadAwardCriteria()" class="btn btn-secondary mt-4">Try again</button>
        </div>`;
    }
  }

  static filled(descriptions, scaleMax) {
    return this.levels(scaleMax).filter((s) => String((descriptions && descriptions[`score${s}`]) || '').trim()).length;
  }

  static renderAwardList() {
    const list = document.getElementById('awardCriteriaList');
    const count = document.getElementById('awardCount');
    if (!list) return;
    count.textContent = `${this.awards.length} award${this.awards.length === 1 ? '' : 's'}`;
    count.classList.remove('hidden');
    if (!this.awards.length) {
      list.innerHTML = `<div class="card md:col-span-2">${UI.emptyState('No award criteria yet', 'Stage 2 award criteria have not been set up.')}</div>`;
      return;
    }
    list.innerHTML = this.awards
      .map((award, index) => {
        const questions = award.questions || [];
        const types = this.typesOf(award);
        const scaleMax = award.scaleMax || 5;
        const guides = questions.map((_, qi) => this.filled(award.scoringDescriptions && award.scoringDescriptions[qi], scaleMax));
        const scaleCount = types.filter((t) => t === 'scale').length;
        const complete = guides.filter((n, qi) => types[qi] === 'scale' && n === scaleMax).length;
        return `
          <div class="card flex flex-col">
            <div class="card-header flex-nowrap">
              <div class="min-w-0">
                <h3 class="card-title truncate">${UI.escape(award.name)}</h3>
                <p class="text-xs text-slate-500">${UI.escape(UI.questionMixLabel({ types, scaleMax, yesNoWeight: award.yesNoWeight ?? 0.5 }) || 'No questions')}</p>
              </div>
              <span class="badge shrink-0 ${complete === scaleCount ? 'badge-green' : 'badge-yellow'}" title="Scale questions with every scoring description filled in">
                ${complete}/${scaleCount} guides
              </span>
            </div>
            <ol class="flex-1 space-y-2.5 px-5 py-4">
              ${
                questions.length
                  ? questions
                      .map(
                        (q, qi) => `
                <li class="flex items-start gap-3 text-sm">
                  <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">${qi + 1}</span>
                  <span class="min-w-0 flex-1 text-slate-700">${UI.escape(q)}</span>
                  ${
                    types[qi] === 'scale'
                      ? `<span class="shrink-0 text-xs tabular-nums ${guides[qi] === scaleMax ? 'text-emerald-600' : 'text-amber-600'}" title="Scoring descriptions filled in">${guides[qi]}/${scaleMax}</span>`
                      : '<span class="shrink-0 text-xs text-slate-500">Yes/No</span>'
                  }
                </li>`,
                      )
                      .join('')
                  : '<li class="text-sm text-slate-500">No questions yet.</li>'
              }
            </ol>
            <div class="flex justify-end border-t border-slate-200 px-5 py-3">
              <button type="button" onclick="Stage2ManagementPage.editAward(${index})" class="btn btn-secondary btn-sm">Edit questions &amp; scoring</button>
            </div>
          </div>`;
      })
      .join('');
  }

  static editAward(index) {
    const award = this.awards[index];
    if (!award) return;
    const questions = award.questions || [];
    this.editIndex = index;
    this.draft = {
      questions: [...questions],
      questionTypes: this.typesOf(award),
      scaleMax: award.scaleMax || 5,
      yesNoWeight: award.yesNoWeight ?? 0.5,
      scoringDescriptions: questions.map((_, qi) => {
        const d = (award.scoringDescriptions && award.scoringDescriptions[qi]) || {};
        return Object.fromEntries(this.levels(10).map((s) => [`score${s}`, d[`score${s}`] || '']));
      }),
    };
    this.snapshot = JSON.stringify(this.draft);
    document.getElementById('modalAwardTitle').textContent = `Edit ${award.name}`;
    this.renderDraft();
    document.getElementById('editAwardModal').classList.remove('hidden');
    document.getElementById('question_0')?.focus();
  }

  static renderDraft() {
    const { questions, scoringDescriptions, questionTypes, scaleMax } = this.draft;
    document.getElementById('editQuestionsForm').innerHTML =
      UI.scoringSetup({ types: questionTypes, scaleMax, yesNoWeight: this.draft.yesNoWeight }, 'Stage2ManagementPage.setScoring(null') +
      questions
        .map(
          (q, qi) => `
        <div class="rounded-lg border border-slate-200 p-4">
          <div class="flex items-center gap-2">
            <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">${qi + 1}</span>
            <input id="question_${qi}" type="text" value="${UI.escape(q)}" placeholder="Question / criterion"
              oninput="Stage2ManagementPage.updateDraft(${qi}, 'question', this.value)" class="input font-medium">
            ${UI.questionTypeSelect(questionTypes[qi], `Stage2ManagementPage.setScoring(${qi}`)}
            <button type="button" onclick="Stage2ManagementPage.removeQuestion(${qi})" ${questions.length <= 1 ? 'disabled' : ''}
              title="Delete question" aria-label="Delete question"
              class="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-40">
              ${this.svg(this.ICONS.trash, 'h-5 w-5')}
            </button>
          </div>
          ${
            questionTypes[qi] === 'scale'
              ? `<div class="mt-3 space-y-2 rounded-lg bg-slate-50 p-3 sm:ml-9">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Scoring guide</p>
            ${this.levels(scaleMax).map(
              (s) => `
              <div class="flex items-start gap-2">
                <span class="mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-xs font-bold text-purple-700 ring-1 ring-slate-200">${s}</span>
                <textarea rows="2" placeholder="${UI.escape(this.PLACEHOLDERS[s - 1] || `What a score of ${s} means`)}"
                  oninput="Stage2ManagementPage.updateDraft(${qi}, 'score${s}', this.value)" class="input resize-y text-xs">${UI.escape(scoringDescriptions[qi][`score${s}`])}</textarea>
              </div>`,
            ).join('')}
          </div>`
              : '<p class="mt-2 text-xs text-slate-500 sm:ml-9">Judges answer Yes or No.</p>'
          }
        </div>`,
        )
        .join('') +
      `
      <button type="button" onclick="Stage2ManagementPage.addQuestion()"
        class="w-full rounded-lg border-2 border-dashed border-slate-300 py-2.5 text-sm font-medium text-purple-700 hover:border-purple-400 hover:bg-purple-50">
        + Add question
      </button>`;
  }

  static updateDraft(qi, field, value) {
    if (!this.draft) return;
    if (field === 'question') this.draft.questions[qi] = value;
    else this.draft.scoringDescriptions[qi][field] = value;
  }

  static addQuestion() {
    if (!this.draft) return;
    this.draft.questions.push('');
    this.draft.questionTypes.push('scale');
    this.draft.scoringDescriptions.push(Object.fromEntries(this.levels(10).map((s) => [`score${s}`, ''])));
    this.renderDraft();
    const input = document.getElementById(`question_${this.draft.questions.length - 1}`);
    input.scrollIntoView({ block: 'center', behavior: 'smooth' });
    input.focus({ preventScroll: true });
  }

  static removeQuestion(qi) {
    if (!this.draft || this.draft.questions.length <= 1) return;
    this.draft.questions.splice(qi, 1);
    this.draft.questionTypes.splice(qi, 1);
    this.draft.scoringDescriptions.splice(qi, 1);
    this.renderDraft();
  }

  // A question's type (qi), or the award's scale range / yes-no share (qi = null)
  static setScoring(qi, field, value) {
    if (!this.draft) return;
    if (field === 'type') this.draft.questionTypes[qi] = value;
    else this.draft[field] = value;
    if (field !== 'yesNoWeight') this.renderDraft();
  }

  static async closeEditModal(force = false) {
    if (!force && this.saving) return;
    if (
      !force &&
      this.draft &&
      JSON.stringify(this.draft) !== this.snapshot &&
      !(await UI.confirm({ title: 'Discard changes?', message: 'Your edits to this award have not been saved.', confirmText: 'Discard', danger: true }))
    ) {
      return;
    }
    document.getElementById('editAwardModal')?.classList.add('hidden');
    this.draft = null;
    this.editIndex = null;
  }

  static async saveAwardCriteria() {
    const draft = this.draft;
    if (!draft || this.saving) return;
    if (!draft.questions.length) {
      UI.toast('Add at least one question', 'error');
      return;
    }
    const empty = draft.questions.findIndex((q) => !String(q).trim());
    if (empty !== -1) {
      UI.toast(`Question ${empty + 1} is empty`, 'error');
      document.getElementById(`question_${empty}`)?.focus();
      return;
    }
    const award = this.awards[this.editIndex];
    const criteria = this.awards.map((a, i) =>
      i === this.editIndex
        ? {
            ...a,
            questions: [...draft.questions],
            questionTypes: [...draft.questionTypes],
            scaleMax: draft.scaleMax,
            yesNoWeight: draft.yesNoWeight,
            scoringDescriptions: draft.scoringDescriptions.map((d) => ({ ...d })),
          }
        : a,
    );
    const timerInput = Number(document.getElementById('timerMinutes').value);
    const timerMinutes = Number.isInteger(timerInput) && timerInput >= 1 && timerInput <= 180 ? timerInput : this.savedTimer;

    const btn = document.getElementById('saveAwardBtn');
    this.saving = true;
    btn.disabled = true;
    btn.innerHTML = `${this.SPINNER} Saving…`;
    try {
      const stage = await UI.api('/api/stages/Stage%202', { method: 'PUT', body: { criteria, timerMinutes } });
      this.awards = stage && Array.isArray(stage.criteria) ? stage.criteria : criteria;
      this.savedTimer = (stage && stage.timerMinutes) || timerMinutes;
      this.saving = false;
      this.closeEditModal(true);
      this.renderAwardList();
      UI.toast(`${award.name} criteria saved`, 'success');
    } catch (e) {
      UI.toast(`Could not save criteria: ${e.message}`, 'error');
    } finally {
      this.saving = false;
      btn.disabled = false;
      btn.textContent = 'Save changes';
    }
  }

  static async saveTimer() {
    const input = document.getElementById('timerMinutes');
    const timerMinutes = Number(input.value);
    if (!Number.isInteger(timerMinutes) || timerMinutes < 1 || timerMinutes > 180) {
      UI.toast('The timer must be a whole number between 1 and 180 minutes', 'error');
      input.focus();
      return;
    }
    const btn = document.getElementById('stage2TimerBtn');
    btn.disabled = true;
    btn.innerHTML = `${this.SPINNER} Saving…`;
    try {
      await UI.api('/api/stages/Stage%202', { method: 'PUT', body: { timerMinutes } });
      this.savedTimer = timerMinutes;
      UI.toast(`Stage 2 timer set to ${timerMinutes} minutes per team`, 'success');
    } catch (e) {
      UI.toast(`Could not save timer: ${e.message}`, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save timer';
    }
  }
}
