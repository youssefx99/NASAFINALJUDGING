// Dashboard Page (for Judges)
class DashboardPage {
    static itemsPerPage = 10;
    static state = {
        stage1: { page: 1, filter: 'all', search: '' },
        stage2: { page: 1, filter: 'all', search: '' },
    };

    // Sections: stage1, one per Stage 2 award panel ("s2<panelId>"), one per special panel ("sp<panelId>")
    static sectionHtml(key, title, accent) {
        return `
            <div class="card">
                <div class="card-header">
                    <div class="min-w-0">
                        <h3 class="card-title">${title}</h3>
                        <p id="${key}Subtitle" class="mt-0.5 text-sm text-slate-500"></p>
                    </div>
                    <span id="${key}Progress" class="text-sm font-semibold text-slate-700"></span>
                </div>
                <div class="px-5 pt-4">
                    <div class="progress"><div id="${key}ProgressBar" class="progress-bar ${accent}" style="width: 0%"></div></div>
                </div>
                <div class="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                    <input id="${key}Search" type="search" placeholder="Search teams or challenges…" class="input sm:max-w-xs"
                        oninput="DashboardPage.onSearch('${key}', this.value)">
                    <div class="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-sm">
                        ${['all', 'pending', 'scored'].map((filter) => `
                            <button data-filter="${filter}" onclick="DashboardPage.setFilter('${key}', '${filter}')"
                                class="${key}-filter rounded-md px-3 py-1.5 font-medium capitalize ${filter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}">${filter}</button>`).join('')}
                    </div>
                </div>
                <div id="${key}List" class="divide-y divide-slate-100 border-t border-slate-100">
                    ${Array.from({ length: 4 }, () => '<div class="px-5 py-4"><div class="skeleton h-4 w-1/2"></div><div class="skeleton mt-2 h-3 w-1/3"></div></div>').join('')}
                </div>
                <div id="${key}Pagination"></div>
            </div>`;
    }

    static render() {
        return `
            <div class="min-h-screen bg-slate-50 pb-10">
                ${Navbar.render('Judge Dashboard')}
                <div class="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div id="continueBanner" class="hidden"></div>
                    ${DashboardPage.sectionHtml('stage1', 'Stage 1 · Assigned Teams', 'bg-blue-600')}
                    <div id="stage2Sections" class="space-y-6">${DashboardPage.sectionHtml('stage2', 'Stage 2 · Assigned Teams', 'bg-purple-600')}</div>
                    <div id="specialSections" class="space-y-6"></div>
                </div>
            </div>
        `;
    }

    static afterRender() {
        DashboardPage.state = {
            stage1: { page: 1, filter: 'all', search: '' },
            stage2: { page: 1, filter: 'all', search: '' },
        };
        DashboardPage.loadAssignedTeams();
    }

    static async loadAssignedTeams() {
        try {
            const data = await UI.api('/api/judges/assigned-teams');
            DashboardPage.teams = { stage1: data.stage1Teams || [] };
            DashboardPage.scored = { stage1: new Set(data.stage1ScoredTeamIds || []) };
            DashboardPage.panels = {};
            const addPanelSection = (prefix, stage, panel, title, accent) => {
                const key = `${prefix}${panel._id}`;
                DashboardPage.panels[key] = { ...panel, stage };
                DashboardPage.teams[key] = panel.teams || [];
                DashboardPage.scored[key] = new Set(panel.scoredTeamIds || []);
                DashboardPage.state[key] = { page: 1, filter: 'all', search: '' };
                return DashboardPage.sectionHtml(key, title, accent);
            };
            const stage2Panels = data.stage2Panels || [];
            if (stage2Panels.length) {
                document.getElementById('stage2Sections').innerHTML = stage2Panels
                    .map((panel) => addPanelSection('s2', 2, panel, `Stage 2 · ${UI.escape(panel.awardType || panel.name)}`, 'bg-purple-600'))
                    .join('');
            } else {
                DashboardPage.teams.stage2 = [];
                DashboardPage.scored.stage2 = new Set();
            }
            document.getElementById('specialSections').innerHTML = (data.specialPanels || [])
                .map((panel) => addPanelSection('sp', 3, panel, `Special panel · ${UI.escape(panel.name)}`, 'bg-teal-600'))
                .join('');
            DashboardPage.renderContinueBanner();
            Object.keys(DashboardPage.teams).forEach((key) => DashboardPage.renderStage(key));
        } catch (error) {
            console.error('Failed to load assigned teams:', error);
            DashboardPage.renderErrorState(error);
        }
    }

