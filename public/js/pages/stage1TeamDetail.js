// Stage 1 Team Detail Page (for Judges)
class Stage1TeamDetailPage {
  static state = null;
  static loadSeq = 0;
  static highlight = ['ring-2', 'ring-amber-400', 'bg-amber-50'];
  static timerBase = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-xs font-semibold tabular-nums';
  static icons = {
    back: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>',
    arrow: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>',
    clock: '<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
    yes: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>',
    no: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>',
    spinner: '<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>',
  };

  static render() {
    return `
      ${Navbar.render('Stage 1 Evaluation')}
      <main id="stage1Root" class="mx-auto max-w-6xl px-4 pb-40 sm:px-6 lg:px-8 lg:pb-12">
        ${Stage1TeamDetailPage.renderSkeleton()}
      </main>
    `;
  }

  static afterRender() {
    window.scrollTo(0, 0);
    const teamId = Stage1TeamDetailPage.getTeamIdFromUrl();
    if (teamId) Stage1TeamDetailPage.load(teamId);
  }

  static getTeamIdFromUrl() {
    const match = window.location.pathname.match(/\/stage1\/(.+)/);
    return match ? match[1] : null;
  }

  static async load(teamId) {
    const seq = ++this.loadSeq;
    const root = () => (seq === this.loadSeq ? document.getElementById('stage1Root') : null);
    this.state = null;
    root().innerHTML = this.renderSkeleton();

    const judgeId = authService.getUserId();
    let scoreError = null;
    let results;
    try {
      results = await Promise.all([
        UI.api('/api/stages/Stage%201'),
        UI.api(`/api/teams/${encodeURIComponent(teamId)}`),
        UI.api('/api/judges/assigned-teams'),
        UI.api(`/api/scores/judge/${encodeURIComponent(judgeId)}/team/${encodeURIComponent(teamId)}/stage/1`).catch((error) => {
          scoreError = error;
          return null;
        }),
      ]);
    } catch (error) {
      if (root()) root().innerHTML = this.renderError(error.message);
      return;
    }
    if (!root()) return;

    const [stage, team, assigned, score] = results;
    const assignedTeam = (assigned.stage1Teams || []).find((t) => t._id === team._id);
    if (!assignedTeam) {
      root().innerHTML = this.renderError('This team is not in your Stage 1 panels.');
      return;
    }
    const saved = score && score.scores ? score.scores : null;
    // Only the criteria selected for this team's panel (null = all Stage 1 criteria)
    const criteriaIds = assignedTeam.criteriaIds;
    const criteria = (stage.criteria || []).filter((c) => !criteriaIds || criteriaIds.includes(c._id)).map((c) => ({
      name: c.name,
      weight: c.weight,
      questions: Array.isArray(c.questions)
        ? c.questions
        : Array.from({ length: c.questions || 0 }, (_, i) => `Question ${i + 1}`),
    }));
    const scoredIds = new Set(assigned.stage1ScoredTeamIds || []);
    if (saved) scoredIds.add(team._id);

    this.state = {
      team,
      criteria,
      scoredIds,
      teams: assigned.stage1Teams || [],
      answers: criteria.map((c) =>
        c.questions.map((_, qi) => {
          const value = saved?.[c.name]?.[qi];
          return value === 1 || value === 0 ? value : null;
        }),
      ),
      dirty: false,
      saving: false,
    };

    root().innerHTML = this.renderPage();
    document.getElementById('scoringForm').addEventListener('change', (e) => this.onAnswer(e));
    this.refresh();
    this.startTimer(stage.timerMinutes || 30);
    if (scoreError) UI.toast(`Couldn't load your saved score: ${scoreError.message}`, 'warning');
  }

  static renderSkeleton() {
    const block = `
      <div class="card card-body space-y-3">
        <div class="skeleton h-5 w-1/3"></div>
        <div class="skeleton h-12 w-full"></div>
        <div class="skeleton h-12 w-full"></div>
      </div>`;
    return `
      <div class="mb-4 h-8"></div>
      <div class="card card-body space-y-3" aria-busy="true">
        <div class="skeleton h-4 w-24"></div>
        <div class="skeleton h-8 w-2/3"></div>
        <div class="skeleton h-4 w-1/2"></div>
        <span class="sr-only">Loading team…</span>
      </div>
      <div class="mt-6 grid gap-6 lg:grid-cols-3">
        <div class="space-y-4 lg:col-span-2">${block}${block}</div>
        <div class="card card-body hidden h-72 lg:block"><div class="skeleton h-full w-full"></div></div>
      </div>
    `;
  }

