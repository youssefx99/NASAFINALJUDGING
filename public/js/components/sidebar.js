// Sidebar Component for Admin
class Sidebar {
  static icons = {
    dashboard: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    trophy: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
    upload: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
    teams: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    judges: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    panels: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
    criteria: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    rocket: 'M13 10V3L4 14h7v7l9-11h-7z',
    presentation: 'M8 13v-1m4 1v-3m4 3V8M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z',
    logout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  };

  static sections = [
    {
      title: 'Overview',
      items: [
        { path: '/admin', label: 'Dashboard', icon: 'dashboard' },
        { path: '/winners', label: 'Winners', icon: 'trophy' },
        { path: '/winners/leaderboard', label: 'Winners Leaderboard', icon: 'presentation' },
      ],
    },
    {
      title: 'Data',
      items: [
        { path: '/admin/upload-data-stream', label: 'Import Teams', icon: 'upload' },
        { path: '/admin/teams', label: 'Teams', icon: 'teams', match: '/admin/teams/' },
        { path: '/admin/judges', label: 'Judges', icon: 'judges', match: '/admin/judges/' },
      ],
    },
    {
      title: 'Judging',
      items: [
        { path: '/admin/panels', label: 'Panels', icon: 'panels' },
        { path: '/admin/stage1', label: 'Stage 1 Criteria', icon: 'criteria' },
        { path: '/admin/stage2', label: 'Stage 2 Criteria', icon: 'criteria' },
        { path: '/admin/stage2-qualify', label: 'Stage 2 Qualification', icon: 'rocket' },
      ],
    },
  ];

  static icon(name, classes = 'h-5 w-5') {
    return `<svg class="${classes}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${Sidebar.icons[name]}"></path></svg>`;
  }

  static render() {
    const currentPath = window.location.pathname;
    const user = authService.getUser();

    return `
      <div id="sidebarOverlay" onclick="Sidebar.toggle(false)" class="fixed inset-0 z-30 hidden bg-slate-900/50 lg:hidden"></div>
      <aside id="sidebar" class="fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col bg-slate-900 text-slate-300 transition-transform duration-200 lg:translate-x-0">
        <div class="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <img src="/assets/nasa%20cairo%20logo.png" alt="" class="h-9 w-9 rounded-md bg-white object-contain p-0.5">
          <div>
            <p class="text-sm font-semibold text-white leading-tight">NASA Space Apps</p>
            <p class="text-xs text-slate-400">Judging Admin</p>
          </div>
        </div>

        <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          ${Sidebar.sections
            .map(
              (section) => `
            <div>
              <p class="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">${section.title}</p>
              <div class="space-y-1">
                ${section.items
                  .map((item) => {
                    const active =
                      currentPath === item.path || (item.match && currentPath.startsWith(item.match));
                    return `
                  <a href="${item.path}" onclick="navigateToPage(event, '${item.path}')"
                     class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active ? 'bg-blue-600 text-white' : 'hover:bg-white/5 hover:text-white'}">
                    ${Sidebar.icon(item.icon)}
                    ${item.label}
                  </a>`;
                  })
                  .join('')}
              </div>
            </div>`,
            )
            .join('')}
        </nav>

        <div class="border-t border-white/10 p-4">
          <div class="flex items-center gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">${UI.escape((user?.name || 'A').charAt(0).toUpperCase())}</div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-white">${UI.escape(user?.name || 'Admin')}</p>
              <p class="truncate text-xs text-slate-400">${UI.escape(user?.email || '')}</p>
            </div>
            <button onclick="handleLogout()" title="Logout" class="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white">
              ${Sidebar.icon('logout')}
            </button>
          </div>
        </div>
      </aside>
    `;
  }

  static toggle(open) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (!sidebar) return;
    const show = open ?? sidebar.classList.contains('-translate-x-full');
    sidebar.classList.toggle('-translate-x-full', !show);
    overlay.classList.toggle('hidden', !show);
  }
}

// Admin page shell: sidebar + sticky header + content
class Layout {
  static admin({ title, subtitle = '', actions = '', content = '' }) {
    return `
      <div class="min-h-screen bg-slate-50">
        ${Sidebar.render()}
        <div class="lg:pl-64">
          <header class="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div class="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-6">
              <button onclick="Sidebar.toggle()" class="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </button>
              <div class="min-w-0 flex-1">
                <h1 class="truncate text-xl font-semibold text-slate-900">${title}</h1>
                ${subtitle ? `<p class="mt-0.5 text-sm text-slate-500">${subtitle}</p>` : ''}
              </div>
              ${actions ? `<div class="flex flex-wrap items-center gap-2">${actions}</div>` : ''}
            </div>
          </header>
          <main class="px-4 py-6 sm:px-6">
            ${content}
          </main>
        </div>
      </div>
    `;
  }
}

// Global navigation handler
function navigateToPage(event, path) {
  event.preventDefault();
  Sidebar.toggle(false);
  router.navigate(path);
}
