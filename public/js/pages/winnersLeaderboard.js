// Winners Leaderboard: ceremony presentation (winner + alphabetical honorable mentions per award)
class WinnersLeaderboardPage {
  static STORAGE_KEY = 'winnersLeaderboardSettings';
  static DEFAULTS = {
    title: 'NASA Space Apps Challenge',
    subtitle: 'Cairo',
    finalistsFirst: false,
    finalists: 4,
    order: [],
    excluded: [],
  };

  static data = [];
  static settings = { ...WinnersLeaderboardPage.DEFAULTS };
  static showPreview = false;
  static steps = [];
  static stepIndex = 0;
  static renderedSlide = null;
  static idleTimer = null;

  static icons = {
    presentation: 'M8 13v-1m4 1v-3m4 3V8M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z',
    eye: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
    eyeOff: 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21',
    refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    up: 'M5 15l7-7 7 7',
    down: 'M19 9l-7 7-7-7',
    grip: 'M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01',
    left: 'M15 19l-7-7 7-7',
    right: 'M9 5l7 7-7 7',
    expand: 'M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4',
    close: 'M6 18L18 6M6 6l12 12',
  };

  static svg(name, cls = 'h-4 w-4') {
    return `<svg class="${cls}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${WinnersLeaderboardPage.icons[name]}"></path></svg>`;
  }

  static render() {
    const P = WinnersLeaderboardPage;
    return Layout.admin({
      title: 'Winners Leaderboard',
      subtitle: 'Present the award winners at the closing ceremony',
      actions: `
        <button onclick="WinnersLeaderboardPage.load(true)" class="btn btn-secondary">${P.svg('refresh')} Reload results</button>
        <button id="startPresentationBtn" onclick="WinnersLeaderboardPage.start()" class="btn btn-primary" disabled>${P.svg('presentation')} Start presentation</button>`,
      content: `
        <div class="grid gap-6 xl:grid-cols-3">
          <div class="card xl:col-span-2">
            <div class="card-header">
              <div>
                <h3 class="card-title">Ceremony order</h3>
                <p class="mt-0.5 text-sm text-slate-500">Drag or use the arrows to set the order awards are presented. Untick an award to skip it.</p>
              </div>
              <button id="previewToggle" onclick="WinnersLeaderboardPage.togglePreview()" class="btn btn-secondary btn-sm">${P.svg('eye')} Show results</button>
            </div>
            <div id="awardOrderList" class="divide-y divide-slate-100">
              ${Array.from({ length: 6 }, () => '<div class="flex items-center gap-4 px-5 py-4"><div class="skeleton h-4 w-4"></div><div class="skeleton h-4 w-1/3"></div></div>').join('')}
            </div>
          </div>

          <div class="space-y-6">
            <div class="card">
              <div class="card-header"><h3 class="card-title">Presentation settings</h3></div>
              <div class="card-body space-y-4">
                <div>
                  <label class="label" for="lbTitle">Event title</label>
                  <input id="lbTitle" class="input" oninput="WinnersLeaderboardPage.updateSetting('title', this.value)">
                </div>
                <div>
                  <label class="label" for="lbSubtitle">Subtitle</label>
                  <input id="lbSubtitle" class="input" placeholder="e.g. Cairo 2026" oninput="WinnersLeaderboardPage.updateSetting('subtitle', this.value)">
                </div>
                <div>
                  <p class="label">Reveal order in each award</p>
                  <div class="space-y-2 text-sm text-slate-700">
                    <label class="flex items-center gap-2"><input type="radio" name="lbReveal" value="winner" class="accent-blue-600" onchange="WinnersLeaderboardPage.updateSetting('finalistsFirst', false)"> Winner first, then honorable mentions</label>
                    <label class="flex items-center gap-2"><input type="radio" name="lbReveal" value="finalists" class="accent-blue-600" onchange="WinnersLeaderboardPage.updateSetting('finalistsFirst', true)"> Honorable mentions first, then winner</label>
                  </div>
                </div>
                <div>
                  <label class="label" for="lbFinalists">Honorable mentions per award</label>
                  <select id="lbFinalists" class="input" onchange="WinnersLeaderboardPage.updateSetting('finalists', Number(this.value))">
                    ${[0, 1, 2, 3, 4].map((n) => `<option value="${n}">${n === 0 ? 'None (winner only)' : `Up to ${n} (positions 2–${n + 1})`}</option>`).join('')}
                  </select>
                  <p class="mt-1 text-xs text-slate-500">Shown in alphabetical order with no scores, so no one can tell who placed 2nd.</p>
                </div>
                <button onclick="WinnersLeaderboardPage.resetSettings()" class="text-sm font-medium text-blue-600 hover:text-blue-700">Reset to defaults</button>
              </div>
            </div>

            <div class="card">
              <div class="card-header"><h3 class="card-title">Presenter controls</h3></div>
              <div class="card-body">
                <ul class="space-y-2 text-sm text-slate-600">
                  ${[
                    ['→ / Space / Click', 'Next reveal'],
                    ['← / Backspace', 'Go back'],
                    ['Home / End', 'First / last slide'],
                    ['F', 'Toggle full screen'],
                    ['Esc', 'Exit presentation'],
                  ].map(([key, action]) => `<li class="flex justify-between gap-3"><span class="font-mono text-slate-800">${key}</span><span>${action}</span></li>`).join('')}
                </ul>
                <p class="mt-3 text-xs text-slate-500">Presentation clickers (Page Up / Page Down) work too.</p>
              </div>
            </div>
          </div>
        </div>
        <div id="presentationRoot"></div>
      `,
    });
  }