  static renderError(message) {
    return `
      <div class="card mx-auto mt-6 max-w-lg">
        ${UI.emptyState("Couldn't load this team", message)}
        <div class="flex justify-center gap-3 px-6 pb-8">
          <button onclick="router.navigate('/dashboard')" class="btn btn-secondary">Back to dashboard</button>
          <button onclick="Stage1TeamDetailPage.afterRender()" class="btn btn-primary">Retry</button>
        </div>
      </div>
    `;
  }

  static renderPage() {
    const { team, criteria } = this.state;
    const maxWeighted = criteria.reduce((sum, c) => sum + c.questions.length * c.weight, 0);
    return `
      <div class="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <button onclick="Stage1TeamDetailPage.goToDashboard()" class="btn btn-ghost btn-sm -ml-3">${this.icons.back} Dashboard</button>
        <p id="s1Position" class="text-sm text-slate-500"></p>
      </div>

      ${this.renderTeamHeader(team)}

      <div class="mt-6 grid gap-6 lg:grid-cols-3">
        <div id="scoringForm" class="space-y-4 lg:col-span-2">
          ${criteria.length
            ? criteria.map((c, ci) => this.renderCriterion(c, ci, maxWeighted)).join('')
            : `<div class="card">${UI.emptyState('No criteria configured', 'Please contact the administrator.')}</div>`}
        </div>
        ${this.renderSummary()}
      </div>

      ${this.renderActionBar()}
    `;
  }

  static renderTeamHeader(team) {
    return `
      <section class="card overflow-hidden">
        <div class="h-1 bg-blue-600"></div>
        <div class="card-body">
          <div class="flex flex-wrap items-center gap-2">
            <span class="badge badge-blue">Stage 1</span>
            <span id="s1Status" class="badge badge-gray">Not scored yet</span>
          </div>
          <h2 class="mt-2 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">${UI.escape(team.name)}</h2>
          <dl class="mt-3 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt class="text-xs font-medium uppercase tracking-wide text-slate-400">Challenge</dt>
              <dd class="mt-0.5 text-slate-800">${UI.escape(team.challenge || '—')}</dd>
            </div>
            <div>
              <dt class="text-xs font-medium uppercase tracking-wide text-slate-400">Solution type</dt>
              <dd class="mt-0.5">${team.actualSolution ? `<span class="badge badge-gray uppercase">${UI.escape(team.actualSolution)}</span>` : '<span class="text-slate-800">—</span>'}</dd>
            </div>
          </dl>
          <div class="mt-5 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">${UI.teamLinkButtons(team)}</div>
        </div>
      </section>
    `;
  }

  static renderCriterion(criterion, ci, maxWeighted) {
    const count = criterion.questions.length;
    const share = maxWeighted > 0 ? Math.round(((count * criterion.weight) / maxWeighted) * 100) : 0;
    return `
      <section class="card">
        <div class="card-header">
          <div class="min-w-0">
            <h3 class="card-title">${UI.escape(criterion.name)}</h3>
            <p class="mt-0.5 text-xs text-slate-500">${count} question${count === 1 ? '' : 's'} · ${share}% of score</p>
          </div>
          <span id="s1c_${ci}" class="badge badge-gray"></span>
        </div>
        <div class="space-y-2 p-3 sm:p-4">
          ${criterion.questions.map((question, qi) => this.renderQuestion(question, ci, qi)).join('')}
        </div>
      </section>
    `;
  }

