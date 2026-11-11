// Team Detail Page
class TeamDetailPage {
  static render() {
    return Layout.admin({
      title: '<span id="teamName">Team details</span>',
      subtitle: '<span id="teamSubtitle">Loading...</span>',
      actions: `
        <a href="/admin/teams" onclick="navigateToPage(event, '/admin/teams')" class="btn btn-secondary">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
          Back to Teams
        </a>
      `,
      content: `<div id="teamContent">${TeamDetailPage.skeletonHtml()}</div>`,
    });
  }

  static afterRender() {
    const teamId = window.location.pathname.split('/').pop();
    TeamDetailPage.load(teamId);
  }

  static skeletonHtml() {
    const block = (lines) => `
      <div class="card card-body space-y-3">
        <div class="skeleton h-5 w-1/3"></div>
        ${'<div class="skeleton h-4 w-full"></div>'.repeat(lines)}
      </div>`;
    return `
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="space-y-6 lg:col-span-2">${block(4)}${block(2)}</div>
        <div class="space-y-6">${block(3)}${block(3)}</div>
      </div>
    `;
  }

  static async load(teamId) {
    const content = document.getElementById('teamContent');
    if (!content) return;
    content.innerHTML = TeamDetailPage.skeletonHtml();

    const optional = (path) =>
      UI.api(path).catch((error) => {
        console.error(`Failed to load ${path}:`, error);
        return null;
      });

    try {
      const id = encodeURIComponent(teamId);
      const [team, panels, stage1Scores, stage2Scores, weights] = await Promise.all([
        UI.api(`/api/teams/${id}`),
        optional('/api/panels'),
        optional(`/api/scores/team/${id}/stage/1`),
        optional(`/api/scores/team/${id}/stage/2`),
        optional('/api/stages/final-weights'),
      ]);
      if (!document.getElementById('teamContent')) return;

      document.getElementById('teamName').textContent = team.name;
      document.getElementById('teamSubtitle').textContent = team.challenge || '';
      TeamDetailPage.renderTeam(team, panels, stage1Scores, stage2Scores, weights);
    } catch (error) {
      console.error('Failed to load team details:', error);
      if (!document.getElementById('teamContent')) return;
      document.getElementById('teamName').textContent = 'Team details';
      document.getElementById('teamSubtitle').textContent = '';
      content.innerHTML = `
        <div class="card flex flex-col items-center px-6 py-12 text-center">
          <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <p class="text-sm font-medium text-slate-900">Couldn't load this team</p>
          <p class="mt-1 text-sm text-slate-500">${UI.escape(error.message)}</p>
          <div class="mt-4 flex gap-3">
            <button onclick="TeamDetailPage.afterRender()" class="btn btn-secondary">Try again</button>
            <a href="/admin/teams" onclick="navigateToPage(event, '/admin/teams')" class="btn btn-primary">Back to Teams</a>
          </div>
        </div>
      `;
    }
  }

