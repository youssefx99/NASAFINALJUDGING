// Stage 1 Management Page
class Stage1ManagementPage {
  static DEFAULT_CRITERIA = [
    {
      name: 'Impact',
      questions: ['Does the solution address a significant problem?', 'Will it have meaningful impact?', 'Is the scope appropriate?'],
      weight: 0.3,
    },
    {
      name: 'Creativity',
      questions: ['Is the approach innovative?', 'Does it show original thinking?'],
      weight: 0.2,
    },
    {
      name: 'Technical Implementation',
      questions: ['Is the technical approach sound?', 'Is the implementation feasible?', 'Are the tools appropriate?'],
      weight: 0.3,
    },
    {
      name: 'Presentation',
      questions: ['Is the presentation clear?', 'Are the materials well-organized?'],
      weight: 0.2,
    },
  ];

  static ICONS = {
    plus: 'M12 4v16m8-8H4',
    trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    alert: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  };

  static SPINNER =
    '<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>';

  static criteria = [];
  static loaded = false;
  static saving = false;

  static svg(d, cls = 'h-4 w-4') {
    return `<svg class="${cls}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${d}"></path></svg>`;
  }

  static render() {
    const cardSkeleton =
      '<div class="card card-body space-y-4"><div class="skeleton h-5 w-40"></div><div class="skeleton h-9 w-full"></div><div class="skeleton h-9 w-full"></div><div class="skeleton h-9 w-2/3"></div></div>';
    return Layout.admin({
      title: 'Stage 1 Criteria',
      subtitle: 'Judging timer and weighted scoring criteria used by Stage 1 panels',
      actions: `
        <span id="stage1Dirty" class="badge badge-yellow hidden">Unsaved changes</span>
        <button type="button" onclick="Stage1ManagementPage.addCriterion()" class="btn btn-secondary">
          ${Stage1ManagementPage.svg(Stage1ManagementPage.ICONS.plus)} Add criterion
        </button>
        <button type="button" id="stage1SaveBtn" onclick="Stage1ManagementPage.saveCriteria()" class="btn btn-primary">Save criteria</button>`,
      content: `
        <div class="mx-auto max-w-5xl space-y-6">
          <div class="grid gap-6 lg:grid-cols-3">
            <div class="card lg:col-span-2">
              <div class="card-header">
                <div>
                  <h2 class="card-title">Judging timer</h2>
                  <p class="mt-0.5 text-sm text-slate-500">Shown to judges while they score each Stage 1 team.</p>
                </div>
              </div>
              <div class="card-body flex flex-wrap items-end gap-3">
                <div>
                  <label for="timerMinutes" class="label">Minutes per team</label>
                  <input id="timerMinutes" type="number" min="1" max="180" step="1" value="30" disabled class="input w-32">
                </div>
                <button type="button" id="stage1TimerBtn" onclick="Stage1ManagementPage.saveTimer()" disabled class="btn btn-secondary">Save timer</button>
                <p class="w-full text-xs text-slate-500">Between 1 and 180 minutes. Saving criteria also saves this value.</p>
              </div>
            </div>
            <div id="stage1Summary" class="card card-body space-y-3">
              <div class="skeleton h-3 w-24"></div><div class="skeleton h-8 w-20"></div><div class="skeleton h-2 w-full"></div>
            </div>
          </div>
          <div id="criteriaForm" class="space-y-4">${cardSkeleton.repeat(2)}</div>
        </div>`,
    });
  }

  static afterRender() {
    Stage1ManagementPage.loadCurrentCriteria();
  }