  static renderQuestion(question, ci, qi) {
    const value = this.state.answers[ci][qi];
    const name = `s1_${ci}_${qi}`;
    return `
      <div id="s1q_${ci}_${qi}" class="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 transition-colors sm:flex-row sm:items-center sm:gap-4">
        <p class="flex-1 text-sm leading-relaxed text-slate-800"><span class="mr-1 font-semibold text-slate-400">${qi + 1}.</span>${UI.escape(question)}</p>
        <div class="grid shrink-0 grid-cols-2 gap-2 sm:w-48" role="radiogroup" aria-label="Question ${qi + 1}">
          <label class="cursor-pointer">
            <input type="radio" name="${name}" value="1" data-ci="${ci}" data-qi="${qi}" class="peer sr-only" ${value === 1 ? 'checked' : ''}>
            <span class="flex h-11 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-50 peer-checked:border-emerald-600 peer-checked:bg-emerald-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500 peer-focus-visible:ring-offset-2">${this.icons.yes} Yes</span>
          </label>
          <label class="cursor-pointer">
            <input type="radio" name="${name}" value="0" data-ci="${ci}" data-qi="${qi}" class="peer sr-only" ${value === 0 ? 'checked' : ''}>
            <span class="flex h-11 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-50 peer-checked:border-rose-600 peer-checked:bg-rose-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-rose-500 peer-focus-visible:ring-offset-2">${this.icons.no} No</span>
          </label>
        </div>
      </div>
    `;
  }

  static renderTimer() {
    return `<span data-timer class="${this.timerBase} bg-slate-100 text-slate-700">${this.icons.clock}<span data-timer-text>--:--</span></span>`;
  }

  static renderSummary() {
    return `
      <aside class="hidden lg:block">
        <div class="card sticky top-24">
          <div class="card-body space-y-5">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-slate-500">Time left</span>
              ${this.renderTimer()}
            </div>
            <div>
              <p class="text-sm text-slate-500">Current score</p>
              <p class="mt-1 text-4xl font-bold tracking-tight text-slate-900"><span data-score>0.00</span><span class="text-lg font-medium text-slate-400"> / 5</span></p>
            </div>
            <div>
              <div class="mb-1.5 flex justify-between text-sm">
                <span class="text-slate-500">Answered</span>
                <span data-answered class="font-medium text-slate-900"></span>
              </div>
              <div class="progress"><div data-progress class="progress-bar" style="width: 0%"></div></div>
            </div>
            <div class="space-y-2 border-t border-slate-200 pt-5">
              <button data-submit onclick="Stage1TeamDetailPage.submitScore()" class="btn btn-primary w-full py-2.5"></button>
              <button data-next onclick="Stage1TeamDetailPage.goToNextTeam()" class="btn btn-secondary w-full py-2.5"></button>
              <p id="s1UpNext" class="truncate pt-1 text-center text-xs text-slate-500"></p>
            </div>
          </div>
        </div>
      </aside>
    `;
  }

  static renderActionBar() {
    return `
      <div class="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden" style="padding-bottom: env(safe-area-inset-bottom)">
        <div class="progress h-1 rounded-none"><div data-progress class="progress-bar rounded-none" style="width: 0%"></div></div>
        <div class="mx-auto max-w-3xl px-4 py-3">
          <div class="mb-2.5 flex items-center justify-between gap-3 text-sm text-slate-600">
            <p class="min-w-0 truncate"><span data-answered class="font-semibold text-slate-900"></span> answered · <span class="font-semibold text-slate-900"><span data-score>0.00</span> / 5</span></p>
            ${this.renderTimer()}
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button data-submit onclick="Stage1TeamDetailPage.submitScore()" class="btn btn-primary h-12 text-base"></button>
            <button data-next onclick="Stage1TeamDetailPage.goToNextTeam()" class="btn btn-secondary h-12 text-base"></button>
          </div>
        </div>
      </div>
    `;
  }

  static onAnswer(e) {
    const input = e.target;
    if (!this.state || input.dataset.ci === undefined) return;
    const ci = Number(input.dataset.ci);
    const qi = Number(input.dataset.qi);
    this.state.answers[ci][qi] = Number(input.value);
    this.state.dirty = true;
    document.getElementById(`s1q_${ci}_${qi}`).classList.remove(...this.highlight);
    this.refresh();
  }

