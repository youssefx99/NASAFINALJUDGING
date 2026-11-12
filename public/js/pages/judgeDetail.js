// Judge Detail Page
class JudgeDetailPage {
  static stages = [];

  static render() {
    return Layout.admin({
      title: '<span id="judgeName">Judge details</span>',
      subtitle: '<span id="judgeSubtitle">Loading...</span>',
      actions: `
        <a href="/admin/judges" onclick="navigateToPage(event, '/admin/judges')" class="btn btn-secondary">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
          Back to Judges
        </a>
      `,
      content: `<div id="judgeContent">${JudgeDetailPage.skeletonHtml()}</div>`,
    });
  }

  static afterRender() {
    JudgeDetailPage.stages = [];
    JudgeDetailPage.load(window.location.pathname.split('/').pop());
  }

  static skeletonHtml() {
    return `
      <div class="space-y-6">
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
          ${'<div class="stat-card"><div class="skeleton h-11 w-11"></div><div class="flex-1 space-y-2"><div class="skeleton h-3 w-20"></div><div class="skeleton h-6 w-12"></div></div></div>'.repeat(4)}
        </div>
        <div class="card">
          <div class="card-header"><div class="skeleton h-5 w-48"></div></div>
          <div class="overflow-x-auto"><table class="table"><tbody>${UI.skeletonRows(5, 6)}</tbody></table></div>
        </div>
      </div>
    `;
  }

  static async load(judgeId) {
    const content = document.getElementById('judgeContent');
    if (!content) return;
    content.innerHTML = JudgeDetailPage.skeletonHtml();

    try {
      const id = encodeURIComponent(judgeId);
      const [judge, panels, scores] = await Promise.all([
        UI.api(`/api/users/${id}`),
        UI.api('/api/panels'),
        UI.api(`/api/scores/judge/${id}`),
      ]);
      if (!document.getElementById('judgeContent')) return;

      // Stage 2 scores are per award, special-panel scores per panel
      const scoreKey = (stage, teamId, award, panelId) => `${stage}:${teamId}:${stage === 2 ? award : stage === 3 ? panelId : ''}`;
      const scoreByStageTeam = new Map(scores.map((s) => [scoreKey(s.stage, s.team?._id || s.team, s.awardType, s.panel), s]));
      const myPanels = panels.filter((p) => (p.judges || []).some((j) => j && (j._id || j) === judge._id));

      JudgeDetailPage.stages = [1, 2, 3]
        .map((stage) => {
          const stagePanels = myPanels.filter((p) => Number(p.stage) === stage);
          const rows = stagePanels.flatMap((panel) =>
            (panel.teams || []).filter(Boolean).map((t) => {
              const teamId = t._id || t;
              const score = scoreByStageTeam.get(scoreKey(stage, teamId, panel.awardType, panel._id)) || null;
              return { teamId, teamName: t.name || score?.team?.name || 'Unknown team', challenge: t.challenge || '', panel, score };
            }),
          );
          return { stage, panels: stagePanels, rows, scored: rows.filter((r) => r.score).length };
        })
        .filter((s) => s.panels.length);

      document.getElementById('judgeName').textContent = judge.name;
      document.getElementById('judgeSubtitle').textContent = judge.email || '';
      JudgeDetailPage.renderJudge(judge, scores);
    } catch (error) {
      console.error('Failed to load judge details:', error);
      if (!document.getElementById('judgeContent')) return;
      document.getElementById('judgeName').textContent = 'Judge details';
      document.getElementById('judgeSubtitle').textContent = '';
      content.innerHTML = `
        <div class="card flex flex-col items-center px-6 py-12 text-center">
          <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <p class="text-sm font-medium text-slate-900">Couldn't load this judge</p>
          <p class="mt-1 text-sm text-slate-500">${UI.escape(error.message)}</p>
          <div class="mt-4 flex gap-3">
            <button onclick="JudgeDetailPage.afterRender()" class="btn btn-secondary">Try again</button>
            <a href="/admin/judges" onclick="navigateToPage(event, '/admin/judges')" class="btn btn-primary">Back to Judges</a>
          </div>
        </div>
      `;
    }
  }

