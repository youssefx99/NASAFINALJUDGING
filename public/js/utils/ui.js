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