  static renderTeam(team, panels, stage1Scores, stage2Scores, weights) {
    const teamId = team._id;
    const hasTeam = (panel) => (panel.teams || []).some((t) => t && (t._id || t) === teamId);
    const stage1Panel = panels?.find((p) => Number(p.stage) === 1 && hasTeam(p)) || null;
    const stage2Panels = panels ? panels.filter((p) => Number(p.stage) === 2 && hasTeam(p)) : [];

    const judgeAward = new Map();
    for (const panel of panels || []) {
      if (Number(panel.stage) !== 2) continue;
      for (const j of panel.judges || []) if (j) judgeAward.set(j._id || j, panel.awardType || 'Unknown Award');
    }

    const average = (values) => (values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0);

    const stage1Score = average((stage1Scores || []).map((s) => s.totalScore || 0));

    const awardGroups = new Map();
    for (const score of stage2Scores || []) {
      const award = score.awardType || judgeAward.get(score.judge?._id || score.judge) || 'Unknown Award';
      if (!awardGroups.has(award)) awardGroups.set(award, []);
      awardGroups.get(award).push(score);
    }
    const awardAverages = [...awardGroups].map(([award, scores]) => ({
      award,
      scores,
      avg: average(scores.map((s) => s.totalScore || 0)),
    }));
    const stage2Score = awardAverages.reduce((max, a) => Math.max(max, a.avg), 0);

    const scoresLoaded = stage1Scores && stage2Scores && weights;
    const totalScore = scoresLoaded ? weights.stage1 * stage1Score + weights.stage2 * stage2Score : 0;
    const percent = (weight) => Math.round(weight * 1000) / 10;

    document.getElementById('teamContent').innerHTML = `
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="space-y-6 lg:col-span-2">
          ${TeamDetailPage.infoCard(team)}
          ${TeamDetailPage.linksCard(team)}
        </div>

        <div class="space-y-6">
          <div class="rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 p-6 text-white shadow-sm">
            <p class="text-sm font-medium text-white/80">Total combined score</p>
            <p class="mt-1 text-4xl font-semibold">${scoresLoaded ? totalScore.toFixed(2) : '—'}</p>
            <p class="mt-2 text-xs text-white/70">${weights ? `${percent(weights.stage1)}% Stage 1 + ${percent(weights.stage2)}% Stage 2` : 'Weighted Stage 1 + Stage 2'}</p>
          </div>

          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Stage 1</h2>
              ${stage1Panel
                ? `<span class="badge badge-blue">${UI.escape(stage1Panel.name)}</span>`
                : `<span class="badge badge-gray">${panels ? 'Not assigned' : 'Unknown'}</span>`}
            </div>
            <div class="card-body space-y-4">
              <div>
                <p class="text-sm text-slate-500">Average score</p>
                <p class="text-3xl font-semibold text-blue-600">${stage1Scores ? stage1Score.toFixed(2) : '—'}</p>
                ${stage1Scores
                  ? `<p class="mt-1 text-xs text-slate-500">${stage1Scores.length}${stage1Panel ? ` of ${(stage1Panel.judges || []).length}` : ''} judges scored</p>`
                  : ''}
              </div>
              <div class="border-t border-slate-100 pt-4">
                <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Judge scores</p>
                ${!stage1Scores
                  ? '<p class="text-sm text-red-600">Couldn\'t load Stage 1 scores.</p>'
                  : stage1Scores.length
                    ? `<div class="space-y-1.5">${stage1Scores.map((s) => TeamDetailPage.judgeScoreRow(s, 'text-blue-600')).join('')}</div>`
                    : '<p class="text-sm text-slate-400">No scores yet</p>'}
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Stage 2</h2>
              ${stage2Panels.length
                ? `<span class="badge badge-purple">${stage2Panels.length} award panel${stage2Panels.length === 1 ? '' : 's'}</span>`
                : `<span class="badge badge-gray">${panels ? 'Not assigned' : 'Unknown'}</span>`}
            </div>
            <div class="card-body space-y-4">
              ${stage2Panels.length
                ? `<div class="flex flex-wrap gap-1">${stage2Panels
                    .map((p) => `<span class="badge badge-gray">${UI.escape(p.awardType || p.name)}</span>`)
                    .join('')}</div>`
                : ''}
              <div>
                <p class="text-sm text-slate-500">Best award average</p>
                <p class="text-3xl font-semibold text-purple-600">${stage2Scores ? stage2Score.toFixed(2) : '—'}</p>
                <p class="mt-1 text-xs text-slate-500">Highest average across award panels</p>
              </div>
              <div class="border-t border-slate-100 pt-4">
                <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Judge scores by award</p>
                ${!stage2Scores
                  ? '<p class="text-sm text-red-600">Couldn\'t load Stage 2 scores.</p>'
                  : awardAverages.length
                    ? `<div class="space-y-4">${awardAverages
                        .map(
                          ({ award, scores, avg }) => `
                          <div>
                            <div class="mb-1.5 flex items-center justify-between gap-2 text-xs">
                              <span class="font-semibold text-slate-700">${UI.escape(award)}</span>
                              <span class="text-slate-500">Avg ${avg.toFixed(2)}</span>
                            </div>
                            <div class="space-y-1.5 border-l-2 border-purple-100 pl-3">
                              ${scores.map((s) => TeamDetailPage.judgeScoreRow(s, 'text-purple-600')).join('')}
                            </div>
                          </div>`,
                        )
                        .join('')}</div>`
                    : '<p class="text-sm text-slate-400">No scores yet</p>'}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  static judgeScoreRow(score, scoreClass) {
    const judge = score.judge;
    const name = UI.escape(judge?.name || 'Unknown judge');
    const href = judge?._id ? `/admin/judges/${judge._id}` : '';
    return `
      <div class="flex items-center justify-between gap-3 text-sm">
        ${href
          ? `<a href="${href}" onclick="navigateToPage(event, '${href}')" class="truncate text-slate-600 hover:text-blue-600">${name}</a>`
          : `<span class="truncate text-slate-600">${name}</span>`}
        <span class="font-semibold ${scoreClass}">${Number(score.totalScore || 0).toFixed(2)}</span>
      </div>
    `;
  }

  static infoCard(team) {
    const solution = team.actualSolution || '';
    const solutionBadge = { web: 'badge-blue', mobile: 'badge-green', ai: 'badge-purple' }[solution.toLowerCase()] || 'badge-gray';
    const field = (label, value) => `
      <div>
        <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">${label}</dt>
        <dd class="mt-1 break-words text-sm text-slate-900">${value}</dd>
      </div>`;

    return `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Team information</h2>
          ${team.qualifiedForStage2
            ? '<span class="badge badge-green">Qualified for Stage 2</span>'
            : '<span class="badge badge-gray">Not qualified for Stage 2</span>'}
        </div>
        <div class="card-body">
          <dl class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            ${field('Team name', `<span class="font-medium">${UI.escape(team.name)}</span>`)}
            ${field('Challenge', UI.escape(team.challenge || '—'))}
            ${field('Team leader', UI.escape(team.leaderName || '—'))}
            ${field(
              'Leader email',
              team.leaderEmail
                ? `<a href="mailto:${UI.escape(team.leaderEmail)}" class="text-blue-600 hover:underline">${UI.escape(team.leaderEmail)}</a>`
                : '—',
            )}
            ${field(
              'Solution',
              solution ? `<span class="badge ${solutionBadge}">${UI.escape(solution)}</span>` : '<span class="text-slate-400">Not provided</span>',
            )}
            ${team.panelNumber ? field('Panel number', UI.escape(team.panelNumber)) : ''}
          </dl>
          ${team.subjects?.length
            ? `<div class="mt-5 border-t border-slate-100 pt-5">
                <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Subjects</p>
                <div class="flex flex-wrap gap-2">${team.subjects
                  .map((s) => `<span class="badge badge-blue">${UI.escape(s)}</span>`)
                  .join('')}</div>
              </div>`
            : ''}
        </div>
      </div>
    `;
  }

  static linksCard(team) {
    const links = [
      ['Demo video', team.demoLink, 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'],
      ['Project proposal', team.proposalLink, 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'],
      ['Project link', team.projectLink, 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'],
      ['NASA submission', team.nasaSubmitLink, 'M13 10V3L4 14h7v7l9-11h-7z'],
    ];

    return `
      <div class="card">
        <div class="card-header"><h2 class="card-title">Project links</h2></div>
        <div class="card-body grid grid-cols-1 gap-3 sm:grid-cols-2">
          ${links
            .map(([label, url, icon]) => {
              const iconHtml = `<svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${icon}"></path></svg>`;
              if (!url) {
                return `
                  <div class="flex items-center gap-3 rounded-lg border border-dashed border-slate-200 p-3 text-slate-400">
                    ${iconHtml}
                    <div class="min-w-0"><p class="text-sm font-medium">${label}</p><p class="text-xs">Not provided</p></div>
                  </div>`;
              }
              const isWebLink = /^https?:\/\//i.test(url);
              const inner = `
                ${iconHtml}
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-slate-900">${label}</p>
                  <p class="truncate text-xs text-slate-500">${UI.escape(url)}</p>
                </div>`;
              return isWebLink
                ? `<a href="${UI.escape(url)}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-blue-600 transition-colors hover:border-blue-300 hover:bg-blue-50">
                    ${inner}
                    <svg class="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                  </a>`
                : `<div class="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-slate-500">${inner}</div>`;
            })
            .join('')}
        </div>
      </div>
    `;
  }
}
