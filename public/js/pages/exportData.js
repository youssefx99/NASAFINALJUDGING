// Export Data: all teams, judges, panels, scores, rankings and winners as one organized Excel workbook
class ExportDataPage {
  static SHEETS = [
    ['Summary', 'Totals, final score weights and judging timers'],
    ['Final Ranking', 'Every team ranked by final score (same ranking as the dashboard)'],
    ['Winners', 'Winner of every award and every special panel (same rules as the Winners page)'],
    ['Stage 1 Ranking', 'Stage 1 averages with how many assigned judges have scored each team'],
    ['Stage 2 Award Results', 'Each team’s average in every award it was scored for, ranked per award'],
    ['Special Panel Results', 'Each special panel’s teams ranked by average score'],
    ['Stage 1 Scores', 'Every judge’s Stage 1 score with the Yes/No answer to each question'],
    ['Stage 2 Scores', 'Every judge’s 1–5 ratings for each award'],
    ['Special Panel Scores', 'Every judge’s 1–5 ratings for each special panel'],
    ['Teams', 'All team details and the panels each team is in'],
    ['Judges', 'Every judge’s panels and scoring progress'],
    ['Panels', 'Every panel with its judges, teams and criteria'],
    ['Criteria', 'Stage 1 criteria, Stage 2 award questions and special panel questions'],
  ];

  static render() {
    return Layout.admin({
      title: 'Export Data',
      subtitle: 'Download all judging data as one Excel workbook',
      actions: `
        <button type="button" id="exportBtn" onclick="ExportDataPage.download()" class="btn btn-primary">
          ${Sidebar.icon('download', 'h-4 w-4')} Download Excel
        </button>`,
      content: `
        <div class="mx-auto max-w-4xl">
          <div class="card">
            <div class="card-header">
              <div>
                <h3 class="card-title">What’s in the workbook</h3>
                <p class="mt-0.5 text-sm text-slate-500">One sheet per topic, each with a filter on its header row. The data is read live when you click Download.</p>
              </div>
            </div>
            <ol class="divide-y divide-slate-100">
              ${ExportDataPage.SHEETS.map(
                ([name, description], i) => `
                <li class="flex items-start gap-4 px-5 py-3">
                  <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">${i + 1}</span>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-slate-900">${name}</p>
                    <p class="text-xs text-slate-500">${description}</p>
                  </div>
                </li>`,
              ).join('')}
            </ol>
          </div>
        </div>`,
    });
  }