  static computeScore() {
    const { criteria, answers } = this.state;
    let total = 0;
    let max = 0;
    let answered = 0;
    let count = 0;
    const criteriaScores = {};
    criteria.forEach((c, ci) => {
      const yes = answers[ci].filter((v) => v === 1).length;
      answered += answers[ci].filter((v) => v !== null).length;
      count += c.questions.length;
      total += yes * c.weight;
      max += c.questions.length * c.weight;
      criteriaScores[c.name] = yes;
    });
    // Normalized to a 5-point scale
    return { score: max > 0 ? (total / max) * 5 : 0, answered, count, criteriaScores };
  }

  static nextTeam() {
    const { teams, scoredIds, team } = this.state;
    const idx = teams.findIndex((t) => t._id === team._id);
    const others = idx === -1 ? teams : [...teams.slice(idx + 1), ...teams.slice(0, idx)];
    return others.find((t) => !scoredIds.has(t._id)) || (idx === -1 ? null : teams[idx + 1]) || null;
  }

  static refresh() {
    const s = this.state;
    const root = document.getElementById('stage1Root');
    if (!s || !root) return;

    const { score, answered, count } = this.computeScore();
    const scored = s.scoredIds.has(s.team._id);
    const next = this.nextTeam();

    root.querySelectorAll('[data-score]').forEach((el) => {
      el.textContent = score.toFixed(2);
    });
    root.querySelectorAll('[data-answered]').forEach((el) => {
      el.textContent = `${answered} / ${count}`;
    });
    root.querySelectorAll('[data-progress]').forEach((el) => {
      el.style.width = `${count ? (answered / count) * 100 : 0}%`;
    });

    s.criteria.forEach((c, ci) => {
      const badge = document.getElementById(`s1c_${ci}`);
      const done = s.answers[ci].filter((v) => v !== null).length;
      const yes = s.answers[ci].filter((v) => v === 1).length;
      const complete = done === c.questions.length;
      badge.className = complete ? 'badge badge-green' : 'badge badge-gray';
      badge.textContent = complete ? `${yes}/${c.questions.length} yes` : `${done}/${c.questions.length} answered`;
    });

    const status = document.getElementById('s1Status');
    if (scored && s.dirty) {
      status.className = 'badge badge-yellow';
      status.textContent = 'Unsaved changes';
    } else {
      status.className = scored ? 'badge badge-green' : 'badge badge-gray';
      status.textContent = scored ? 'Scored' : 'Not scored yet';
    }

    root.querySelectorAll('[data-submit]').forEach((btn) => {
      btn.disabled = s.saving || !count || answered < count;
      btn.title = answered < count ? 'Answer every question to submit' : '';
      btn.innerHTML = s.saving ? `${this.icons.spinner} Saving…` : scored ? 'Update score' : 'Submit score';
    });
    root.querySelectorAll('[data-next]').forEach((btn) => {
      btn.disabled = !scored || s.saving;
      btn.classList.toggle('btn-success', scored);
      btn.classList.toggle('btn-secondary', !scored);
      btn.title = scored ? '' : 'Submit your score first';
      btn.innerHTML = next ? `Next team ${this.icons.arrow}` : 'Finish';
    });
    document.getElementById('s1UpNext').textContent = !scored
      ? answered < count
        ? `Answer all questions to submit (${count - answered} left)`
        : 'Submit your score to continue'
      : next
        ? `Up next: ${next.name}`
        : 'All teams scored';

    const idx = s.teams.findIndex((t) => t._id === s.team._id);
    const remaining = s.teams.filter((t) => !s.scoredIds.has(t._id)).length;
    document.getElementById('s1Position').textContent = s.teams.length
      ? `${idx >= 0 ? `Team ${idx + 1} of ${s.teams.length} · ` : ''}${remaining ? `${remaining} left to score` : 'All teams scored'}`
      : '';
  }