    static renderContinueBanner() {
        const banner = document.getElementById('continueBanner');
        const next = Object.keys(DashboardPage.teams)
            .map((key) => ({ key, team: DashboardPage.teams[key].find((t) => !DashboardPage.scored[key].has(t._id)) }))
            .find((entry) => entry.team);
        const total = Object.values(DashboardPage.teams).reduce((sum, teams) => sum + teams.length, 0);
        if (total === 0) {
            banner.classList.add('hidden');
            return;
        }
        banner.classList.remove('hidden');
        banner.innerHTML = next
            ? `
            <div class="card flex flex-col gap-4 bg-gradient-to-r from-slate-900 to-blue-900 p-5 text-white sm:flex-row sm:items-center">
                <div class="min-w-0 flex-1">
                    <p class="text-sm text-blue-200">Next team to score · ${DashboardPage.sectionLabel(next.key)}</p>
                    <p class="truncate text-lg font-semibold">${UI.escape(next.team.name)}</p>
                    <p class="truncate text-sm text-blue-100">${UI.escape(next.team.challenge)}</p>
                </div>
                <button onclick="router.navigate('${DashboardPage.teamLink(next.key, next.team._id)}')" class="btn bg-white text-slate-900 hover:bg-blue-50">Continue scoring →</button>
            </div>`
            : `
            <div class="card flex items-center gap-4 border-emerald-200 bg-emerald-50 p-5">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white">✓</div>
                <div>
                    <p class="font-semibold text-emerald-900">All assigned teams are scored</p>
                    <p class="text-sm text-emerald-700">You can still open any team below to review or update your score.</p>
                </div>
            </div>`;
    }

    static sectionLabel(key) {
        const panel = DashboardPage.panels?.[key];
        if (!panel) return 'Stage 1';
        return panel.stage === 2 ? `Stage 2 · ${UI.escape(panel.awardType || panel.name)}` : UI.escape(panel.name);
    }

    static teamLink(key, teamId) {
        const panel = DashboardPage.panels?.[key];
        if (!panel) return `/stage1/${teamId}`;
        return panel.stage === 2 ? `/stage2/${panel._id}/${teamId}` : `/special/${panel._id}/${teamId}`;
    }