  static afterRender() {
    const P = WinnersLeaderboardPage;
    try {
      P.settings = { ...P.DEFAULTS, ...JSON.parse(localStorage.getItem(P.STORAGE_KEY) || '{}') };
    } catch (e) {
      P.settings = { ...P.DEFAULTS };
    }
    P.showPreview = false;
    document.getElementById('lbTitle').value = P.settings.title;
    document.getElementById('lbSubtitle').value = P.settings.subtitle;
    document.querySelector(`input[name="lbReveal"][value="${P.settings.finalistsFirst ? 'finalists' : 'winner'}"]`).checked = true;
    document.getElementById('lbFinalists').value = String(P.settings.finalists);
    if (!P.keyListenerAttached) {
      document.addEventListener('keydown', P.onKey);
      document.addEventListener('fullscreenchange', P.renderControls);
      P.keyListenerAttached = true;
    }
    P.load();
  }

  static saveSettings() {
    try {
      localStorage.setItem(WinnersLeaderboardPage.STORAGE_KEY, JSON.stringify(WinnersLeaderboardPage.settings));
    } catch (e) {}
  }

  static updateSetting(key, value) {
    WinnersLeaderboardPage.settings[key] = value;
    WinnersLeaderboardPage.saveSettings();
    if (key === 'finalists') WinnersLeaderboardPage.renderOrderList();
  }

  static resetSettings() {
    const P = WinnersLeaderboardPage;
    P.settings = { ...P.DEFAULTS };
    P.saveSettings();
    P.afterRender();
  }

  static async load(manual = false) {
    const P = WinnersLeaderboardPage;
    try {
      const response = await UI.api('/api/winners/leaderboard?finalists=4');
      if (!response.success) throw new Error(response.error || 'Could not load results');
      P.data = response.data;
      if (!document.getElementById('awardOrderList')) return;
      P.renderOrderList();
      document.getElementById('startPresentationBtn').disabled = P.orderedAwards().length === 0;
      if (manual) UI.toast('Results reloaded');
    } catch (error) {
      const list = document.getElementById('awardOrderList');
      if (!list) return;
      list.innerHTML = `
        <div class="flex flex-col items-center gap-3 px-5 py-10 text-center text-sm text-slate-500">
          <p>Could not load results: ${UI.escape(error.message)}</p>
          <button onclick="WinnersLeaderboardPage.load()" class="btn btn-secondary btn-sm">Retry</button>
        </div>`;
    }
  }

  // Awards in the configured order (new / unknown awards appended), with their results
  static allAwardsInOrder() {
    const P = WinnersLeaderboardPage;
    const byAward = new Map(P.data.map((entry) => [entry.id, entry]));
    const order = P.settings.order.filter((award) => byAward.has(award));
    P.data.forEach((entry) => {
      if (!order.includes(entry.id)) order.push(entry.id);
    });
    return order.map((award) => byAward.get(award));
  }

