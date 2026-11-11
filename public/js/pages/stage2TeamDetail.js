// Stage 2 / Special panel Team Detail Page (for Judges): 1–5 rating per question
class Stage2TeamDetailPage {
  static state = null;
  static loadSeq = 0;
  static highlight = ['ring-2', 'ring-red-400', 'bg-red-50'];
  static icons = {
    back: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>',
    arrow: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>',
    clock: '<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
    spinner: '<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>',
  };

  static render() {
    return `
      ${Navbar.render(Stage2TeamDetailPage.special() ? 'Special Panel Evaluation' : 'Stage 2 Evaluation')}
      <main id="stage2Root" class="mx-auto max-w-6xl px-4 pb-40 sm:px-6 lg:px-8 lg:pb-12">
        ${Stage2TeamDetailPage.renderSkeleton()}
      </main>
    `;
  }

  static afterRender() {
    window.scrollTo(0, 0);
    const teamId = Stage2TeamDetailPage.getTeamIdFromUrl();
    if (teamId) Stage2TeamDetailPage.load(teamId);
  }

  // /special/:panelId/:teamId scores a team in a special panel instead of the judge's Stage 2 award
  static special() {
    const match = window.location.pathname.match(/^\/special\/([^/]+)\/([^/]+)/);
    return match ? { panelId: match[1], teamId: match[2] } : null;
  }

  // /stage2/:panelId/:teamId (or the older /stage2/:teamId)
  static stage2Route() {
    const match = window.location.pathname.match(/^\/stage2\/([^/]+)(?:\/([^/]+))?$/);
    if (!match) return null;
    return match[2] ? { panelId: match[1], teamId: match[2] } : { panelId: null, teamId: match[1] };
  }

  static getTeamIdFromUrl() {
    const special = this.special();
    if (special) return special.teamId;
    return this.stage2Route()?.teamId || null;
  }

  static async load(teamId) {
    const seq = ++this.loadSeq;
    const root = () => (seq === this.loadSeq ? document.getElementById('stage2Root') : null);
    this.state = null;
    root().innerHTML = this.renderSkeleton();

    const judgeId = authService.getUserId();
    const special = this.special();
    const route = special ? null : this.stage2Route();
    let scoreError = null;
    let results;
    try {
      results = await Promise.all([
        UI.api('/api/stages/Stage%202'),
        UI.api(`/api/teams/${encodeURIComponent(teamId)}`),
        UI.api('/api/judges/assigned-teams'),
        UI.api(
          special
            ? `/api/scores/judge/${encodeURIComponent(judgeId)}/team/${encodeURIComponent(teamId)}/stage/3?panel=${encodeURIComponent(special.panelId)}`
            : `/api/scores/judge/${encodeURIComponent(judgeId)}/team/${encodeURIComponent(teamId)}/stage/2${route?.panelId ? `?panel=${encodeURIComponent(route.panelId)}` : ''}`,
        ).catch((error) => {
          scoreError = error;
          return null;
        }),
      ]);
    } catch (error) {
      if (root()) root().innerHTML = this.renderError("Couldn't load this team", error.message);
      return;
    }
    if (!root()) return;

    const [stage, team, assigned, score] = results;
    let awardType, award, scoreKey, panelTeams, scoredTeamIds, panelId;
    if (special) {
      const panel = (assigned.specialPanels || []).find((p) => p._id === special.panelId);
      if (!panel) {
        root().innerHTML = this.renderError('Special panel not found', 'You are not assigned to this special panel.');
        return;
      }
      awardType = panel.name;
      scoreKey = panel._id;
      panelId = panel._id;
      panelTeams = panel.teams;
      scoredTeamIds = panel.scoredTeamIds;
      award = {
        questions: (panel.questions || []).map((q) => q.question),
        scoringDescriptions: (panel.questions || []).map((q) => q.descriptions || {}),
      };
    } else {
      const stage2Panels = assigned.stage2Panels || [];
      const panel = route?.panelId
        ? stage2Panels.find((p) => p._id === route.panelId)
        : stage2Panels.find((p) => (p.teams || []).some((t) => t._id === teamId));
      if (!panel) {
        root().innerHTML = this.renderError('No Stage 2 panel assignment found', 'You are not on a Stage 2 award panel for this team.');
        return;
      }
      if (!route?.panelId) {
        history.replaceState({}, '', `/stage2/${panel._id}/${teamId}`);
        router.currentRoute = window.location.pathname;
      }
      awardType = panel.awardType;
      panelId = panel._id;
      award = (stage.criteria || []).find((c) => c.name === awardType);
      if (!award) {
        root().innerHTML = this.renderError('No criteria configured', `There are no scoring questions for “${awardType}” yet. Please contact the administrator.`);
        return;
      }
      scoreKey = awardType;
      panelTeams = panel.teams;
      scoredTeamIds = panel.scoredTeamIds;
    }

    const saved = score && score.scores ? score.scores[scoreKey] : null;
    const scoredIds = new Set(scoredTeamIds || []);
    if (saved) scoredIds.add(team._id);
    const questions = award.questions || [];

    this.state = {
      team,
      awardType,
      scoreKey,
      special,
      panelId,
      questions,
      descriptions: award.scoringDescriptions || [],
      scoredIds,
      teams: panelTeams || [],
      answers: questions.map((_, qi) => {
        const value = Number(saved?.[qi]);
        return value >= 1 && value <= 5 ? value : null;
      }),
      dirty: false,
      saving: false,
    };

    root().innerHTML = this.renderPage();
    document.getElementById('scoringForm').addEventListener('change', (e) => this.onAnswer(e));
    this.refresh();
    if (!special) this.startTimer(stage.timerMinutes || 30);
    if (scoreError) UI.toast(`Couldn't load your saved score: ${scoreError.message}`, 'warning');
  }