  static async download() {
    const btn = document.getElementById('exportBtn');
    const label = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Preparing…`;
    try {
      const [data] = await Promise.all([UI.api('/api/export'), UI.loadSheetJs()]);
      const at = new Date(data.generatedAt);
      const stamp = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}-${String(at.getHours()).padStart(2, '0')}${String(at.getMinutes()).padStart(2, '0')}`;
      XLSX.writeFile(ExportDataPage.buildWorkbook(data), `judging-export-${stamp}.xlsx`, { compression: true });
      UI.toast('Excel export downloaded', 'success');
    } catch (e) {
      UI.toast(`Export failed: ${e.message}`, 'error', 6000);
    } finally {
      btn.disabled = false;
      btn.innerHTML = label;
    }
  }

  static buildWorkbook(data) {
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
    const percent = (weight) => Math.round(weight * 1000) / 10;
    const when = (value) =>
      value ? new Date(value).toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
    const yesNo = (value) => (value ? 'Yes' : 'No');

    const teamById = new Map(data.teams.map((t) => [t._id, t]));
    const judgeById = new Map(data.judges.map((j) => [j._id, j]));
    const panelById = new Map(data.panels.map((p) => [p._id, p]));
    const team = (id) => teamById.get(id) || { name: '(deleted team)', challenge: '' };
    const judge = (id) => judgeById.get(id) || { name: '(deleted judge)', email: '' };
    const stage1 = data.stages.find((s) => s.name === 'Stage 1') || { criteria: [] };
    const stage2 = data.stages.find((s) => s.name === 'Stage 2') || { criteria: [] };
    const panelsOf = (stage) => data.panels.filter((p) => p.stage === stage);
    const scoresOf = (stage) => data.scores.filter((s) => s.stage === stage);
    const byTeamThenJudge = (a, b) => collator.compare(team(a.team).name, team(b.team).name) || collator.compare(judge(a.judge).name, judge(b.judge).name);
    const names = (ids, lookup) => ids.map((id) => lookup(id).name).sort(collator.compare).join(', ');
    const panelNames = (panels) => panels.map((p) => p.name).join(', ');
    const average = (values) => values.reduce((sum, v) => sum + v, 0) / values.length;
    const awards = [...new Set([...stage2.criteria.map((c) => c.name), ...data.winners.map((w) => w.awardType)])];

    // Panel memberships: team/judge id -> panels
    const teamPanels = new Map();
    const judgePanels = new Map();
    const add = (map, key, panel) => (map.get(key) || map.set(key, []).get(key)).push(panel);
    data.panels.forEach((p) => {
      p.teams.forEach((id) => add(teamPanels, id, p));
      p.judges.forEach((id) => add(judgePanels, id, p));
    });
    const panelsFor = (map, id, stage) => (map.get(id) || []).filter((p) => p.stage === stage);
    const stage1Criteria = (p) => (p.criteria && p.criteria.length ? stage1.criteria.filter((c) => p.criteria.includes(c._id)) : stage1.criteria);

    // Who scored what: "stage:team:judge" (+ award or panel)
    const scored = new Set(data.scores.map((s) => `${s.stage}:${s.team}:${s.judge}:${s.stage === 2 ? s.awardType : s.stage === 3 ? s.panel : ''}`));
    const s1Scores = scoresOf(1).sort(byTeamThenJudge);
    const s2Scores = scoresOf(2).sort((a, b) => collator.compare(a.awardType || '', b.awardType || '') || byTeamThenJudge(a, b));
    const s3Scores = scoresOf(3).sort(
      (a, b) => collator.compare(panelById.get(a.panel)?.name || '', panelById.get(b.panel)?.name || '') || byTeamThenJudge(a, b),
    );
    const qualified = new Set(panelsOf(2).flatMap((p) => p.teams));
    const w = data.weights;

    const sheets = {};

    sheets['Summary'] = [
      ['Item', 'Value'],
      ['Generated at', when(data.generatedAt)],
      ['Final score formula', `${percent(w.stage1)}% Stage 1 average + ${percent(w.stage2)}% best Stage 2 award average`],
      ['Stage 1 weight (%)', percent(w.stage1)],
      ['Stage 2 weight (%)', percent(w.stage2)],
      ['Teams', data.teams.length],
      ['Judges', data.judges.length],
      ['Stage 1 panels', panelsOf(1).length],
      ['Stage 2 award panels', panelsOf(2).length],
      ['Special panels', panelsOf(3).length],
      ['Teams with a Stage 1 score', data.stage1Ranking.filter((t) => t.hasScore).length],
      ['Teams qualified for Stage 2', qualified.size],
      ['Stage 1 scores submitted', s1Scores.length],
      ['Stage 2 scores submitted', s2Scores.length],
      ['Special panel scores submitted', s3Scores.length],
      ['Stage 1 timer (minutes per team)', stage1.timerMinutes ?? ''],
      ['Stage 2 timer (minutes per team)', stage2.timerMinutes ?? ''],
    ];

    sheets['Final Ranking'] = [
      ['Rank', 'Team', 'Challenge', `Stage 1 Average /5 (${percent(w.stage1)}%)`, `Best Stage 2 Award Average /5 (${percent(w.stage2)}%)`, 'Best Award', 'Final Score /5', 'Status'],
      ...data.finalRanking.map((t, i) => [
        t.hasAnyScore ? i + 1 : '',
        t.name,
        t.challenge,
        t.hasStage1Score ? t.stage1Score : '',
        t.hasStage2Score ? t.stage2BestScore : '',
        t.hasStage2Score ? t.bestAward : '',
        t.hasAnyScore ? t.finalScore : '',
        t.hasStage1Score && t.hasStage2Score ? 'Stage 1 + Stage 2' : t.hasStage1Score ? 'Stage 1 only' : t.hasStage2Score ? 'Stage 2 only' : 'Not scored',
      ]),
    ];

    sheets['Winners'] = [
      ['Type', 'Award / Special Panel', 'Winning Team', 'Challenge', 'Final Score (0–100)', 'Award Average (0–100)', 'Special Panel Average /5', 'Judges'],
      ...awards.map((award) => {
        const winner = data.winners.find((x) => x.awardType === award);
        return winner
          ? ['Award', award, winner.winnerTeam.name, winner.winnerTeam.challenge, winner.finalScore, winner.averageScore, '', winner.judgeCount]
          : ['Award', award, 'No winner yet', '', '', '', '', ''];
      }),
      ...data.specialWinners.map((p) =>
        p.winnerTeam
          ? ['Special panel', p.name, p.winnerTeam.name, p.winnerTeam.challenge, '', '', p.winnerTeam.averageScore, p.winnerTeam.judgeCount]
          : ['Special panel', p.name, 'No winner yet', '', '', '', '', ''],
      ),
    ];

    sheets['Stage 1 Ranking'] = [
      ['Rank', 'Team', 'Challenge', 'Average /5', 'Judges Scored', 'Judges Assigned', 'All Assigned Judges Scored', 'Stage 1 Panels'],
      ...data.stage1Ranking.map((t, i) => {
        const panels = panelsFor(teamPanels, t._id, 1);
        const assigned = [...new Set(panels.flatMap((p) => p.judges))];
        return [
          t.hasScore ? i + 1 : '',
          t.name,
          t.challenge,
          t.hasScore ? t.averageScore : '',
          t.judgeCount,
          assigned.length,
          assigned.length ? yesNo(assigned.every((j) => scored.has(`1:${t._id}:${j}:`))) : 'No panel',
          panelNames(panels),
        ];
      }),
    ];

    const bestAward = new Map(data.finalRanking.filter((t) => t.hasStage2Score).map((t) => [String(t._id), t.bestAward]));
    sheets['Stage 2 Award Results'] = [
      ['Award', 'Rank in Award', 'Team', 'Challenge', 'Award Average /5', 'Judges Scored', 'Team’s Best Award'],
      ...awards.flatMap((award) => {
        const byTeam = new Map();
        s2Scores.filter((s) => s.awardType === award).forEach((s) => add(byTeam, s.team, s.totalScore));
        return [...byTeam]
          .map(([id, values]) => ({ id, average: average(values), count: values.length }))
          .sort((a, b) => b.average - a.average || b.count - a.count || collator.compare(team(a.id).name, team(b.id).name))
          .map((r, i) => [award, i + 1, team(r.id).name, team(r.id).challenge, r.average, r.count, yesNo(bestAward.get(r.id) === award)]);
      }),
    ];

    sheets['Special Panel Results'] = [
      ['Special Panel', 'Rank', 'Team', 'Challenge', 'Average /5', 'Judges Scored', 'Panel Judges'],
      ...panelsOf(3).flatMap((p) => {
        const byTeam = new Map(p.teams.map((id) => [id, []]));
        s3Scores.filter((s) => s.panel === p._id).forEach((s) => add(byTeam, s.team, s.totalScore));
        return [...byTeam]
          .map(([id, values]) => ({ id, average: values.length ? average(values) : null, count: values.length }))
          .sort(
            (a, b) =>
              (b.count > 0) - (a.count > 0) || (b.average ?? 0) - (a.average ?? 0) || b.count - a.count || collator.compare(team(a.id).name, team(b.id).name),
          )
          .map((r, i) => [p.name, r.count ? i + 1 : '', team(r.id).name, team(r.id).challenge, r.count ? r.average : 'Not scored', r.count, p.judges.length]);
      }),
    ];

    // Stage 1 columns: every Stage 1 criterion (plus any renamed/removed ones still in scores) with its questions
    const s1Columns = stage1.criteria.map((c) => ({ name: c.name, questions: c.questions.length }));
    s1Scores.forEach((s) =>
      Object.entries(s.scores || {}).forEach(([name, answers]) => {
        let column = s1Columns.find((c) => c.name === name);
        if (!column) s1Columns.push((column = { name, questions: 0 }));
        column.questions = Math.max(column.questions, answers.length);
      }),
    );
    sheets['Stage 1 Scores'] = [
      [
        'Team',
        'Challenge',
        'Judge',
        'Judge Email',
        'Score /5',
        ...s1Columns.flatMap((c) => [`${c.name} (Yes count)`, ...Array.from({ length: c.questions }, (_, qi) => `${c.name} Q${qi + 1}`)]),
        'Submitted At',
      ],
      ...s1Scores.map((s) => [
        team(s.team).name,
        team(s.team).challenge,
        judge(s.judge).name,
        judge(s.judge).email,
        s.totalScore,
        ...s1Columns.flatMap((c) => {
          const answers = (s.scores || {})[c.name];
          return answers
            ? [answers.filter((v) => v === 1).length, ...Array.from({ length: c.questions }, (_, qi) => (qi < answers.length ? (answers[qi] === 1 ? 'Yes' : 'No') : ''))]
            : Array(c.questions + 1).fill('');
        }),
        when(s.updatedAt),
      ]),
    ];

    const ratingRows = (rows, key) => {
      const count = Math.max(0, ...rows.map((s) => ((s.scores || {})[key(s)] || []).length));
      return {
        questions: Array.from({ length: count }, (_, qi) => `Q${qi + 1}`),
        answers: (s) => Array.from({ length: count }, (_, qi) => ((s.scores || {})[key(s)] || [])[qi] ?? ''),
      };
    };
    const s2Ratings = ratingRows(s2Scores, (s) => s.awardType);
    sheets['Stage 2 Scores'] = [
      ['Award', 'Team', 'Challenge', 'Judge', 'Judge Email', ...s2Ratings.questions, 'Average /5', 'Submitted At'],
      ...s2Scores.map((s) => [s.awardType, team(s.team).name, team(s.team).challenge, judge(s.judge).name, judge(s.judge).email, ...s2Ratings.answers(s), s.totalScore, when(s.updatedAt)]),
    ];
    const s3Ratings = ratingRows(s3Scores, (s) => s.panel);
    sheets['Special Panel Scores'] = [
      ['Special Panel', 'Team', 'Challenge', 'Judge', 'Judge Email', ...s3Ratings.questions, 'Average /5', 'Submitted At'],
      ...s3Scores.map((s) => [
        panelById.get(s.panel)?.name || '(deleted panel)',
        team(s.team).name,
        team(s.team).challenge,
        judge(s.judge).name,
        judge(s.judge).email,
        ...s3Ratings.answers(s),
        s.totalScore,
        when(s.updatedAt),
      ]),
    ];

    sheets['Teams'] = [
      ['Team', 'Challenge', 'Leader Name', 'Leader Email', 'Solution Type', 'Panel Number', 'Subjects', 'Demo Link', 'Proposal Link', 'Project Link', 'NASA Submission Link', 'Stage 1 Panels', 'Qualified for Stage 2', 'Special Panels'],
      ...data.teams.map((t) => [
        t.name,
        t.challenge,
        t.leaderName || '',
        t.leaderEmail || '',
        t.actualSolution || '',
        t.panelNumber || '',
        (t.subjects || []).join(', '),
        t.demoLink || '',
        t.proposalLink || '',
        t.projectLink || '',
        t.nasaSubmitLink || '',
        panelNames(panelsFor(teamPanels, t._id, 1)),
        yesNo(qualified.has(t._id)),
        panelNames(panelsFor(teamPanels, t._id, 3)),
      ]),
    ];

    sheets['Judges'] = [
      ['Judge', 'Email', 'Stage 1 Panels', 'Stage 2 Award Panels', 'Special Panels', 'Stage 1 Teams Scored', 'Stage 1 Teams Assigned', 'Stage 2 Scored', 'Stage 2 Assigned', 'Special Panel Scored', 'Special Panel Assigned'],
      ...data.judges.map((j) => {
        const p1 = panelsFor(judgePanels, j._id, 1);
        const p2 = panelsFor(judgePanels, j._id, 2);
        const p3 = panelsFor(judgePanels, j._id, 3);
        const s1Teams = [...new Set(p1.flatMap((p) => p.teams))];
        const pairs = (panels, suffix) => panels.flatMap((p) => p.teams.map((t) => `${t}:${j._id}:${suffix(p)}`));
        const s2Pairs = pairs(p2, (p) => p.awardType);
        const s3Pairs = pairs(p3, (p) => p._id);
        return [
          j.name,
          j.email,
          panelNames(p1),
          p2.map((p) => p.awardType || p.name).join(', '),
          panelNames(p3),
          s1Teams.filter((t) => scored.has(`1:${t}:${j._id}:`)).length,
          s1Teams.length,
          s2Pairs.filter((key) => scored.has(`2:${key}`)).length,
          s2Pairs.length,
          s3Pairs.filter((key) => scored.has(`3:${key}`)).length,
          s3Pairs.length,
        ];
      }),
    ];

    sheets['Panels'] = [
      ['Panel', 'Stage', 'Award', 'Criteria / Questions', 'Judges Count', 'Judges', 'Teams Count', 'Teams'],
      ...data.panels.map((p) => [
        p.name,
        p.stage === 3 ? 'Special panel' : `Stage ${p.stage}`,
        p.awardType || '',
        p.stage === 1
          ? stage1Criteria(p).map((c) => c.name).join(', ')
          : p.stage === 3
            ? (p.awardCriteria || []).map((q) => q.question).join(' | ')
            : (stage2.criteria.find((c) => c.name === p.awardType)?.questions || []).join(' | '),
        p.judges.length,
        names(p.judges, judge),
        p.teams.length,
        names(p.teams, team),
      ]),
    ];

    const descriptions = (d = {}) => [1, 2, 3, 4, 5].map((n) => d[`score${n}`] || '');
    sheets['Criteria'] = [
      ['Stage', 'Criterion / Award / Panel', 'Weight (%)', 'Question #', 'Question', 'Score 1', 'Score 2', 'Score 3', 'Score 4', 'Score 5'],
      ...stage1.criteria.flatMap((c) => c.questions.map((q, qi) => ['Stage 1 (Yes/No)', c.name, percent(c.weight), qi + 1, q, '', '', '', '', ''])),
      ...stage2.criteria.flatMap((c) => c.questions.map((q, qi) => ['Stage 2 (1–5)', c.name, '', qi + 1, q, ...descriptions((c.scoringDescriptions || [])[qi])])),
      ...panelsOf(3).flatMap((p) => (p.awardCriteria || []).map((q, qi) => ['Special panel (1–5)', p.name, '', qi + 1, q.question, ...descriptions(q.descriptions)])),
    ];

    const workbook = XLSX.utils.book_new();
    for (const [name] of this.SHEETS) {
      // Excel cells hold at most 32,767 characters
      const rows = sheets[name].map((row) => row.map((v) => (typeof v === 'string' && v.length > 32000 ? `${v.slice(0, 32000)}…` : v)));
      const ws = XLSX.utils.aoa_to_sheet(rows);
      Object.values(ws).forEach((cell) => {
        if (cell && cell.t === 'n' && !Number.isInteger(cell.v)) cell.z = '0.00';
      });
      ws['!cols'] = rows[0].map((_, ci) => ({ wch: Math.min(60, Math.max(10, ...rows.map((row) => String(row[ci] ?? '').length + 2))) }));
      if (rows.length > 1) ws['!autofilter'] = { ref: ws['!ref'] };
      XLSX.utils.book_append_sheet(workbook, ws, name);
    }
    return workbook;
  }
}