  // Awards that will actually be presented
  static orderedAwards() {
    const P = WinnersLeaderboardPage;
    return P.allAwardsInOrder().filter((entry) => entry.winner && !P.settings.excluded.includes(entry.id));
  }

  static renderOrderList() {
    const P = WinnersLeaderboardPage;
    const list = document.getElementById('awardOrderList');
    if (!list) return;
    const awards = P.allAwardsInOrder();
    let position = 0;
    list.innerHTML = awards
      .map((entry, index) => {
        const hasWinner = !!entry.winner;
        const included = hasWinner && !P.settings.excluded.includes(entry.id);
        if (included) position++;
        const mentions = entry.finalists.slice(0, P.settings.finalists);
        return `
          <div class="award-row flex items-start gap-3 px-5 py-4 ${included ? '' : 'bg-slate-50'}" draggable="true" data-award="${UI.escape(entry.id)}">
            <span class="mt-1 cursor-grab text-slate-400" title="Drag to reorder">${P.svg('grip', 'h-5 w-5')}</span>
            <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${included ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}">${included ? position : '–'}</span>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <p class="font-medium ${included ? 'text-slate-900' : 'text-slate-400'}">${UI.escape(entry.awardType)}</p>
                ${entry.special ? '<span class="badge badge-blue">Special panel</span>' : ''}
                ${hasWinner
                  ? `<span class="badge badge-green">Winner ready</span><span class="badge badge-gray">${mentions.length} honorable mention${mentions.length === 1 ? '' : 's'}</span>`
                  : '<span class="badge badge-yellow">No winner yet — skipped</span>'}
              </div>
              ${P.showPreview && hasWinner ? `
                <div class="mt-2 text-sm">
                  <p class="text-slate-700"><span class="font-semibold text-amber-600">🏆 ${UI.escape(entry.winner.name)}</span> <span class="text-slate-400">· ${UI.escape(entry.winner.challenge)}</span></p>
                  ${mentions.length ? `<p class="mt-1 text-slate-500">Honorable mentions: ${mentions.map((team) => UI.escape(team.name)).join(', ')}</p>` : ''}
                </div>` : ''}
            </div>
            <div class="flex shrink-0 items-center gap-1">
              <button onclick="WinnersLeaderboardPage.move(${index}, -1)" ${index === 0 ? 'disabled' : ''} class="btn btn-ghost btn-sm px-2" title="Move up">${P.svg('up')}</button>
              <button onclick="WinnersLeaderboardPage.move(${index}, 1)" ${index === awards.length - 1 ? 'disabled' : ''} class="btn btn-ghost btn-sm px-2" title="Move down">${P.svg('down')}</button>
              <label class="ml-2 flex items-center gap-1.5 text-xs text-slate-600" title="Include in presentation">
                <input type="checkbox" class="h-4 w-4 accent-blue-600" ${included ? 'checked' : ''} ${hasWinner ? '' : 'disabled'}
                  onchange="WinnersLeaderboardPage.toggleAward(${index}, this.checked)"> Show
              </label>
            </div>
          </div>`;
      })
      .join('');

    let dragIndex = null;
    list.querySelectorAll('.award-row').forEach((row, index) => {
      row.addEventListener('dragstart', (e) => {
        dragIndex = index;
        e.dataTransfer.effectAllowed = 'move';
        row.classList.add('opacity-50');
      });
      row.addEventListener('dragend', () => row.classList.remove('opacity-50'));
      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        row.classList.add('bg-blue-50');
      });
      row.addEventListener('dragleave', () => row.classList.remove('bg-blue-50'));
      row.addEventListener('drop', (e) => {
        e.preventDefault();
        row.classList.remove('bg-blue-50');
        if (dragIndex !== null && dragIndex !== index) P.reorder(dragIndex, index);
      });
    });
  }

  static reorder(from, to) {
    const P = WinnersLeaderboardPage;
    const order = P.allAwardsInOrder().map((entry) => entry.id);
    const [award] = order.splice(from, 1);
    order.splice(to, 0, award);
    P.settings.order = order;
    P.saveSettings();
    P.renderOrderList();
  }

  static move(index, delta) {
    WinnersLeaderboardPage.reorder(index, index + delta);
  }

  static toggleAward(index, included) {
    const P = WinnersLeaderboardPage;
    const award = P.allAwardsInOrder()[index].id;
    P.settings.excluded = included
      ? P.settings.excluded.filter((a) => a !== award)
      : [...P.settings.excluded, award];
    P.saveSettings();
    P.renderOrderList();
    document.getElementById('startPresentationBtn').disabled = P.orderedAwards().length === 0;
  }

  static togglePreview() {
    const P = WinnersLeaderboardPage;
    P.showPreview = !P.showPreview;
    document.getElementById('previewToggle').innerHTML = P.showPreview
      ? `${P.svg('eyeOff')} Hide results`
      : `${P.svg('eye')} Show results`;
    P.renderOrderList();
  }

  static loadConfetti() {
    if (window.confetti) return Promise.resolve();
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = '/vendor/confetti.browser.js';
      script.onload = resolve;
      script.onerror = resolve;
      document.head.appendChild(script);
    });
  }

  static async start() {
    const P = WinnersLeaderboardPage;
    document.documentElement.requestFullscreen?.().catch(() => {});
    await Promise.all([P.load(), P.loadConfetti()]);
    const awards = P.orderedAwards();
    if (awards.length === 0) {
      UI.toast('No awards with a winner to present yet', 'warning');
      return;
    }

    // One slide per award with progressive reveals: 0 = award title, then winner / honorable mentions
    P.steps = [{ slide: 'title', phase: 0 }];
    awards.forEach((entry, awardIndex) => {
      const phases = entry.finalists.slice(0, P.settings.finalists).length ? 2 : 1;
      for (let phase = 0; phase <= phases; phase++) P.steps.push({ slide: `award-${awardIndex}`, award: entry, awardIndex, phase });
    });
    P.steps.push({ slide: 'closing', phase: 0 });
    P.presentedAwards = awards;
    P.stepIndex = 0;
    P.renderedSlide = null;

    document.getElementById('presentationRoot').innerHTML = `
      <div id="presentation" class="fixed inset-0 z-[80] overflow-hidden bg-[#040a1c] text-white select-none" onclick="WinnersLeaderboardPage.onStageClick(event)" onmousemove="WinnersLeaderboardPage.wake()">
        <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.35),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(147,51,234,0.25),transparent_55%)]"></div>
        <div class="stage-stars pointer-events-none"></div>
        <div id="slide" class="relative z-10 flex h-full w-full flex-col items-center justify-center overflow-y-auto px-6 py-16 text-center sm:px-12"></div>
        <div class="absolute inset-x-0 bottom-0 z-20 h-1 bg-white/10"><div id="slideProgress" class="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-amber-400 transition-all duration-500"></div></div>
        <div id="presenterBar" class="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-slate-900/80 px-2 py-1.5 text-sm text-blue-100 shadow-2xl backdrop-blur transition-opacity duration-300"></div>
      </div>`;
    P.renderControls();
    P.go(0);
    P.wake();
  }

  static exit() {
    const P = WinnersLeaderboardPage;
    clearTimeout(P.idleTimer);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    const root = document.getElementById('presentationRoot');
    if (root) root.innerHTML = '';
    P.renderedSlide = null;
  }

  static toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }

  static renderControls() {
    const P = WinnersLeaderboardPage;
    const bar = document.getElementById('presenterBar');
    if (!bar) return;
    const button = (action, icon, title) =>
      `<button data-control onclick="event.stopPropagation(); WinnersLeaderboardPage.${action}" title="${title}" class="rounded-full p-2 hover:bg-white/10">${P.svg(icon)}</button>`;
    bar.innerHTML = `
      ${button('go(WinnersLeaderboardPage.stepIndex - 1)', 'left', 'Previous (←)')}
      <span id="slideCounter" class="min-w-[4.5rem] text-center font-mono text-xs text-blue-200">${P.stepIndex + 1} / ${P.steps.length}</span>
      ${button('go(WinnersLeaderboardPage.stepIndex + 1)', 'right', 'Next (→)')}
      <span class="mx-1 h-5 w-px bg-white/15"></span>
      ${button('toggleFullscreen()', 'expand', document.fullscreenElement ? 'Exit full screen (F)' : 'Full screen (F)')}
      ${button('exit()', 'close', 'Exit presentation (Esc)')}`;
  }

  static onKey(event) {
    const P = WinnersLeaderboardPage;
    if (!document.getElementById('presentation')) return;
    const next = ['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'];
    const prev = ['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'];
    if (next.includes(event.key)) P.go(P.stepIndex + 1);
    else if (prev.includes(event.key)) P.go(P.stepIndex - 1);
    else if (event.key === 'Home') P.go(0);
    else if (event.key === 'End') P.go(P.steps.length - 1);
    else if (event.key === 'f' || event.key === 'F') P.toggleFullscreen();
    else if (event.key === 'Escape') P.exit();
    else return;
    event.preventDefault();
  }

  static onStageClick(event) {
    if (event.target.closest('[data-control]')) return;
    WinnersLeaderboardPage.go(WinnersLeaderboardPage.stepIndex + 1);
  }

  static wake() {
    const P = WinnersLeaderboardPage;
    const stage = document.getElementById('presentation');
    if (!stage) return;
    stage.classList.remove('cursor-none');
    document.getElementById('presenterBar').classList.remove('opacity-0');
    clearTimeout(P.idleTimer);
    P.idleTimer = setTimeout(() => {
      if (!document.getElementById('presentation')) return;
      stage.classList.add('cursor-none');
      document.getElementById('presenterBar').classList.add('opacity-0');
    }, 2500);
  }

  static go(index) {
    const P = WinnersLeaderboardPage;
    if (!document.getElementById('presentation')) return;
    const target = Math.max(0, Math.min(index, P.steps.length - 1));
    const forward = target > P.stepIndex;
    P.stepIndex = target;
    const step = P.steps[target];

    if (P.renderedSlide !== step.slide) {
      document.getElementById('slide').innerHTML = P.slideHtml(step);
      P.renderedSlide = step.slide;
      if (step.slide === 'closing') P.celebrate(true);
    }
    if (step.award) P.applyPhase(step, forward);

    document.getElementById('slideProgress').style.width = `${((target + 1) / P.steps.length) * 100}%`;
    const counter = document.getElementById('slideCounter');
    if (counter) counter.textContent = `${target + 1} / ${P.steps.length}`;
  }

  // Which block (winner / mentions) is revealed at each phase depends on the reveal order setting
  static applyPhase(step, forward) {
    const P = WinnersLeaderboardPage;
    const order = P.settings.finalistsFirst ? ['mentions', 'winner'] : ['winner', 'mentions'];
    order.forEach((block, i) => {
      const element = document.querySelector(`[data-block="${block}"]`);
      if (!element) return;
      const shouldShow = step.phase >= i + 1;
      const isShown = !element.classList.contains('invisible');
      if (shouldShow && !isShown) {
        element.classList.remove('invisible');
        element.querySelectorAll('[data-anim]').forEach((el) => {
          el.classList.remove(el.dataset.anim);
          void el.offsetWidth;
          el.classList.add(el.dataset.anim);
        });
        if (block === 'winner' && forward) P.celebrate(false);
      } else if (!shouldShow && isShown) {
        element.classList.add('invisible');
      }
    });
  }

  static celebrate(big) {
    if (!window.confetti) return;
    const colors = ['#fbbf24', '#f59e0b', '#fde68a', '#60a5fa', '#a78bfa', '#ffffff'];
    const options = { colors, disableForReducedMotion: true, zIndex: 90 };
    window.confetti({ ...options, particleCount: big ? 220 : 160, spread: 100, startVelocity: 45, origin: { y: 0.6 } });
    setTimeout(() => {
      window.confetti({ ...options, particleCount: 80, angle: 60, spread: 70, origin: { x: 0, y: 0.75 } });
      window.confetti({ ...options, particleCount: 80, angle: 120, spread: 70, origin: { x: 1, y: 0.75 } });
    }, 250);
  }

  static slideHtml(step) {
    const P = WinnersLeaderboardPage;
    const { title, subtitle } = P.settings;

    if (step.slide === 'title') {
      return `
        <img src="/assets/nasa%20cairo%20logo.png" alt="" class="anim-pop h-24 w-24 rounded-2xl bg-white object-contain p-2 shadow-2xl sm:h-32 sm:w-32">
        ${subtitle ? `<p class="anim-rise mt-10 text-sm font-medium uppercase tracking-[0.5em] text-blue-200/80 sm:text-base" style="animation-delay:150ms">${UI.escape(subtitle)}</p>` : ''}
        <h1 class="anim-rise mt-4 max-w-6xl text-[clamp(2.5rem,7vw,6.5rem)] font-extrabold leading-[1.05] tracking-tight" style="animation-delay:300ms">${UI.escape(title)}</h1>
        <div class="anim-rise mt-6" style="animation-delay:500ms">
          <span class="text-gold text-[clamp(1.75rem,4.5vw,4rem)] font-bold tracking-wide">Awards Ceremony</span>
        </div>
        <p class="anim-rise mt-16 text-sm text-blue-200/50" style="animation-delay:900ms">Press → or click to begin</p>`;
    }

    if (step.slide === 'closing') {
      return `
        <p class="anim-rise text-sm font-medium uppercase tracking-[0.5em] text-blue-200/80">${UI.escape(title)}</p>
        <h2 class="anim-rise mt-4 text-[clamp(2.25rem,5.5vw,5rem)] font-extrabold leading-tight" style="animation-delay:150ms">Congratulations to all our winners</h2>
        <div class="mt-12 grid w-full max-w-6xl gap-3 text-left sm:grid-cols-2">
          ${P.presentedAwards
            .map(
              (entry, i) => `
            <div class="anim-rise flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur" style="animation-delay:${300 + i * 120}ms">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-xl">🏆</span>
              <div class="min-w-0">
                <p class="truncate text-xs font-medium uppercase tracking-[0.2em] text-amber-300/90">${UI.escape(entry.awardType)}</p>
                <p class="truncate text-lg font-semibold text-white sm:text-xl">${UI.escape(entry.winner.name)}</p>
              </div>
            </div>`,
            )
            .join('')}
        </div>
        <p class="anim-rise mt-12 text-base text-blue-200/70" style="animation-delay:${400 + P.presentedAwards.length * 120}ms">Thank you to every team, judge and volunteer 🚀</p>`;
    }

    const entry = step.award;
    const mentions = entry.finalists.slice(0, P.settings.finalists);
    return `
      <div class="w-full max-w-6xl">
        <p class="anim-rise text-xs font-medium uppercase tracking-[0.5em] text-blue-200/70 sm:text-sm">Award ${step.awardIndex + 1} of ${P.presentedAwards.length}</p>
        <h2 class="anim-rise mt-4 text-[clamp(2.25rem,6vw,5.5rem)] font-extrabold leading-[1.05] tracking-tight text-white" style="animation-delay:150ms">${UI.escape(entry.awardType)}</h2>
        <div class="anim-rise mx-auto mt-6 h-px w-48 bg-gradient-to-r from-transparent via-amber-300 to-transparent" style="animation-delay:300ms"></div>

        <div data-block="winner" class="invisible mt-10 sm:mt-14">
          <p data-anim="anim-rise" class="text-sm font-semibold uppercase tracking-[0.4em] text-amber-300">🏆 Winner</p>
          <div data-anim="anim-pop" class="mt-4" style="animation-delay:150ms">
            <div class="anim-glow">
              <p class="text-gold break-words text-[clamp(2.5rem,7vw,6.5rem)] font-extrabold leading-[1.05]">${UI.escape(entry.winner.name)}</p>
            </div>
          </div>
          <p data-anim="anim-rise" class="mt-4 text-lg text-blue-100/80 sm:text-2xl" style="animation-delay:450ms">${UI.escape(entry.winner.challenge)}</p>
        </div>

        ${mentions.length ? `
        <div data-block="mentions" class="invisible mt-12 sm:mt-16">
          <p data-anim="anim-rise" class="text-sm font-semibold uppercase tracking-[0.35em] text-blue-200/80">Honorable mentions</p>
          <p data-anim="anim-rise" class="mt-1 text-xs text-blue-200/50 sm:text-sm">Listed alphabetically — no ranking order</p>
          <div class="mx-auto mt-6 grid max-w-5xl gap-3 sm:grid-cols-2 ${mentions.length > 2 ? 'lg:grid-cols-4' : ''}">
            ${mentions
              .map(
                (team, i) => `
              <div data-anim="anim-rise" class="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur" style="animation-delay:${200 + i * 180}ms">
                <p class="break-words text-lg font-semibold text-white sm:text-xl">${UI.escape(team.name)}</p>
                <p class="mt-1 text-sm text-blue-200/70">${UI.escape(team.challenge)}</p>
              </div>`,
              )
              .join('')}
          </div>
        </div>` : ''}
      </div>`;
  }
}