  static renderSkeleton() {
    const block = `
      <div class="card card-body space-y-3">
        <div class="skeleton h-5 w-1/2"></div>
        <div class="grid grid-cols-5 gap-2">${'<div class="skeleton h-12"></div>'.repeat(5)}</div>
      </div>`;
    return `
      <div class="mb-4 h-8"></div>
      <div class="card card-body space-y-3" aria-busy="true">
        <div class="skeleton h-4 w-40"></div>
        <div class="skeleton h-8 w-2/3"></div>
        <div class="skeleton h-4 w-1/2"></div>
        <span class="sr-only">Loading team…</span>
      </div>
      <div class="mt-6 grid gap-6 lg:grid-cols-3">
        <div class="space-y-4 lg:col-span-2">${block}${block}${block}</div>
        <div class="card card-body hidden h-72 lg:block"><div class="skeleton h-full w-full"></div></div>
      </div>
    `;
  }

  static renderError(title, message) {
    return `
      <div class="card mx-auto mt-6 max-w-lg">
        ${UI.emptyState(title, message)}
        <div class="flex justify-center gap-3 px-6 pb-8">
          <button onclick="router.navigate('/dashboard')" class="btn btn-secondary">Back to dashboard</button>
          <button onclick="Stage2TeamDetailPage.afterRender()" class="btn bg-purple-600 text-white hover:bg-purple-700 focus-visible:ring-purple-500">Retry</button>
        </div>
      </div>
    `;
  }

  static renderPage() {
    const { team, questions } = this.state;
    return `
      <div class="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <button onclick="Stage2TeamDetailPage.goToDashboard()" class="btn btn-ghost btn-sm -ml-3">${this.icons.back} Dashboard</button>
        <p id="s2Position" class="text-sm text-slate-500"></p>
      </div>

      ${this.renderTeamHeader(team)}

      <div class="mt-6 grid gap-6 lg:grid-cols-3">
        <div id="scoringForm" class="space-y-4 lg:col-span-2">
          ${questions.length
            ? questions.map((question, qi) => this.renderQuestion(question, qi)).join('')
            : `<div class="card">${UI.emptyState('No questions configured', 'Please contact the administrator.')}</div>`}
        </div>
        ${this.renderSummary()}
      </div>

      ${this.renderActionBar()}
    `;
  }

