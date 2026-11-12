// Shared UI helpers used by every page
const UI = {
  // fetch wrapper: adds auth header + JSON handling, throws Error(message) on failure
  async api(path, { method = 'GET', body } = {}) {
    const headers = { Authorization: `Bearer ${authService.token}` };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const response = await fetch(path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      data = text;
    }
    if (response.status === 401 && authService.isAuthenticated()) {
      authService.logout();
      router.navigate('/login');
      UI.toast('Your session has expired. Please sign in again.', 'warning');
    }
    if (!response.ok) {
      const message =
        (data && (data.message || data.error)) || `Request failed (${response.status})`;
      throw new Error(Array.isArray(message) ? message.join(', ') : message);
    }
    return data;
  },

  // SheetJS (Excel read/write) is loaded on first use
  loadSheetJs() {
    if (window.XLSX) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/vendor/xlsx.full.min.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Could not load the spreadsheet library'));
      document.head.appendChild(script);
    });
  },

  // A team's project links as raised buttons with an icon (judge scoring pages)
  teamLinkButtons(team) {
    const icon = (d) =>
      `<svg class="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${d}"></path></svg>`;
    const links = [
      ['demoLink', 'Demo', 'bg-gradient-to-br from-rose-500 to-red-600 text-white', icon('M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z')],
      ['proposalLink', 'Proposal', 'bg-gradient-to-br from-amber-400 to-orange-500 text-white', icon('M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z')],
      ['projectLink', 'Project', 'bg-gradient-to-br from-slate-700 to-slate-900 text-white', icon('M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4')],
      ['nasaSubmitLink', 'NASA page', 'bg-white ring-1 ring-slate-200', '<img src="/assets/nasa%20cairo%20logo.png" alt="" class="h-6 w-6 object-contain">'],
    ];
    return links
      .map(([key, label, tone, logo]) => {
        const url = String(team[key] || '').trim();
        if (!url) {
          return `
            <span class="inline-flex items-center gap-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 py-2 pl-2 pr-3 text-xs text-slate-400 sm:text-sm">
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg opacity-40 grayscale ${tone}">${logo}</span>
              <span class="whitespace-nowrap">No ${label}</span>
            </span>`;
        }
        const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
        return `
          <a href="${UI.escape(href)}" target="_blank" rel="noopener noreferrer"
            class="group inline-flex select-none items-center gap-2.5 rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-100 py-2 pl-2 pr-3.5 text-sm font-semibold text-slate-800 shadow-[0_4px_0_0_#cbd5e1,0_8px_14px_-6px_rgba(15,23,42,0.25)] transition-all duration-100 hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_#cbd5e1,0_12px_18px_-6px_rgba(15,23,42,0.3)] active:translate-y-1 active:shadow-[0_0_0_0_#cbd5e1,0_2px_4px_-2px_rgba(15,23,42,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-[inset_0_-2px_0_rgba(0,0,0,0.15)] ${tone}">${logo}</span>
            <span class="flex-1 whitespace-nowrap">${label}</span>
            <svg class="hidden h-3.5 w-3.5 shrink-0 text-slate-400 sm:block transition-colors group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
          </a>`;
      })
      .join('');
  },

  // Same as the server (src/common/scoring.ts): a criterion from 0 to 1. A "yes" counts 1 and a scale answer v counts v / scaleMax;
  // when a criterion mixes both types, its yes/no questions carry yesNoWeight of it. Unanswered questions count 0.
  criterionFraction(answers, types, scaleMax = 5, yesNoWeight = 0.5) {
    let yes = 0;
    let yesNoCount = 0;
    let scaleSum = 0;
    let scaleCount = 0;
    answers.forEach((value, i) => {
      if (types[i] === 'scale') {
        scaleSum += value || 0;
        scaleCount++;
      } else {
        yes += value || 0;
        yesNoCount++;
      }
    });
    if (!scaleCount) return yesNoCount ? yes / yesNoCount : 0;
    if (!yesNoCount) return scaleSum / (scaleCount * scaleMax);
    return yesNoWeight * (yes / yesNoCount) + (1 - yesNoWeight) * (scaleSum / (scaleCount * scaleMax));
  },

  // e.g. "2 Yes/No · 3 Scale 1–5 · Yes/No 40% / Scale 60%"
  questionMixLabel({ types, scaleMax = 5, yesNoWeight = 0.5 }) {
    const yesNo = types.filter((t) => t !== 'scale').length;
    const scale = types.length - yesNo;
    const pct = Math.round(yesNoWeight * 1000) / 10;
    return [
      yesNo ? `${yesNo} Yes/No` : '',
      scale ? `${scale} Scale 1–${scaleMax}` : '',
      yesNo && scale ? `Yes/No ${pct}% / Scale ${Math.round((100 - pct) * 10) / 10}%` : '',
    ]
      .filter(Boolean)
      .join(' · ');
  },

  // Criteria editors (Stage 1, Stage 2, special panels): `call` is the page handler start, e.g. "Page.setScoring(2, 0",
  // completed here with ", field, value)"
  questionTypeSelect(type, call) {
    return `<select onchange="${call}, 'type', this.value)" aria-label="Question type"
      class="w-28 shrink-0 rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none">
      <option value="yesno" ${type !== 'scale' ? 'selected' : ''}>Yes / No</option>
      <option value="scale" ${type === 'scale' ? 'selected' : ''}>Scale</option>
    </select>`;
  },

  // Scale range and the yes/no vs scale split of one criterion (shown only when it has scale questions)
  scoringSetup({ types, scaleMax = 5, yesNoWeight = 0.5 }, call) {
    if (!types.includes('scale')) return '';
    const pct = Math.round(yesNoWeight * 1000) / 10;
    const input = 'w-20 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm tabular-nums focus:border-blue-500 focus:outline-none';
    return `
      <div data-mix class="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        <label class="flex items-center gap-2">Scale questions are rated 1 to
          <select data-scale-max onchange="${call}, 'scaleMax', Number(this.value))" class="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none">
            ${[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `<option value="${n}" ${n === scaleMax ? 'selected' : ''}>${n}</option>`).join('')}
          </select>
        </label>
        ${
          types.some((t) => t !== 'scale')
            ? `<div class="flex flex-wrap items-center gap-2">
                <span>Yes/No questions</span>
                <input data-mix-yesno type="number" min="0" max="100" step="any" value="${pct}" oninput="${call}, 'yesNoWeight', UI.mixInput(this))" class="${input}"><span>%</span>
                <span class="ml-2">Scale questions</span>
                <input data-mix-scale type="number" min="0" max="100" step="any" value="${Math.round((100 - pct) * 10) / 10}" oninput="${call}, 'yesNoWeight', UI.mixInput(this))" class="${input}"><span>%</span>
              </div>`
            : ''
        }
      </div>`;
  },

  // Keeps the two shares adding up to 100% and returns the yes/no share as a fraction in 0.1% steps
  mixInput(input) {
    const box = input.closest('[data-mix]');
    const isYesNo = input.hasAttribute('data-mix-yesno');
    const value = Math.min(100, Math.max(0, Number(input.value) || 0));
    const yesNo = Math.round((isYesNo ? value : 100 - value) * 10) / 10;
    box.querySelector(isYesNo ? '[data-mix-scale]' : '[data-mix-yesno]').value = isYesNo ? Math.round((100 - yesNo) * 10) / 10 : yesNo;
    return Math.round(yesNo * 10) / 1000;
  },

  escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  debounce(fn, ms = 200) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  },

  toast(message, type = 'success', timeout = 3500) {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className =
        'fixed top-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2';
      document.body.appendChild(container);
    }
    const styles = {
      success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      error: 'border-red-200 bg-red-50 text-red-800',
      info: 'border-blue-200 bg-blue-50 text-blue-800',
      warning: 'border-amber-200 bg-amber-50 text-amber-800',
    };
    const icons = { success: '✓', error: '✕', info: 'i', warning: '!' };
    const toast = document.createElement('div');
    toast.setAttribute('role', 'status');
    toast.className = `flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg transition-all duration-300 ${styles[type] || styles.info}`;
    toast.innerHTML = `
      <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/70 text-xs font-bold">${icons[type] || icons.info}</span>
      <span class="flex-1 whitespace-pre-line">${UI.escape(message)}</span>
      <button class="text-current opacity-60 hover:opacity-100" aria-label="Dismiss">&times;</button>
    `;
    const remove = () => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    };
    toast.querySelector('button').addEventListener('click', remove);
    container.appendChild(toast);
    if (timeout) setTimeout(remove, timeout);
  },

  // Promise-based confirmation dialog (resolves true/false)
  confirm({ title = 'Are you sure?', message = '', confirmText = 'Confirm', cancelText = 'Cancel', danger = false } = {}) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4';
      overlay.innerHTML = `
        <div class="card w-full max-w-md p-6" role="dialog" aria-modal="true">
          <h3 class="text-lg font-semibold text-slate-900">${UI.escape(title)}</h3>
          ${message ? `<p class="mt-2 text-sm text-slate-600 whitespace-pre-line">${UI.escape(message)}</p>` : ''}
          <div class="mt-6 flex justify-end gap-3">
            <button data-action="cancel" class="btn btn-secondary">${UI.escape(cancelText)}</button>
            <button data-action="confirm" class="btn ${danger ? 'btn-danger' : 'btn-primary'}">${UI.escape(confirmText)}</button>
          </div>
        </div>
      `;
      const close = (result) => {
        overlay.remove();
        document.removeEventListener('keydown', onKey);
        resolve(result);
      };
      const onKey = (e) => {
        if (e.key === 'Escape') close(false);
      };
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close(false);
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (action) close(action === 'confirm');
      });
      document.addEventListener('keydown', onKey);
      document.body.appendChild(overlay);
      overlay.querySelector('[data-action="confirm"]').focus();
    });
  },

  spinner(text = 'Loading...') {
    return `
      <div class="flex items-center justify-center gap-3 py-10 text-sm text-slate-500">
        <svg class="h-5 w-5 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        ${UI.escape(text)}
      </div>
    `;
  },

  skeletonRows(columns, rows = 5) {
    return Array.from(
      { length: rows },
      () => `<tr>${Array.from({ length: columns }, () => '<td class="px-4 py-3"><div class="skeleton h-4 w-3/4"></div></td>').join('')}</tr>`,
    ).join('');
  },

  emptyState(title, subtitle = '') {
    return `
      <div class="flex flex-col items-center justify-center px-6 py-12 text-center">
        <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
        </div>
        <p class="text-sm font-medium text-slate-900">${UI.escape(title)}</p>
        ${subtitle ? `<p class="mt-1 text-sm text-slate-500">${UI.escape(subtitle)}</p>` : ''}
      </div>
    `;
  },

  // Pagination controls. onChange is the name of a global function/method called with the new page number.
  pagination({ page, perPage, total, onChange }) {
    page = Number(page) || 1;
    perPage = Number(perPage) || 1;
    total = Number(total) || 0;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    if (total === 0) return '';
    const from = (page - 1) * perPage + 1;
    const to = Math.min(page * perPage, total);
    const pages = [];
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
      else if (pages[pages.length - 1] !== '…') pages.push('…');
    }
    const button = (label, target, disabled, active) => `
      <button ${disabled ? 'disabled' : ''} onclick="${onChange}(${target})"
        class="min-w-[2.25rem] rounded-md border px-2.5 py-1.5 text-sm font-medium ${active ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'} disabled:cursor-not-allowed disabled:opacity-50">${label}</button>`;
    return `
      <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-slate-200">
        <p class="text-sm text-slate-500">Showing <span class="font-medium text-slate-700">${from}</span>–<span class="font-medium text-slate-700">${to}</span> of <span class="font-medium text-slate-700">${total}</span></p>
        ${totalPages > 1 ? `<div class="flex flex-wrap gap-1">
          ${button('‹', page - 1, page === 1)}
          ${pages.map((p) => (p === '…' ? '<span class="px-2 py-1.5 text-slate-400">…</span>' : button(p, p, false, p === page))).join('')}
          ${button('›', page + 1, page === totalPages)}
        </div>` : ''}
      </div>
    `;
  },
};