  static renderJudge(judge, scores) {
    const stages = JudgeDetailPage.stages;
    const assigned = stages.reduce((sum, s) => sum + s.rows.length, 0);
    const scored = stages.reduce((sum, s) => sum + s.scored, 0);
    const completion = assigned ? Math.round((scored / assigned) * 100) : 0;

    const stats = [
      ['Assigned teams', assigned, 'teams', 'bg-blue-50 text-blue-600'],
      ['Scored', scored, 'criteria', 'bg-emerald-50 text-emerald-600'],
      ['Pending', assigned - scored, 'rocket', 'bg-amber-50 text-amber-600'],
      ['Scores submitted', scores.length, 'trophy', 'bg-purple-50 text-purple-600'],
    ];

    const panelBadges = stages.flatMap((s) =>
      s.panels.map((p) =>
        s.stage === 1
          ? `<span class="badge badge-blue">S1 · ${UI.escape(p.name)}</span>`
          : s.stage === 2
            ? `<span class="badge badge-purple">S2 · ${UI.escape(p.awardType || p.name)}</span>`
            : `<span class="badge badge-green">Special · ${UI.escape(p.name)}</span>`,
      ),
    );

    document.getElementById('judgeContent').innerHTML = `
      <div class="space-y-6">
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
          ${stats
            .map(
              ([label, value, icon, color]) => `
              <div class="stat-card">
                <div class="stat-icon ${color}">${Sidebar.icon(icon)}</div>
                <div class="min-w-0">
                  <p class="stat-label truncate">${label}</p>
                  <p class="stat-value">${value}</p>
                </div>
              </div>`,
            )
            .join('')}
        </div>

        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Judge information</h2>
            <span class="badge badge-gray capitalize">${UI.escape(judge.role || 'judge')}</span>
          </div>
          <div class="card-body grid grid-cols-1 gap-5 md:grid-cols-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</p>
              <p class="mt-1 text-sm font-medium text-slate-900">${UI.escape(judge.name)}</p>
            </div>
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
              <a href="mailto:${UI.escape(judge.email)}" class="mt-1 block truncate text-sm text-blue-600 hover:underline">${UI.escape(judge.email)}</a>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Overall progress</p>
              <div class="mt-2 flex items-center gap-3">
                <div class="progress flex-1"><div class="progress-bar" style="width: ${completion}%"></div></div>
                <span class="text-sm font-medium text-slate-700">${completion}%</span>
              </div>
            </div>
            <div class="md:col-span-3">
              <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Panels</p>
              <div class="flex flex-wrap gap-1">
                ${panelBadges.length ? panelBadges.join('') : '<span class="badge badge-yellow">No panel assignments</span>'}
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Scoring tracking</h2>
            ${stages.length
              ? `<select id="statusFilter" onchange="JudgeDetailPage.renderTracking()" class="input w-auto" aria-label="Filter by status">
                  <option value="">All teams</option>
                  <option value="pending">Pending only</option>
                  <option value="scored">Scored only</option>
                </select>`
              : ''}
          </div>
          <div id="detailedScoring"></div>
        </div>
      </div>
    `;

    JudgeDetailPage.renderTracking();
  }

  static renderTracking() {
    const container = document.getElementById('detailedScoring');
    if (!container) return;
    const stages = JudgeDetailPage.stages;

    if (!stages.length) {
      container.innerHTML = UI.emptyState('No panel assignments', 'Assign this judge to panels from the Judges or Panels page.');
      return;
    }

    const filter = document.getElementById('statusFilter')?.value || '';
    container.innerHTML = stages
      .map(({ stage, panels, rows, scored }) => {
        const visible = rows.filter((r) => !filter || (filter === 'scored') === !!r.score);
        const percent = rows.length ? Math.round((scored / rows.length) * 100) : 0;
        const isStage2 = stage === 2;
        return `
          <section class="border-b border-slate-200 last:border-b-0">
            <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <h3 class="text-sm font-semibold ${isStage2 ? 'text-purple-700' : stage === 3 ? 'text-teal-700' : 'text-blue-700'}">${stage === 3 ? 'Special panel teams' : `Stage ${stage} teams`}</h3>
                <p class="text-xs text-slate-500">${panels.length} panel${panels.length === 1 ? '' : 's'} · ${scored} of ${rows.length} scored</p>
              </div>
              <div class="flex w-full items-center gap-3 sm:w-56">
                <div class="progress flex-1"><div class="progress-bar ${isStage2 ? 'bg-purple-600' : ''}" style="width: ${percent}%"></div></div>
                <span class="text-xs font-medium text-slate-600">${percent}%</span>
              </div>
            </div>
            ${visible.length
              ? `<div class="overflow-x-auto">
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Team</th>
                        <th>Panel</th>
                        ${isStage2 ? '<th>Award</th>' : ''}
                        <th>Status</th>
                        <th>Score</th>
                        <th>Last updated</th>
                      </tr>
                    </thead>
                    <tbody>${visible.map((r) => JudgeDetailPage.rowHtml(r, isStage2)).join('')}</tbody>
                  </table>
                </div>`
              : `<p class="px-5 pb-5 text-sm text-slate-500">No ${filter} teams in this stage.</p>`}
          </section>
        `;
      })
      .join('');
  }

  static rowHtml({ teamId, teamName, challenge, panel, score }, isStage2) {
    const href = `/admin/teams/${teamId}`;
    const date = score ? new Date(score.updatedAt || score.createdAt).toLocaleDateString() : '';
    return `
      <tr>
        <td>
          <div class="min-w-[11rem]">
            <a href="${href}" onclick="navigateToPage(event, '${href}')" class="font-medium text-slate-900 hover:text-blue-600">${UI.escape(teamName)}</a>
            ${challenge ? `<p class="mt-0.5 text-xs text-slate-500">${UI.escape(challenge)}</p>` : ''}
          </div>
        </td>
        <td class="whitespace-nowrap">${UI.escape(panel.name)}</td>
        ${isStage2 ? `<td><span class="badge badge-purple">${UI.escape(panel.awardType || 'N/A')}</span></td>` : ''}
        <td>${score ? '<span class="badge badge-green">Scored</span>' : '<span class="badge badge-yellow">Pending</span>'}</td>
        <td>
          ${score
            ? `<span class="font-semibold ${isStage2 ? 'text-purple-600' : 'text-blue-600'}">${UI.score(score.totalScore || 0)}</span>`
            : '<span class="text-slate-400">—</span>'}
        </td>
        <td class="whitespace-nowrap"><span class="text-slate-500">${date || '—'}</span></td>
      </tr>
    `;
  }
}