  static async loadCurrentCriteria() {
    this.loaded = false;
    const form = document.getElementById('criteriaForm');
    if (!form.querySelector('.skeleton')) form.innerHTML = `<div class="card">${UI.spinner('Loading criteria...')}</div>`;
    try {
      const stage = await UI.api('/api/stages/Stage%201');
      if (!document.getElementById('criteriaForm')) return;
      this.applyStage(stage);
      if (!(stage && stage.criteria && stage.criteria.length)) {
        this.setDirty(true);
        UI.toast('No Stage 1 criteria saved yet. Defaults are loaded: review them and click Save criteria.', 'info', 6000);
      }
    } catch (e) {
      if (!document.getElementById('criteriaForm')) return;
      document.getElementById('stage1Summary').innerHTML = '<p class="text-sm text-slate-500">Weights unavailable.</p>';
      document.getElementById('criteriaForm').innerHTML = `
        <div class="card flex flex-col items-center px-6 py-12 text-center">
          <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">${this.svg(this.ICONS.alert, 'h-6 w-6')}</div>
          <p class="text-sm font-medium text-slate-900">Couldn't load Stage 1 criteria</p>
          <p class="mt-1 text-sm text-slate-500">${UI.escape(e.message)}</p>
          <button type="button" onclick="Stage1ManagementPage.loadCurrentCriteria()" class="btn btn-secondary mt-4">Try again</button>
        </div>`;
    }
  }

  static applyStage(stage) {
    const source = stage && Array.isArray(stage.criteria) && stage.criteria.length ? stage.criteria : JSON.parse(JSON.stringify(this.DEFAULT_CRITERIA));
    this.criteria = source.map((c) => {
      const questions = Array.isArray(c.questions) ? c.questions : [];
      return { ...c, questions, questionTypes: questions.map((_, qi) => (c.questionTypes && c.questionTypes[qi]) || 'yesno') };
    });
    const timer = document.getElementById('timerMinutes');
    timer.value = (stage && stage.timerMinutes) || 30;
    timer.disabled = false;
    document.getElementById('stage1TimerBtn').disabled = false;
    this.loaded = true;
    this.setDirty(false);
    this.renderCriteriaForm();
  }

  static percent(weight) {
    return Math.round((Number(weight) || 0) * 1000) / 10;
  }

  static setup(c) {
    return { types: c.questionTypes, scaleMax: c.scaleMax, yesNoWeight: c.yesNoWeight };
  }

  static criterionMeta(c) {
    const n = c.questions.length;
    return `${n} question${n === 1 ? '' : 's'} (${UI.questionMixLabel(this.setup(c))}) · up to ${n} point${n === 1 ? '' : 's'} · weighted score ${(n * (Number(c.weight) || 0)).toFixed(2)}`;
  }