    static renderStage(key) {
        if (!DashboardPage.teams) return;
        const teams = DashboardPage.teams[key];
        const scored = DashboardPage.scored[key];
        const state = DashboardPage.state[key];
        const stage = key === 'stage1' ? 1 : key === 'stage2' ? 2 : DashboardPage.panels[key].stage;

        const scoredCount = teams.filter((team) => scored.has(team._id)).length;
        const percent = teams.length ? Math.round((scoredCount / teams.length) * 100) : 0;
        document.getElementById(`${key}Progress`).textContent = `${scoredCount} / ${teams.length} scored`;
        document.getElementById(`${key}ProgressBar`).style.width = `${percent}%`;
        document.getElementById(`${key}Subtitle`).innerHTML =
            stage === 2 && DashboardPage.panels[key]
                ? `Award category: <span class="font-medium text-purple-700">${UI.escape(DashboardPage.panels[key].awardType || DashboardPage.panels[key].name)}</span> · ${teams.length - scoredCount} remaining`
                : `${teams.length - scoredCount} remaining${stage === 3 ? ' · answer every question' : ''}`;

        const list = document.getElementById(`${key}List`);
        if (teams.length === 0) {
            list.innerHTML = UI.emptyState(
                'No teams assigned yet',
                stage === 2 ? 'Qualified teams from Stage 1 will appear here once the admin runs qualification' : 'Teams will appear here once assigned by the admin',
            );
            document.getElementById(`${key}Pagination`).innerHTML = '';
            return;
        }

        const search = state.search.toLowerCase();
        const filtered = teams.filter((team) => {
            const isScored = scored.has(team._id);
            if (state.filter === 'pending' && isScored) return false;
            if (state.filter === 'scored' && !isScored) return false;
            return !search || team.name.toLowerCase().includes(search) || (team.challenge || '').toLowerCase().includes(search);
        });
        const totalPages = Math.max(1, Math.ceil(filtered.length / DashboardPage.itemsPerPage));
        state.page = Math.min(state.page, totalPages);
        const pageTeams = filtered.slice((state.page - 1) * DashboardPage.itemsPerPage, state.page * DashboardPage.itemsPerPage);

        const solutionBadge = { web: 'badge-blue', mobile: 'badge-green', ai: 'badge-purple' };
        list.innerHTML = pageTeams.length
            ? pageTeams.map((team) => {
                const isScored = scored.has(team._id);
                return `
                <button onclick="router.navigate('${DashboardPage.teamLink(key, team._id)}')" class="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50">
                    <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isScored ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">${isScored ? '✓' : '•'}</span>
                    <span class="min-w-0 flex-1">
                        <span class="block truncate font-medium text-slate-900">${UI.escape(team.name)}</span>
                        <span class="block truncate text-sm text-slate-500">${UI.escape(team.challenge)}${team.subjects?.length ? ` · ${UI.escape(team.subjects.join(', '))}` : ''}</span>
                    </span>
                    ${stage === 2 && team.actualSolution ? `<span class="badge ${solutionBadge[team.actualSolution] || 'badge-gray'} hidden sm:inline-flex">${UI.escape(team.actualSolution)}</span>` : ''}
                    <span class="badge ${isScored ? 'badge-green' : 'badge-yellow'}">${isScored ? 'Scored' : 'Pending'}</span>
                    <svg class="h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                </button>`;
            }).join('')
            : UI.emptyState('No teams match', 'Try a different search or filter');

        document.getElementById(`${key}Pagination`).innerHTML = UI.pagination({
            page: state.page,
            perPage: DashboardPage.itemsPerPage,
            total: filtered.length,
            onChange: `DashboardPage.goToPage.bind(null, '${key}')`,
        });
    }

    static goToPage(key, page) {
        DashboardPage.state[key].page = page;
        DashboardPage.renderStage(key);
    }

    static onSearch = UI.debounce((key, value) => {
        DashboardPage.state[key].search = value;
        DashboardPage.state[key].page = 1;
        DashboardPage.renderStage(key);
    }, 150);

    static setFilter(key, filter) {
        DashboardPage.state[key].filter = filter;
        DashboardPage.state[key].page = 1;
        document.querySelectorAll(`.${key}-filter`).forEach((button) => {
            const active = button.dataset.filter === filter;
            button.classList.toggle('bg-slate-900', active);
            button.classList.toggle('text-white', active);
            button.classList.toggle('text-slate-600', !active);
            button.classList.toggle('hover:bg-slate-100', !active);
        });
        DashboardPage.renderStage(key);
    }

    static renderErrorState(error) {
        for (const key of ['stage1', 'stage2']) {
            const list = document.getElementById(`${key}List`);
            if (list) {
                list.innerHTML = `
                    <div class="flex flex-col items-center gap-3 px-5 py-10 text-center text-sm text-slate-500">
                        <p>Unable to load your teams${error?.message ? `: ${UI.escape(error.message)}` : ''}</p>
                        <button onclick="DashboardPage.loadAssignedTeams()" class="btn btn-secondary btn-sm">Retry</button>
                    </div>`;
            }
        }
    }
}