  static renderTeamHeader(team) {
    return `
      <section class="card overflow-hidden">
        <div class="h-1 bg-purple-600"></div>
        <div class="card-body">
          <div class="flex flex-wrap items-center gap-2">
            <span class="badge badge-purple">${this.state.special ? 'Special panel' : 'Stage 2'}</span>
            <span class="badge badge-purple">${this.state.special ? '' : 'Award: '}${UI.escape(this.state.awardType)}</span>
            <span id="s2Status" class="badge badge-gray">Not scored yet</span>
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

  static renderQuestion(question, qi) {
    const value = this.state.answers[qi];
    const descriptions = this.state.descriptions[qi] || {};
    const hasDescriptions = [1, 2, 3, 4, 5].some((n) => descriptions[`score${n}`]);
    const options = [1, 2, 3, 4, 5]
      .map((n) => {
        const input = `<input type="radio" name="question_${qi}" id="q${qi}_${n}" value="${n}" data-qi="${qi}" class="peer sr-only" ${value === n ? 'checked' : ''}>`;
        if (!hasDescriptions) {
          return `
            <label class="cursor-pointer">
              ${input}
              <span class="flex h-12 items-center justify-center rounded-lg border border-slate-300 bg-white text-lg font-semibold text-slate-700 transition-colors hover:border-purple-300 hover:bg-purple-50 peer-checked:border-purple-600 peer-checked:bg-purple-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-purple-500 peer-focus-visible:ring-offset-2">${n}</span>
            </label>`;
        }
        const description = descriptions[`score${n}`];
        return `
          <label class="block cursor-pointer">
            ${input}
            <span class="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:border-purple-300 hover:bg-purple-50 peer-checked:border-purple-600 peer-checked:bg-purple-50 peer-checked:ring-1 peer-checked:ring-purple-600 peer-focus-visible:ring-2 peer-focus-visible:ring-purple-500">
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700">${n}</span>
              <span class="pt-1.5 text-sm text-slate-700">${description ? UI.escape(description) : `<span class="italic text-slate-400">Score ${n}</span>`}</span>
            </span>
          </label>`;
      })
      .join('');

    return `
      <section id="s2q_${qi}" class="card p-4 transition-colors sm:p-5">
        <p class="text-sm font-semibold leading-relaxed text-slate-900 sm:text-base"><span class="mr-1 text-purple-600">${qi + 1}.</span>${UI.escape(question)}</p>
        ${hasDescriptions
          ? `<div class="mt-3 space-y-2" role="radiogroup" aria-label="Question ${qi + 1}">${options}</div>`
          : `<div class="mt-3 grid grid-cols-5 gap-2" role="radiogroup" aria-label="Question ${qi + 1}">${options}</div>
             <div class="mt-1.5 flex justify-between px-1 text-xs text-slate-400"><span>Low</span><span>High</span></div>`}
      </section>
    `;
  }

  static renderTimer(big = false) {
    const base = big
      ? 'flex flex-col items-center rounded-xl px-4 py-3 transition-colors'
      : 'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-base font-bold tabular-nums transition-colors';
    return big
      ? `<div data-timer data-base="${base}" class="${base} bg-slate-100 text-slate-800">
          <span class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide opacity-80">${this.icons.clock} Time left</span>
          <span data-timer-text class="mt-1 font-mono text-4xl font-bold tabular-nums">--:--</span>
        </div>`
      : `<span data-timer data-base="${base}" class="${base} bg-slate-100 text-slate-800">${this.icons.clock}<span data-timer-text>--:--</span></span>`;
  }

  static renderSummary() {
    return `
      <aside class="hidden lg:block">
        <div class="card sticky top-24">
          <div class="card-body space-y-5">
            ${this.state.special ? '' : this.renderTimer(true)}
            <div>
              <p class="text-sm text-slate-500">Average score</p>
              <p class="mt-1 text-4xl font-bold tracking-tight text-slate-900"><span data-score>—</span><span class="text-lg font-medium text-slate-400"> / 5</span></p>
            </div>
            <div>
              <div class="mb-1.5 flex justify-between text-sm">
                <span class="text-slate-500">Answered</span>
                <span data-answered class="font-medium text-slate-900"></span>
              </div>
              <div class="progress"><div data-progress class="progress-bar bg-purple-600" style="width: 0%"></div></div>
            </div>
            <div class="space-y-2 border-t border-slate-200 pt-5">
              <button data-submit onclick="Stage2TeamDetailPage.submitScore()" class="btn w-full bg-purple-600 py-2.5 text-white hover:bg-purple-700 focus-visible:ring-purple-500"></button>
              <button data-next onclick="Stage2TeamDetailPage.goToNextTeam()" class="btn btn-secondary w-full py-2.5"></button>
              <p id="s2UpNext" class="truncate pt-1 text-center text-xs text-slate-500"></p>
            </div>
          </div>
        </div>
      </aside>
    `;
  }

  static renderActionBar() {
    return `
      <div class="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden" style="padding-bottom: env(safe-area-inset-bottom)">
        <div class="progress h-1 rounded-none"><div data-progress class="progress-bar rounded-none bg-purple-600" style="width: 0%"></div></div>
        <div class="mx-auto max-w-3xl px-4 py-3">
          <div class="mb-2.5 flex items-center justify-between gap-3 text-sm text-slate-600">
            <p class="min-w-0 truncate"><span data-answered class="font-semibold text-slate-900"></span> answered · avg <span class="font-semibold text-slate-900"><span data-score>—</span> / 5</span></p>
            ${this.state.special ? '' : this.renderTimer()}
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button data-submit onclick="Stage2TeamDetailPage.submitScore()" class="btn h-12 bg-purple-600 text-base text-white hover:bg-purple-700 focus-visible:ring-purple-500"></button>
            <button data-next onclick="Stage2TeamDetailPage.goToNextTeam()" class="btn btn-secondary h-12 text-base"></button>
          </div>
        </div>
      </div>
    `;
  }

  static onAnswer(e) {
    const input = e.target;
    if (!this.state || input.dataset.qi === undefined) return;
    const qi = Number(input.dataset.qi);
    this.state.answers[qi] = Number(input.value);
    this.state.dirty = true;
    document.getElementById(`s2q_${qi}`).classList.remove(...this.highlight);
    this.refresh();
  }

  static nextTeam() {
    const { teams, scoredIds, team } = this.state;
    const idx = teams.findIndex((t) => t._id === team._id);
    const others = idx === -1 ? teams : [...teams.slice(idx + 1), ...teams.slice(0, idx)];
    return others.find((t) => !scoredIds.has(t._id)) || (idx === -1 ? null : teams[idx + 1]) || null;
  }

  static refresh() {
    const s = this.state;
    const root = document.getElementById('stage2Root');
    if (!s || !root) return;

    const picked = s.answers.filter((v) => v !== null);
    const count = s.answers.length;
    const average = picked.length ? (picked.reduce((sum, v) => sum + v, 0) / picked.length).toFixed(2) : '—';
    const scored = s.scoredIds.has(s.team._id);
    const next = this.nextTeam();

    root.querySelectorAll('[data-score]').forEach((el) => {
      el.textContent = average;
    });
    root.querySelectorAll('[data-answered]').forEach((el) => {
      el.textContent = `${picked.length} / ${count}`;
    });
    root.querySelectorAll('[data-progress]').forEach((el) => {
      el.style.width = `${count ? (picked.length / count) * 100 : 0}%`;
    });

    const status = document.getElementById('s2Status');
    if (scored && s.dirty) {
      status.className = 'badge badge-yellow';
      status.textContent = 'Unsaved changes';
    } else {
      status.className = scored ? 'badge badge-green' : 'badge badge-gray';
      status.textContent = scored ? 'Scored' : 'Not scored yet';
    }

    root.querySelectorAll('[data-submit]').forEach((btn) => {
      btn.disabled = s.saving || !count || picked.length < count;
      btn.title = picked.length < count ? 'Rate every question to submit' : '';
      btn.innerHTML = s.saving ? `${this.icons.spinner} Saving…` : scored ? 'Update score' : 'Submit score';
    });
    root.querySelectorAll('[data-next]').forEach((btn) => {
      btn.disabled = !scored || s.saving;
      btn.classList.toggle('btn-success', scored);
      btn.classList.toggle('btn-secondary', !scored);
      btn.title = scored ? '' : 'Submit your score first';
      btn.innerHTML = next ? `Next team ${this.icons.arrow}` : 'Finish';
    });
    document.getElementById('s2UpNext').textContent = !scored
      ? picked.length < count
        ? `Rate all questions to submit (${count - picked.length} left)`
        : 'Submit your score to continue'
      : next
        ? `Up next: ${next.name}`
        : 'All teams scored';

    const idx = s.teams.findIndex((t) => t._id === s.team._id);
    const remaining = s.teams.filter((t) => !s.scoredIds.has(t._id)).length;
    document.getElementById('s2Position').textContent = s.teams.length
      ? `${idx >= 0 ? `Team ${idx + 1} of ${s.teams.length} · ` : ''}${remaining ? `${remaining} left to score` : 'All teams scored'}`
      : '';
  }

  static startTimer(minutes) {
    clearInterval(window.stage2RefreshInterval);
    // The countdown survives reloads: it starts the first time this judge opens this team
    const key = `scoreTimer:${authService.getUserId()}:2:${this.state.panelId}:${this.state.team._id}`;
    let startedAt = Date.now();
    try {
      startedAt = Number(localStorage.getItem(key)) || startedAt;
      localStorage.setItem(key, String(startedAt));
    } catch (e) {}
    const total = minutes * 60;
    const endsAt = startedAt + total * 1000;
    const tick = () => {
      const timers = document.querySelectorAll('#stage2Root [data-timer]');
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      if (!timers.length || left === 0) clearInterval(window.stage2RefreshInterval);
      if (!timers.length) return;
      const tone = left === 0 ? 'bg-red-600 text-white' : left <= total * 0.2 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-800';
      const text =
        left === 0
          ? "Time's up"
          : `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
      timers.forEach((el) => {
        el.className = `${el.dataset.base} ${tone}`;
        el.querySelector('[data-timer-text]').textContent = text;
      });
      if (left === 0) {
        document.getElementById('scoringForm')?.insertAdjacentHTML(
          'afterbegin',
          `<div class="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">${this.icons.clock} Time's up: you are over the time for this team. You can still finish and submit your score.</div>`,
        );
      }
    };
    window.stage2RefreshInterval = setInterval(tick, 1000);
    tick();
  }

  static async submitScore() {
    const s = this.state;
    if (!s || s.saving) return;
    if (!s.answers.length) {
      UI.toast(`No questions configured for ${s.awardType}`, 'error');
      return;
    }

    const missing = s.answers.map((v, qi) => (v === null ? qi : -1)).filter((qi) => qi >= 0);
    if (missing.length) {
      missing.forEach((qi) => document.getElementById(`s2q_${qi}`).classList.add(...this.highlight));
      document.getElementById(`s2q_${missing[0]}`).scrollIntoView({ behavior: 'smooth', block: 'center' });
      UI.toast(
        `Please answer all questions before submitting (${missing.length} left).`,
        'warning',
      );
      return;
    }

    const scores = [...s.answers];
    const averageScore = scores.reduce((sum, v) => sum + v, 0) / scores.length;

    s.saving = true;
    this.refresh();
    try {
      await UI.api('/api/scores', {
        method: 'POST',
        body: s.special
          ? { teamId: s.team._id, stage: 3, panelId: s.special.panelId, scores: { [s.scoreKey]: scores } }
          : {
              teamId: s.team._id,
              stage: 2,
              panelId: s.panelId,
              scores: { [s.scoreKey]: scores },
              totalScore: averageScore,
              awardType: s.awardType,
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
      router.navigate(s.special ? `/special/${s.special.panelId}/${next._id}` : `/stage2/${s.panelId}/${next._id}`);
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