  static renderSummary() {
    const el = document.getElementById('stage1Summary');
    if (!el) return;
    const total = this.percent(this.criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0));
    const diff = Math.round(Math.abs(100 - total) * 10) / 10;
    const ok = diff <= 1;
    const tone = ok ? 'text-emerald-600' : total > 100 ? 'text-red-600' : 'text-amber-600';
    const bar = ok ? 'bg-emerald-500' : total > 100 ? 'bg-red-500' : 'bg-amber-500';
    const questions = this.criteria.reduce((sum, c) => sum + c.questions.length, 0);
    el.innerHTML = `
      <p class="stat-label">Total weight</p>
      <p class="text-3xl font-semibold tabular-nums ${tone}">${total}%</p>
      <div class="progress"><div class="progress-bar ${bar}" style="width: ${Math.min(total, 100)}%"></div></div>
      <p class="text-xs ${ok ? 'text-slate-500' : 'text-amber-700'}">${ok ? 'Weights add up to 100%.' : `Weights must add up to 100% (${diff}% ${total > 100 ? 'over' : 'left to assign'}).`}</p>
      <p class="border-t border-slate-100 pt-3 text-sm text-slate-600">${this.criteria.length} ${this.criteria.length === 1 ? 'criterion' : 'criteria'} · ${questions} question${questions === 1 ? '' : 's'}</p>`;
  }

  static renderCriteriaForm() {
    const container = document.getElementById('criteriaForm');
    if (!container) return;
    const single = this.criteria.length <= 1;
    container.innerHTML = this.criteria
      .map(
        (c, i) => `
      <div id="criterion-${i}" class="card">
        <div class="card-header">
          <div class="flex items-center gap-3">
            <span class="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">${i + 1}</span>
            <h3 class="card-title">Criterion ${i + 1}</h3>
          </div>
          <button type="button" onclick="Stage1ManagementPage.removeCriterion(${i})" ${single ? 'disabled title="At least one criterion is required"' : ''}
            class="btn btn-ghost btn-sm text-red-600 hover:bg-red-50 hover:text-red-700">
            ${this.svg(this.ICONS.trash)} Remove
          </button>
        </div>
        <div class="card-body space-y-5">
          <div class="grid gap-4 sm:grid-cols-3">
            <div class="sm:col-span-2">
              <label for="crit-name-${i}" class="label">Name</label>
              <input id="crit-name-${i}" type="text" value="${UI.escape(c.name)}" placeholder="e.g., Impact"
                oninput="Stage1ManagementPage.updateCriterion(${i}, 'name', this.value)" class="input">
            </div>
            <div>
              <label for="crit-weight-${i}" class="label">Weight</label>
              <div class="relative">
                <input id="crit-weight-${i}" type="number" min="0" max="100" step="any" value="${this.percent(c.weight)}"
                  oninput="Stage1ManagementPage.updateCriterion(${i}, 'weight', this.value)" class="input pr-8">
                <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">%</span>
              </div>
            </div>
          </div>
          <div>
            <div class="mb-2 flex items-center justify-between gap-2">
              <p class="text-sm font-medium text-slate-700">Questions <span class="font-normal text-slate-400">· 1 point each</span></p>
              <button type="button" onclick="Stage1ManagementPage.addQuestion(${i})" class="btn btn-ghost btn-sm text-blue-600 hover:bg-blue-50 hover:text-blue-700">
                ${this.svg(this.ICONS.plus)} Add question
              </button>
            </div>
            <div class="space-y-2">
              ${c.questions
                .map(
                  (q, qi) => `
                <div class="flex items-center gap-2">
                  <span class="w-6 shrink-0 text-right text-sm tabular-nums text-slate-400">${qi + 1}.</span>
                  <input id="q-${i}-${qi}" type="text" value="${UI.escape(q)}" placeholder="Enter question text…"
                    oninput="Stage1ManagementPage.updateQuestion(${i}, ${qi}, this.value)" class="input">
                  ${UI.questionTypeSelect(c.questionTypes[qi], `Stage1ManagementPage.setScoring(${i}, ${qi}`)}
                  <button type="button" onclick="Stage1ManagementPage.removeQuestion(${i}, ${qi})" ${c.questions.length <= 1 ? 'disabled' : ''}
                    title="Remove question" aria-label="Remove question"
                    class="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-40">
                    ${this.svg(this.ICONS.trash)}
                  </button>
                </div>`,
                )
                .join('')}
            </div>
            <div id="crit-mix-${i}" class="mt-3">${UI.scoringSetup(this.setup(c), `Stage1ManagementPage.setScoring(${i}, null`)}</div>
            <p id="crit-meta-${i}" class="mt-3 text-xs text-slate-500">${this.criterionMeta(c)}</p>
          </div>
        </div>
      </div>`,
      )
      .join('');
    this.renderSummary();
  }

  static setDirty(dirty) {
    document.getElementById('stage1Dirty')?.classList.toggle('hidden', !dirty);
  }

  static focusInput(id) {
    const input = document.getElementById(id);
    if (!input) return;
    input.scrollIntoView({ block: 'center', behavior: 'smooth' });
    input.focus({ preventScroll: true });
    input.select();
  }

  static addCriterion() {
    if (!this.loaded) return;
    this.criteria.push({ name: 'New criterion', questions: [''], questionTypes: ['yesno'], weight: 0.1 });
    this.setDirty(true);
    this.renderCriteriaForm();
    this.focusInput(`crit-name-${this.criteria.length - 1}`);
  }

  static async removeCriterion(index) {
    const c = this.criteria[index];
    if (!c || this.criteria.length <= 1) return;
    const ok = await UI.confirm({
      title: `Remove "${c.name || `Criterion ${index + 1}`}"?`,
      message: `Its ${c.questions.length} question(s) will be removed when you save the criteria.`,
      confirmText: 'Remove',
      danger: true,
    });
    if (!ok) return;
    this.criteria.splice(index, 1);
    this.setDirty(true);
    this.renderCriteriaForm();
  }

  static updateCriterion(index, field, value) {
    const c = this.criteria[index];
    if (!c) return;
    // Weight is edited as a percentage but stored as a 0-1 fraction
    if (field === 'weight') c.weight = Math.round((parseFloat(value) || 0) * 10) / 1000;
    else c[field] = value;
    const meta = document.getElementById(`crit-meta-${index}`);
    if (meta) meta.textContent = this.criterionMeta(c);
    this.renderSummary();
    this.setDirty(true);
  }

  static addQuestion(index) {
    const c = this.criteria[index];
    if (!c) return;
    c.questions.push('');
    c.questionTypes.push('yesno');
    this.setDirty(true);
    this.renderCriteriaForm();
    this.focusInput(`q-${index}-${c.questions.length - 1}`);
  }

  static removeQuestion(index, questionIndex) {
    const c = this.criteria[index];
    if (!c || c.questions.length <= 1) return;
    c.questions.splice(questionIndex, 1);
    c.questionTypes.splice(questionIndex, 1);
    this.setDirty(true);
    this.renderCriteriaForm();
  }

  // A question's type, or the criterion's scale range / yes-no share
  static setScoring(index, questionIndex, field, value) {
    const c = this.criteria[index];
    if (!c) return;
    if (field === 'type') c.questionTypes[questionIndex] = value;
    else c[field] = value;
    if (field !== 'yesNoWeight') document.getElementById(`crit-mix-${index}`).innerHTML = UI.scoringSetup(this.setup(c), `Stage1ManagementPage.setScoring(${index}, null`);
    document.getElementById(`crit-meta-${index}`).textContent = this.criterionMeta(c);
    this.setDirty(true);
  }

  static updateQuestion(index, questionIndex, value) {
    const c = this.criteria[index];
    if (!c || c.questions[questionIndex] === undefined) return;
    c.questions[questionIndex] = value;
    this.setDirty(true);
  }

  static readTimer() {
    const input = document.getElementById('timerMinutes');
    const minutes = Number(input.value);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 180) {
      UI.toast('The timer must be a whole number between 1 and 180 minutes', 'error');
      input.focus();
      return null;
    }
    return minutes;
  }

  static async saveTimer() {
    const timerMinutes = this.readTimer();
    if (timerMinutes === null) return;
    const btn = document.getElementById('stage1TimerBtn');
    btn.disabled = true;
    btn.innerHTML = `${this.SPINNER} Saving…`;
    try {
      await UI.api('/api/stages/Stage%201', { method: 'PUT', body: { timerMinutes } });
      UI.toast(`Stage 1 timer set to ${timerMinutes} minutes per team`, 'success');
    } catch (e) {
      UI.toast(`Could not save timer: ${e.message}`, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save timer';
    }
  }

  static async saveCriteria() {
    if (!this.loaded || this.saving) return;
    if (!this.criteria.length) {
      UI.toast('Add at least one criterion', 'error');
      return;
    }
    const total = this.criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
    if (Math.abs(total - 1.0) > 0.01) {
      UI.toast(`Weights must add up to 100%. Current total: ${this.percent(total)}%`, 'error');
      return;
    }
    const unnamed = this.criteria.findIndex((c) => !String(c.name || '').trim());
    if (unnamed !== -1) {
      UI.toast('Every criterion needs a name', 'error');
      this.focusInput(`crit-name-${unnamed}`);
      return;
    }
    for (const [i, c] of this.criteria.entries()) {
      const empty = c.questions.findIndex((q) => !String(q || '').trim());
      if (!c.questions.length || empty !== -1) {
        UI.toast(`Criterion ${i + 1} has an empty question`, 'error');
        if (empty !== -1) this.focusInput(`q-${i}-${empty}`);
        return;
      }
    }
    const timerMinutes = this.readTimer();
    if (timerMinutes === null) return;

    const btn = document.getElementById('stage1SaveBtn');
    this.saving = true;
    btn.disabled = true;
    btn.innerHTML = `${this.SPINNER} Saving…`;
    try {
      const stage = await UI.api('/api/stages/Stage%201', {
        method: 'PUT',
        body: { criteria: this.criteria, timerMinutes },
      });
      UI.toast('Stage 1 criteria saved', 'success');
      if (stage && Array.isArray(stage.criteria) && stage.criteria.length) this.applyStage(stage);
      else this.setDirty(false);
    } catch (e) {
      UI.toast(`Could not save criteria: ${e.message}`, 'error');
    } finally {
      this.saving = false;
      btn.disabled = false;
      btn.textContent = 'Save criteria';
    }
  }
}