  static startTimer(minutes) {
    clearInterval(window.stage1RefreshInterval);
    const endsAt = Date.now() + minutes * 60000;
    const tick = async () => {
      const timers = document.querySelectorAll('#stage1Root [data-timer]');
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      if (!timers.length || left === 0) clearInterval(window.stage1RefreshInterval);
      if (!timers.length) return;
      const tone =
        left === 0
          ? 'bg-red-600 text-white'
          : left <= 60
            ? 'bg-red-100 text-red-700'
            : left <= 300
              ? 'bg-amber-100 text-amber-800'
              : 'bg-slate-100 text-slate-700';
      const text =
        left === 0
          ? "Time's up"
          : `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
      timers.forEach((el) => {
        el.className = `${this.timerBase} ${tone}`;
        el.querySelector('[data-timer-text]').textContent = text;
      });
      if (left === 0) {
        // Time's up: the current answers are submitted (unanswered count as "No"), then the judge is offered the next team
        const s = this.state;
        if (!s || s.saving || !s.criteria.length) return;
        const pending = s.dirty || !s.scoredIds.has(s.team._id);
        if (pending) {
          s.answers.forEach((row, ci) =>
            row.forEach((v, qi) => {
              if (v !== null) return;
              row[qi] = 0;
              document.querySelector(`input[name="s1_${ci}_${qi}"][value="0"]`).checked = true;
            }),
          );
          if (!(await this.submitScore())) return;
        }
        const next = this.nextTeam();
        const go = await UI.confirm({
          title: "Time's up",
          message: pending
            ? 'Your score was submitted automatically with your current answers. Unanswered questions were counted as "No".'
            : 'Your score for this team is already submitted.',
          confirmText: next ? 'Go to next team' : 'Finish',
          cancelText: 'Stay on this team',
        });
        if (go && this.state === s) this.goToNextTeam();
      }
    };
    window.stage1RefreshInterval = setInterval(tick, 1000);
    tick();
  }

  static async submitScore() {
    const s = this.state;
    if (!s || s.saving) return;
    if (!s.criteria.length) {
      UI.toast('No criteria configured for Stage 1', 'error');
      return;
    }

    const missing = [];
    s.answers.forEach((row, ci) =>
      row.forEach((v, qi) => {
        if (v === null) missing.push(`${ci}_${qi}`);
      }),
    );
    if (missing.length) {
      missing.forEach((key) => document.getElementById(`s1q_${key}`).classList.add(...this.highlight));
      document.getElementById(`s1q_${missing[0]}`).scrollIntoView({ behavior: 'smooth', block: 'center' });
      UI.toast(`Please answer all questions before submitting (${missing.length} left).`, 'warning');
      return;
    }

    const scores = {};
    s.criteria.forEach((c, ci) => {
      scores[c.name] = s.answers[ci].map((v) => (v === 1 ? 1 : 0));
    });
    const { score, criteriaScores } = this.computeScore();

    s.saving = true;
    this.refresh();
    try {
      await UI.api('/api/scores', {
        method: 'POST',
        body: {
          teamId: s.team._id,
          stage: 1,
          scores,
          totalScore: score,
          criteriaScores,
        },
      });
      if (this.state !== s) return;
      s.scoredIds.add(s.team._id);
      s.dirty = false;
      const next = this.nextTeam();
      UI.toast(
        `Score saved for ${s.team.name}.${next ? ` Next up: ${next.name}` : ' All your teams are scored.'}`,
        'success',
      );
      return true;
    } catch (error) {
      UI.toast(`Failed to save score: ${error.message}`, 'error', 6000);
      return false;
    } finally {
      s.saving = false;
      if (this.state === s) this.refresh();
    }
  }

  static async goToNextTeam() {
    const s = this.state;
    if (!s || !s.scoredIds.has(s.team._id)) {
      UI.toast('Please submit your score before moving to the next team.', 'warning');
      return;
    }
    if (
      s.dirty &&
      !(await UI.confirm({
        title: 'Discard unsaved changes?',
        message: 'Your latest changes for this team have not been saved.',
        confirmText: 'Discard and continue',
        danger: true,
      }))
    ) {
      return;
    }
    const next = this.nextTeam();
    if (next) {
      router.navigate(`/stage1/${next._id}`);
    } else {
      UI.toast('All teams scored. Returning to dashboard.', 'success');
      router.navigate('/dashboard');
    }
  }

  static async goToDashboard() {
    if (
      this.state?.dirty &&
      !(await UI.confirm({
        title: 'Leave without saving?',
        message: 'Your answers for this team have not been saved.',
        confirmText: 'Leave',
        danger: true,
      }))
    ) {
      return;
    }
    router.navigate('/dashboard');
  }
}
