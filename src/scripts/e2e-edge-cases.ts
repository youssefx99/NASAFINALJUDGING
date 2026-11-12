// End-to-end edge cases through the real API. Creates its own fixtures and removes them afterwards.
// Usage: E2E_URL=http://localhost:3000 npm run test:edge   (reads ADMIN_* from .env; refuses non-local URLs)
const BASE = process.env.E2E_URL || 'http://localhost:3000';
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE) && process.env.E2E_ALLOW_REMOTE !== '1') {
  throw new Error('Edge-case suite modifies data; run it against a local server (or set E2E_ALLOW_REMOTE=1)');
}

let passed = 0;
const failures: string[] = [];
function check(name: string, ok: boolean, detail = '') {
  if (ok) passed++;
  else failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? ` — ${detail}` : ''}`);
}

async function api(method: string, path: string, token?: string, body?: unknown, raw?: string) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined || raw !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, json };
}

const tag = `e2e${Date.now()}`;

async function main() {
  const login = async (email: string, password: string) => (await api('POST', '/api/auth/login', undefined, { email, password })).json?.token as string;
  const admin = await login(process.env.ADMIN_EMAIL || '', process.env.ADMIN_PASSWORD || '');
  if (!admin) throw new Error('Admin login failed');
  const stage1 = (await api('GET', '/api/stages/Stage%201', admin)).json;
  const stage2 = (await api('GET', '/api/stages/Stage%202', admin)).json;
  const allPanels = (await api('GET', '/api/panels', admin)).json as any[];
  const awardPanels = allPanels.filter((p) => p.stage === 2).slice(0, 2);
  const awardPanelsBefore = awardPanels.map((p) => ({ id: p._id, judges: p.judges.map((j: any) => j._id), teams: p.teams.map((t: any) => t._id), name: p.name, awardType: p.awardType }));

  // ---------- Fixtures ----------
  const teamNames = [`${tag} Alpha`, `${tag} Beta`, `${tag} Gamma`, `${tag} Delta`, `${tag} فريق عربي`, `${tag} Eps`];
  const imported = await api('POST', '/api/teams/import', admin, {
    rows: [
      ...teamNames.map((name, i) => ({ 'Team Name': `  ${name}  `, Challenge: `Challenge ${i}`, actualSolution: 'web' })),
      { 'Team Name': teamNames[0], Challenge: 'Duplicate row' },
      { 'Team Name': '', Challenge: 'No name' },
    ],
  });
  check('import: unicode + padded names, duplicate merged, missing name reported', imported.status === 201 && imported.json.created === 6 && imported.json.duplicates === 1 && imported.json.failed === 1, JSON.stringify(imported.json));
  const teams = ((await api('GET', '/api/teams', admin)).json as any[]).filter((t) => t.name.startsWith(tag));
  const team = (suffix: string) => teams.find((t) => t.name === `${tag} ${suffix}`);
  check('import: names trimmed, unicode stored intact', teams.length === 6 && !!team('فريق عربي') && teams.every((t) => t.name === t.name.trim()));
  check('import: duplicate row updated the first team', team('Alpha')?.challenge === 'Duplicate row');

  const password = `Pw-${tag}-x`;
  const createJudge = async (name: string, email: string) => (await api('POST', '/api/users', admin, { name, email, password, panelAssignments: [] })).json;
  const j1 = await createJudge('E2E Multi', `${tag}.MULTI@Example.com `);
  const j2 = await createJudge('E2E Empty', `${tag}.empty@example.com`);
  const j3 = await createJudge('E2E Single', `${tag}.single@example.com`);
  check('create judge: email trimmed + lowercased', j1?.email === `${tag}.multi@example.com`, j1?.email);
  const dup = await api('POST', '/api/users', admin, { name: 'Dup', email: `${tag}.EMPTY@example.com`, password, panelAssignments: [] });
  check('create judge: duplicate email (different case) rejected without 500', dup.status === 400 || dup.status === 409, `got ${dup.status}`);
  const t1 = await login(`${tag}.Multi@EXAMPLE.com`, password);
  const t2 = await login(`${tag}.empty@example.com`, password);
  const t3 = await login(`  ${tag}.single@example.com  `, password);
  check('login: email is case-insensitive and whitespace-tolerant', !!t1 && !!t2 && !!t3);

  const p1 = (await api('POST', '/api/panels', admin, { name: `${tag} P1`, stage: 1, judges: [j1._id, j3._id], teams: [team('Alpha')._id, team('Beta')._id, team('Gamma')._id] })).json;
  const p1b = (await api('POST', '/api/panels', admin, { name: `${tag} P1b`, stage: 1, judges: [j1._id], teams: [team('Gamma')._id, team('Delta')._id] })).json;
  // j1 joins two Stage 2 award panels, j3 one; both award panels get Alpha and Beta
  for (const [i, panel] of awardPanels.entries()) {
    await api('PUT', `/api/panels/${panel._id}`, admin, {
      name: panel.name, stage: 2, awardType: panel.awardType,
      judges: [...awardPanelsBefore[i].judges, j1._id, ...(i === 0 ? [j3._id] : [])],
      teams: [...new Set([...awardPanelsBefore[i].teams, team('Alpha')._id, team('Beta')._id])],
    });
  }
  const sp = (await api('POST', '/api/panels', admin, { name: `${tag} Special`, stage: 3, judges: [j1._id], teams: [team('Delta')._id, team('فريق عربي')._id], awardCriteria: [{ question: 'Q1' }, { question: 'Q2' }] })).json;
  const spEmpty = (await api('POST', '/api/panels', admin, { name: `${tag} No questions`, stage: 3, judges: [j1._id], teams: [team('Eps')._id], awardCriteria: [] })).json;

  let j4: any;
  let originalWeight: number | undefined;
  let stagesChanged = false;
  const criteriaPanels: any[] = [];
  try {
    // ---------- Assignments ----------
    const a1 = (await api('GET', '/api/judges/assigned-teams', t1)).json;
    const stage1Ids = a1.stage1Teams.map((t: any) => t._id);
    check('judge on 2 Stage 1 panels: teams pooled without duplicates', stage1Ids.length === 4 && new Set(stage1Ids).size === 4, `${stage1Ids.length}`);
    const myAwards = a1.stage2Panels.filter((p: any) => awardPanels.some((ap) => ap._id === p._id));
    check('judge on 2 Stage 2 award panels: both listed separately', myAwards.length === 2 && myAwards.every((p: any) => p.awardType && p.teams.length >= 2));
    check('judge sees special panels incl. one without questions', a1.specialPanels.length >= 2);
    const a2 = (await api('GET', '/api/judges/assigned-teams', t2)).json;
    check('judge with no panels: empty lists, no error', a2.stage1Teams.length === 0 && a2.stage2Panels.length === 0 && a2.specialPanels.length === 0);

    // ---------- Stage 1 scoring ----------
    const allYes = Object.fromEntries(stage1.criteria.map((c: any) => [c.name, c.questions.map(() => 1)]));
    const allNo = Object.fromEntries(stage1.criteria.map((c: any) => [c.name, c.questions.map(() => 0)]));
    let r = await api('POST', '/api/scores', t1, { teamId: team('Gamma')._id, stage: 1, scores: allYes });
    check('stage 1: team in two of my panels can be scored once', r.status === 201 && r.json.totalScore === 5, `${r.status} ${r.json?.totalScore}`);
    const firstId = r.json?._id;
    r = await api('POST', '/api/scores', t1, { teamId: team('Gamma')._id, stage: 1, scores: allNo });
    check('stage 1: re-scoring updates the same score', r.status === 201 && r.json._id === firstId && r.json.totalScore === 0);
    const firstCriterion = stage1.criteria[0];
    const variants: Array<[string, unknown]> = [
      ['too few answers', { ...allYes, [firstCriterion.name]: firstCriterion.questions.slice(1).map(() => 1) }],
      ['fractional answer', { ...allYes, [firstCriterion.name]: firstCriterion.questions.map(() => 0.5) }],
      ['string answer', { ...allYes, [firstCriterion.name]: firstCriterion.questions.map(() => '1') }],
      ['boolean answer', { ...allYes, [firstCriterion.name]: firstCriterion.questions.map(() => true) }],
      ['scores not an object', 'abc'],
    ];
    for (const [name, scores] of variants) {
      r = await api('POST', '/api/scores', t1, { teamId: team('Gamma')._id, stage: 1, scores });
      check(`stage 1: ${name} rejected (400)`, r.status === 400, `got ${r.status}`);
    }
    r = await api('POST', '/api/scores', t1, { teamId: team('Gamma')._id, stage: 1, scores: { ...allYes, 'Unknown criterion': [1, 1] } });
    check('stage 1: unknown extra criteria ignored', r.status === 201 && !('Unknown criterion' in r.json.scores));
    for (const [name, body] of [['missing teamId', { stage: 1, scores: allYes }], ['invalid teamId', { teamId: 'abc', stage: 1, scores: allYes }], ['stage 4', { teamId: team('Gamma')._id, stage: 4, scores: allYes }], ['stage as string', { teamId: team('Gamma')._id, stage: '1', scores: allYes }], ['empty body', {}]] as Array<[string, unknown]>) {
      r = await api('POST', '/api/scores', t1, body);
      check(`score: ${name} rejected (400)`, r.status === 400, `got ${r.status}`);
    }
    r = await api('POST', '/api/scores', t2, { teamId: team('Gamma')._id, stage: 1, scores: allYes });
    check('stage 1: judge without that team is refused (403)', r.status === 403, `got ${r.status}`);
    const burst = await Promise.all(Array.from({ length: 25 }, (_, i) => api('POST', '/api/scores', t3, { teamId: team('Alpha')._id, stage: 1, scores: i % 2 ? allYes : allNo })));
    const burstScores = ((await api('GET', `/api/scores/team/${team('Alpha')._id}/stage/1`, admin)).json as any[]).filter((s) => s.judge._id === j3._id);
    check('25 simultaneous submits: all succeed, exactly one score stored', burst.every((b) => b.status === 201) && burstScores.length === 1, `${burst.map((b) => b.status).filter((s) => s !== 201)} / ${burstScores.length}`);

    // ---------- Stage 2 (multiple award panels) ----------
    const [awardA, awardB] = myAwards;
    const answersFor = (award: string, value: number) => (stage2.criteria.find((c: any) => c.name === award)?.questions || []).map(() => value);
    r = await api('POST', '/api/scores', t1, { teamId: team('Alpha')._id, stage: 2, panelId: awardA._id, scores: { [awardA.awardType]: answersFor(awardA.awardType, 5) } });
    check('stage 2: score award A (panelId given)', r.status === 201 && r.json.awardType === awardA.awardType && r.json.totalScore === 5, `${r.status} ${JSON.stringify(r.json).slice(0, 120)}`);
    r = await api('POST', '/api/scores', t1, { teamId: team('Alpha')._id, stage: 2, panelId: awardB._id, scores: { [awardB.awardType]: answersFor(awardB.awardType, 2) } });
    check('stage 2: same team, award B is a separate score', r.status === 201 && r.json.awardType === awardB.awardType && r.json.totalScore === 2);
    const mineA = (await api('GET', `/api/scores/judge/${j1._id}/team/${team('Alpha')._id}/stage/2?panel=${awardA._id}`, t1)).json;
    const mineB = (await api('GET', `/api/scores/judge/${j1._id}/team/${team('Alpha')._id}/stage/2?panel=${awardB._id}`, t1)).json;
    check('stage 2: reopening each award loads its own score', mineA?.totalScore === 5 && mineB?.totalScore === 2);
    const a1b = (await api('GET', '/api/judges/assigned-teams', t1)).json;
    check('stage 2: scored ids tracked per award panel', a1b.stage2Panels.every((p: any) => !myAwards.some((m: any) => m._id === p._id) || p.scoredTeamIds.includes(team('Alpha')._id)));
    r = await api('POST', '/api/scores', t1, { teamId: team('Beta')._id, stage: 2, scores: { [awardA.awardType]: answersFor(awardA.awardType, 3) } });
    check('stage 2: ambiguous (2 awards, no panelId) asks to choose (400)', r.status === 400 && /more than one award/i.test(r.json?.message || ''), `${r.status} ${r.json?.message}`);
    r = await api('POST', '/api/scores', t3, { teamId: team('Beta')._id, stage: 2, scores: { [awardPanels[0].awardType]: answersFor(awardPanels[0].awardType, 4) } });
    check('stage 2: single award panel, no panelId (older clients) works', r.status === 201 && r.json.awardType === awardPanels[0].awardType, `${r.status}`);
    r = await api('POST', '/api/scores', t1, { teamId: team('Alpha')._id, stage: 2, panelId: awardA._id, scores: { [awardA.awardType]: answersFor(awardA.awardType, 6) } });
    check('stage 2: rating 6 rejected (400)', r.status === 400);
    r = await api('POST', '/api/scores', t1, { teamId: team('Alpha')._id, stage: 2, panelId: awardA._id, scores: { [awardB.awardType]: answersFor(awardB.awardType, 3) } });
    check('stage 2: answers under the wrong award rejected (400)', r.status === 400);
    r = await api('POST', '/api/scores', t1, { teamId: team('Alpha')._id, stage: 2, panelId: sp._id, scores: {} });
    check('stage 2: panelId of a non-award panel refused (403)', r.status === 403, `got ${r.status}`);

    // ---------- Special panels ----------
    r = await api('POST', '/api/scores', t1, { teamId: team('فريق عربي')._id, stage: 3, panelId: sp._id, scores: { [sp._id]: [4, 5] } });
    check('special: member scores unicode-named team', r.status === 201 && r.json.totalScore === 4.5);
    r = await api('POST', '/api/scores', t1, { teamId: team('Eps')._id, stage: 3, panelId: spEmpty._id, scores: { [spEmpty._id]: [] } });
    check('special: panel without questions refuses scoring (400)', r.status === 400, `got ${r.status}`);
    r = await api('POST', '/api/scores', t3, { teamId: team('Delta')._id, stage: 3, panelId: sp._id, scores: { [sp._id]: [4, 5] } });
    check('special: non-member refused (403)', r.status === 403);
    r = await api('POST', '/api/scores', t1, { teamId: team('Delta')._id, stage: 3, scores: { [sp._id]: [4, 5] } });
    check('special: missing panelId rejected (400)', r.status === 400);
    const results = (await api('GET', `/api/scores/panel/${sp._id}`, admin)).json;
    check('special: admin results rank scored team first', results.teams[0].name === team('فريق عربي').name && results.teams[0].averageScore === 4.5 && results.teams[1].hasScore === false);
    const board = (await api('GET', '/api/winners/leaderboard?finalists=4', admin)).json;
    check('special: ceremony entry has the right winner', board.data.find((e: any) => e.id === `special:${sp._id}`)?.winner?.name === team('فريق عربي').name);

    // ---------- Changes during judging ----------
    await api('PUT', `/api/panels/${p1b._id}`, admin, { name: `${tag} P1b`, stage: 1, judges: [], teams: [team('Gamma')._id, team('Delta')._id] });
    r = await api('POST', '/api/scores', t1, { teamId: team('Delta')._id, stage: 1, scores: allYes });
    check('judge removed from panel mid-judging: submit refused (403)', r.status === 403, `got ${r.status}`);
    const usersAfter = (await api('GET', `/api/users/${j1._id}`, admin)).json;
    check('panel edit removes the panel from the judge’s assignments', !usersAfter.panelAssignments.some((a: any) => a.panel?._id === p1b._id));
    await api('DELETE', `/api/teams/${team('Beta')._id}`, admin);
    r = await api('POST', '/api/scores', t3, { teamId: team('Beta')._id, stage: 1, scores: allYes });
    check('deleted team: submit refused (403), no crash', r.status === 403, `got ${r.status}`);
    r = await api('GET', `/api/teams/${team('Beta')._id}`, admin);
    check('deleted team: GET returns 404/400, not 500', r.status === 404 || r.status === 400, `got ${r.status}`);
    const judgeEdit = await api('PUT', `/api/users/${j1._id}`, admin, { name: 'E2E Multi', email: j1.email, panelAssignments: usersAfter.panelAssignments.map((a: any) => ({ stage: a.stage, panel: a.panel._id })) });
    const spAfter = (await api('GET', `/api/panels/${sp._id}`, admin)).json;
    check('editing a judge keeps Stage 2 + special memberships', judgeEdit.status === 200 && spAfter.judges.some((j: any) => j._id === j1._id) && (await api('GET', `/api/panels/${awardA._id}`, admin)).json.judges.some((j: any) => j._id === j1._id));

    // ---------- Bad ids / bad bodies never cause 500 ----------
    for (const [method, path] of [
      ['GET', '/api/teams/not-an-id'], ['GET', '/api/users/not-an-id'], ['GET', '/api/panels/not-an-id'], ['GET', '/api/scores/team/not-an-id/stage/1'],
      ['GET', '/api/scores/panel/not-an-id'], ['GET', '/api/scores/judge/not-an-id'], ['DELETE', '/api/teams/not-an-id'], ['DELETE', '/api/users/not-an-id'],
      ['DELETE', '/api/panels/not-an-id'], ['PUT', '/api/panels/not-an-id'], ['PUT', '/api/users/not-an-id'], ['GET', '/api/users/000000000000000000000000'],
      ['GET', '/api/panels/000000000000000000000000'], ['DELETE', '/api/teams/000000000000000000000000'], ['DELETE', '/api/panels/000000000000000000000000'],
      ['GET', `/api/winners/award/${encodeURIComponent('Not an award')}/team/000000000000000000000000/breakdown`], ['GET', '/api/stages/Stage%209'],
      ['GET', '/api/stages/award/Nope'], ['GET', '/api/scores/top?stage=abc&limit=xyz'], ['GET', '/api/stage2-qualification/incomplete-judges?page=-1&limit=0'],
      ['GET', '/api/stage2-qualification/top-teams?limit=abc'], ['GET', '/api/winners/ranked-teams?limit=-5'],
    ] as Array<[string, string]>) {
      const res = await api(method, path, admin, method === 'PUT' ? { name: 'x' } : undefined);
      check(`no 500: ${method} ${path}`, res.status < 500, `got ${res.status} ${JSON.stringify(res.json).slice(0, 100)}`);
    }
    for (const [name, path, raw] of [
      ['malformed JSON', '/api/panels', '{"name": '], ['JSON array body', '/api/users', '[1,2,3]'], ['null body', '/api/teams/import', 'null'], ['string body', '/api/auth/login', '"hello"'],
    ] as Array<[string, string, string]>) {
      const res = await api('POST', path, path === '/api/auth/login' ? undefined : admin, undefined, raw);
      check(`no 500: ${name} → ${path}`, res.status >= 400 && res.status < 500, `got ${res.status}`);
    }
    const big = await api('POST', '/api/teams/import', admin, { rows: Array.from({ length: 2001 }, (_, i) => ({ team_name: `x${i}`, challenge: 'y' })) });
    check('import: more than 2000 rows per request rejected (400)', big.status === 400);
    const huge = await api('POST', '/api/teams/import', admin, undefined, JSON.stringify({ rows: [{ team_name: 'x', challenge: 'y'.repeat(5 * 1024 * 1024) }] }));
    check('import: body over 4MB rejected (413), not 500', huge.status === 413, `got ${huge.status}`);
    for (const limit of [0, -1, 1000, 'abc', 2.5]) {
      const q = await api('POST', '/api/stage2-qualification/qualify', admin, { limit });
      check(`qualify: invalid limit ${JSON.stringify(limit)} rejected (400)`, q.status === 400, `got ${q.status}`);
    }
    const badPanel = await api('POST', '/api/panels', admin, { name: `${tag} bad`, stage: 4, judges: [], teams: [] });
    check('panel with stage 4 rejected (400)', badPanel.status === 400, `got ${badPanel.status}`);
    const badRef = await api('POST', '/api/panels', admin, { name: `${tag} bad ref`, stage: 1, judges: ['not-an-id'], teams: [] });
    check('panel with invalid judge id rejected (400)', badRef.status === 400, `got ${badRef.status}`);

    // ---------- Password change ----------
    const cp = (body: unknown, token = t3) => api('POST', '/api/auth/change-password', token, body);
    check('change password: wrong current (400)', (await cp({ currentPassword: 'nope-nope', newPassword: 'Another-pass-1', confirmPassword: 'Another-pass-1' })).status === 400);
    check('change password: mismatch (400)', (await cp({ currentPassword: password, newPassword: 'Another-pass-1', confirmPassword: 'Another-pass-2' })).status === 400);
    check('change password: too short (400)', (await cp({ currentPassword: password, newPassword: 'short', confirmPassword: 'short' })).status === 400);
    check('change password: same as current (400)', (await cp({ currentPassword: password, newPassword: password, confirmPassword: password })).status === 400);
    const changed = await cp({ currentPassword: password, newPassword: 'Another-pass-1', confirmPassword: 'Another-pass-1' });
    await new Promise((resolve) => setTimeout(resolve, 50));
    check('change password: success returns a working session; old one revoked', changed.status === 201 && (await api('GET', '/api/judges/assigned-teams', changed.json.token)).status === 200 && (await api('GET', '/api/judges/assigned-teams', t3)).status === 401);

    // ---------- Deleting a judge removes their scores ----------
    const tempJudge = await createJudge('E2E Temp', `${tag}.temp@example.com`);
    await api('PUT', `/api/panels/${p1._id}`, admin, { name: `${tag} P1`, stage: 1, judges: [j1._id, j3._id, tempJudge._id], teams: [team('Alpha')._id, team('Gamma')._id] });
    const tt = await login(`${tag}.temp@example.com`, password);
    await api('POST', '/api/scores', tt, { teamId: team('Gamma')._id, stage: 1, scores: allYes });
    const beforeDelete = ((await api('GET', `/api/scores/team/${team('Gamma')._id}/stage/1`, admin)).json as any[]).length;
    await api('DELETE', `/api/users/${tempJudge._id}`, admin);
    const afterDelete = ((await api('GET', `/api/scores/team/${team('Gamma')._id}/stage/1`, admin)).json as any[]).length;
    check('deleting a judge removes their scores (no hidden scores in rankings)', afterDelete === beforeDelete - 1, `${beforeDelete} -> ${afterDelete}`);

    // ---------- Stage 1 panels score only their selected criteria ----------
    const [c0, c1, c2] = stage1.criteria;
    j4 = await createJudge('E2E Criteria', `${tag}.criteria@example.com`);
    const t4 = await login(`${tag}.criteria@example.com`, password);
    const newPanel = async (name: string, teamIds: string[], criteria: string[]) =>
      (await api('POST', '/api/panels', admin, { name: `${tag} ${name}`, stage: 1, judges: [j4._id], teams: teamIds, criteria })).json;
    const pcA = await newPanel('Crit A', [team('Eps')._id, team('Gamma')._id], [c0._id, c2._id]);
    const pcB = await newPanel('Crit B', [team('Gamma')._id, team('Delta')._id], [c1._id]);
    const pcC = await newPanel('Crit C', [team('Delta')._id], []);
    const pcD = await newPanel('Crit D', [team('فريق عربي')._id], ['000000000000000000000000']);
    criteriaPanels.push(pcA, pcB, pcC, pcD);
    const sameIds = (a: string[] | null, b: string[] | null) => (a === null || b === null ? a === b : a.length === b.length && b.every((id) => a.includes(id)));
    const a4 = (await api('GET', '/api/judges/assigned-teams', t4)).json;
    const idsFor = (name: string) => a4.stage1Teams.find((t: any) => t._id === team(name)._id)?.criteriaIds;
    check('criteria: panel selection is sent to the judge per team', sameIds(idsFor('Eps'), [c0._id, c2._id]), JSON.stringify(idsFor('Eps')));
    check('criteria: team in two panels gets the union of both selections', sameIds(idsFor('Gamma'), [c0._id, c1._id, c2._id]), JSON.stringify(idsFor('Gamma')));
    check('criteria: a panel without a selection means all criteria', idsFor('Delta') === null, JSON.stringify(idsFor('Delta')));
    const yes = (c: any) => c.questions.map(() => 1);
    const no = (c: any) => c.questions.map(() => 0);
    r = await api('POST', '/api/scores', t4, { teamId: team('Eps')._id, stage: 1, scores: { [c0.name]: yes(c0), [c2.name]: no(c2) } });
    const expected = ((c0.questions.length * c0.weight) / (c0.questions.length * c0.weight + c2.questions.length * c2.weight)) * 5;
    check('criteria: score uses only the selected criteria (weights renormalized to /5)', r.status === 201 && Math.abs(r.json.totalScore - expected) < 1e-9 && sameIds(Object.keys(r.json.scores), [c0.name, c2.name]), `${r.status} ${r.json?.totalScore} vs ${expected}`);
    r = await api('POST', '/api/scores', t4, { teamId: team('Eps')._id, stage: 1, scores: { [c0.name]: yes(c0) } });
    check('criteria: missing a selected criterion rejected (400)', r.status === 400, `got ${r.status}`);
    r = await api('POST', '/api/scores', t4, { teamId: team('Eps')._id, stage: 1, scores: allYes });
    check('criteria: answers for unselected criteria are not stored', r.status === 201 && r.json.totalScore === 5 && sameIds(Object.keys(r.json.scores), [c0.name, c2.name]));
    r = await api('POST', '/api/scores', t4, { teamId: team('Gamma')._id, stage: 1, scores: allNo });
    check('criteria: union of two panels is scored together', r.status === 201 && r.json.totalScore === 0 && sameIds(Object.keys(r.json.scores), [c0.name, c1.name, c2.name]));
    r = await api('POST', '/api/scores', t4, { teamId: team('Delta')._id, stage: 1, scores: allYes });
    check('criteria: all-criteria panel stores every criterion', r.status === 201 && sameIds(Object.keys(r.json.scores), stage1.criteria.map((c: any) => c.name)));
    r = await api('POST', '/api/scores', t4, { teamId: team('فريق عربي')._id, stage: 1, scores: allYes });
    check('criteria: panel whose criteria were all deleted refuses scoring (400)', r.status === 400 && /No Stage 1 criteria/.test(r.json?.message || ''), `${r.status} ${r.json?.message}`);
    r = await api('POST', '/api/panels', admin, { name: `${tag} bad crit`, stage: 1, judges: [], teams: [], criteria: ['abc'] });
    check('criteria: invalid criterion id rejected (400)', r.status === 400, `got ${r.status}`);
    await api('PUT', `/api/panels/${pcA._id}`, admin, { name: pcA.name, stage: 1, judges: [j4._id], teams: [team('Eps')._id, team('Gamma')._id], criteria: [c1._id] });
    const pcAAfter = (await api('GET', `/api/panels/${pcA._id}`, admin)).json;
    const a4b = (await api('GET', '/api/judges/assigned-teams', t4)).json;
    check('criteria: editing the panel updates the selection', sameIds(pcAAfter.criteria, [c1._id]) && sameIds(a4b.stage1Teams.find((t: any) => t._id === team('Eps')._id)?.criteriaIds, [c1._id]));

    // ---------- Final score weights ----------
    const weights = (await api('GET', '/api/stages/final-weights', admin)).json;
    originalWeight = weights.stage1;
    check('weights: GET returns Stage 1 + Stage 2 = 100%', Math.abs(weights.stage1 + weights.stage2 - 1) < 1e-12 && weights.stage1 >= 0 && weights.stage1 <= 1, JSON.stringify(weights));
    for (const bad of [-0.1, 1.01, '0.5', null, true, undefined]) {
      r = await api('PUT', '/api/stages/final-weights', admin, bad === undefined ? {} : { stage1: bad });
      check(`weights: invalid ${JSON.stringify(bad)} rejected (400)`, r.status === 400, `got ${r.status}`);
    }
    check('weights: judges cannot read or change them (403)', (await api('GET', '/api/stages/final-weights', t1)).status === 403 && (await api('PUT', '/api/stages/final-weights', t1, { stage1: 0.5 })).status === 403);
    const final = async () => (await api('GET', '/api/scores/top?stage=final&limit=100000', admin)).json as any[];
    for (const weight of [0.7, 1, 0, 0.25]) {
      r = await api('PUT', '/api/stages/final-weights', admin, { stage1: weight });
      check(`weights: set Stage 1 to ${weight * 100}%`, r.status === 200 && r.json.stage1 === weight && Math.abs(r.json.stage2 - (1 - weight)) < 1e-12, JSON.stringify(r.json));
      const ranking = await final();
      const wrong = ranking.filter((t) => Math.abs(t.finalScore - (weight * t.stage1Score + (1 - weight) * t.stage2BestScore)) > 1e-9);
      const sorted = ranking.every((t, i) => i === 0 || !t.hasAnyScore || ranking[i - 1].finalScore >= t.finalScore - 1e-12);
      check(`weights ${weight * 100}/${100 - weight * 100}: every final score and the ranking order are correct`, wrong.length === 0 && sorted, `${wrong.length} wrong`);

      // Independent recomputation from the raw scores (the server's best award is only trusted for exact ties)
      const exported = (await api('GET', '/api/export', admin)).json;
      const avg = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;
      const group = (rows: any[], key: (s: any) => string) => rows.reduce((m, s) => m.set(key(s), [...(m.get(key(s)) || []), s.totalScore]), new Map<string, number[]>());
      const s1 = group(exported.scores.filter((s: any) => s.stage === 1), (s) => s.team);
      const s2 = group(exported.scores.filter((s: any) => s.stage === 2 && s.awardType), (s) => `${s.team}|${s.awardType}`);
      const maxAvg = new Map<string, number>();
      for (const [key, values] of s2) maxAvg.set(key.split('|')[0], Math.max(maxAvg.get(key.split('|')[0]) ?? 0, avg(values)));
      const badRows = ranking.filter((t) => Math.abs(t.stage1Score - (s1.has(t._id) ? avg(s1.get(t._id)!) : 0)) > 1e-9 || Math.abs(t.stage2BestScore - (maxAvg.get(t._id) ?? 0)) > 1e-9);
      const bestAward = new Map(ranking.filter((t) => t.hasStage2Score).map((t) => [t._id as string, t.bestAward as string]));
      const badBest = [...bestAward].filter(([id, award]) => !s2.has(`${id}|${award}`) || Math.abs(avg(s2.get(`${id}|${award}`)!) - maxAvg.get(id)!) > 1e-12);
      check(`weights ${weight * 100}/${100 - weight * 100}: Stage 1 averages and best awards match the raw scores`, badRows.length === 0 && badBest.length === 0, `${badRows.length} rows, ${badBest.length} best awards`);
      const finalPct = (id: string) => ((s1.has(id) ? avg(s1.get(id)!) : 0) / 5) * 100 * weight + (maxAvg.get(id)! / 5) * 100 * (1 - weight);
      const winners = (await api('GET', '/api/winners', admin)).json.data as any[];
      const badWinners = winners.filter((w) => {
        const top = Math.max(...[...bestAward].filter(([, award]) => award === w.awardType).map(([id]) => finalPct(id)));
        return bestAward.get(w.winnerTeam._id) !== w.awardType || Math.abs(w.finalScore - finalPct(w.winnerTeam._id)) > 1e-9 || Math.abs(top - w.finalScore) > 1e-9;
      });
      check(`weights ${weight * 100}/${100 - weight * 100}: award winners match an independent recomputation`, winners.length > 0 && winners.length === new Set(bestAward.values()).size && badWinners.length === 0, badWinners.map((w) => w.awardType).join(', '));
    }

    // ---------- Special panel winners ----------
    const special = (await api('GET', '/api/winners/special', admin)).json.data as any[];
    const spWinner = special.find((p) => p.panelId === sp._id);
    check('special winners: highest average wins, with its score and judges', spWinner?.winnerTeam?.name === team('فريق عربي').name && spWinner.winnerTeam.averageScore === 4.5 && spWinner.winnerTeam.judgeCount === 1, JSON.stringify(spWinner));
    check('special winners: panel without scores has no winner', special.find((p) => p.panelId === spEmpty._id)?.winnerTeam === null);
    check('special winners: judges refused (403)', (await api('GET', '/api/winners/special', t1)).status === 403);

    // ---------- Question types: Yes/No and scale questions, custom scale, yes/no share ----------
    const round9 = (value: number) => Math.round(value * 1e12) / 1e12;
    const c0Yes = c0.questions.length;
    const typedStage1 = stage1.criteria.map((c: any, i: number) =>
      i === 0
        ? { ...c, questions: [...c.questions, 'Scale A', 'Scale B'], questionTypes: [...c.questions.map(() => 'yesno'), 'scale', 'scale'], scaleMax: 7, yesNoWeight: 0.4 }
        : c,
    );
    stagesChanged = true;
    r = await api('PUT', '/api/stages/Stage%201', admin, { criteria: typedStage1 });
    const saved0 = r.json?.criteria?.[0];
    check('types: Stage 1 criterion saved with Yes/No + scale questions, scale 1–7, 40/60 split', r.status === 200 && JSON.stringify(saved0.questionTypes) === JSON.stringify(typedStage1[0].questionTypes) && saved0.scaleMax === 7 && saved0.yesNoWeight === 0.4 && saved0._id === c0._id, `${r.status} ${JSON.stringify(saved0).slice(0, 200)}`);
    for (const [name, patch] of [
      ['unknown question type', { questionTypes: ['bogus'] }], ['scale 1–1', { scaleMax: 1 }], ['scale 1–11', { scaleMax: 11 }],
      ['yes/no share above 100%', { yesNoWeight: 1.5 }], ['negative yes/no share', { yesNoWeight: -0.1 }],
    ] as Array<[string, object]>) {
      r = await api('PUT', '/api/stages/Stage%201', admin, { criteria: typedStage1.map((c: any, i: number) => (i === 0 ? { ...c, ...patch } : c)) });
      check(`types: ${name} rejected (400)`, r.status === 400, `got ${r.status}`);
    }
    const stage1Now = (await api('GET', '/api/stages/Stage%201', t4)).json;
    check('types: rejected saves leave the criteria unchanged; judges read the types', JSON.stringify(stage1Now.criteria[0].questionTypes) === JSON.stringify(typedStage1[0].questionTypes) && stage1Now.criteria[0].scaleMax === 7);
    // Delta: j4 scores every criterion (one of its panels selects all)
    const c0Answers = [...c0.questions.map((_: any, i: number) => (i % 2 ? 0 : 1)), 7, 3];
    const typedAnswers = Object.fromEntries(typedStage1.map((c: any, i: number) => [c.name, i === 0 ? c0Answers : c.questions.map(() => 1)]));
    r = await api('POST', '/api/scores', t4, { teamId: team('Delta')._id, stage: 1, scores: typedAnswers });
    const yesShare = c0Answers.slice(0, c0Yes).reduce((a, b) => a + b, 0) / c0Yes;
    const c0Points = (c0Yes + 2) * (0.4 * yesShare + 0.6 * ((7 + 3) / (2 * 7)));
    const pointsOf = (c: any, i: number) => (i === 0 ? c0Points : c.questions.length);
    const want1 = (typedStage1.reduce((sum: number, c: any, i: number) => sum + pointsOf(c, i) * c.weight, 0) / typedStage1.reduce((sum: number, c: any) => sum + c.questions.length * c.weight, 0)) * 5;
    check('types: Stage 1 mixed criterion scored exactly (yes/no 40%, scale v/7 60%, points × weight)', r.status === 201 && Math.abs(r.json.totalScore - want1) < 1e-9 && r.json.totalScore === round9(r.json.totalScore) && Math.abs(r.json.criteriaScores[c0.name] - c0Points) < 1e-9, `${r.status} ${r.json?.totalScore} vs ${want1}`);
    for (const [name, value, index] of [['scale answer 0', 0, c0Yes], ['scale answer 8 on 1–7', 8, c0Yes], ['yes/no answer 2', 2, 0], ['fractional scale answer', 6.5, c0Yes + 1]] as Array<[string, number, number]>) {
      const answers = [...c0Answers];
      answers[index] = value;
      r = await api('POST', '/api/scores', t4, { teamId: team('Delta')._id, stage: 1, scores: { ...typedAnswers, [c0.name]: answers } });
      check(`types: Stage 1 ${name} rejected (400)`, r.status === 400, `got ${r.status}`);
    }
    r = await api('POST', '/api/scores', t4, { teamId: team('Delta')._id, stage: 1, scores: Object.fromEntries(typedStage1.map((c: any, i: number) => [c.name, i === 0 ? [...c0.questions.map(() => 1), 7, 7] : c.questions.map(() => 1)])) });
    check('types: Stage 1 top answers on every type = 5.00', r.status === 201 && r.json.totalScore === 5, `${r.json?.totalScore}`);

    const typedStage2 = stage2.criteria.map((c: any) =>
      c.name === awardA.awardType ? { ...c, questions: ['Y1', 'Y2', 'S1', 'S2', 'S3'], questionTypes: ['yesno', 'yesno', 'scale', 'scale', 'scale'], scaleMax: 10, yesNoWeight: 0.25 } : c,
    );
    r = await api('PUT', '/api/stages/Stage%202', admin, { criteria: typedStage2 });
    check('types: Stage 2 award saved with scale 1–10 and a 25/75 split', r.status === 200 && r.json.criteria.find((c: any) => c.name === awardA.awardType)?.scaleMax === 10);
    r = await api('POST', '/api/scores', t1, { teamId: team('Alpha')._id, stage: 2, panelId: awardA._id, scores: { [awardA.awardType]: [1, 0, 10, 5, 6] } });
    check('types: Stage 2 mixed award = 5 × (25% × 1/2 + 75% × 21/30) = 3.25', r.status === 201 && r.json.totalScore === 3.25, `${r.status} ${r.json?.totalScore}`);
    for (const [name, answers] of [['rating 11 on 1–10', [1, 0, 11, 5, 6]], ['yes/no answer 5', [5, 0, 10, 5, 6]], ['rating 0', [1, 0, 0, 5, 6]]] as Array<[string, number[]]>) {
      r = await api('POST', '/api/scores', t1, { teamId: team('Alpha')._id, stage: 2, panelId: awardA._id, scores: { [awardA.awardType]: answers } });
      check(`types: Stage 2 ${name} rejected (400)`, r.status === 400, `got ${r.status}`);
    }
    const bCount = answersFor(awardB.awardType, 1).length;
    const bAnswers = answersFor(awardB.awardType, 5).map((v: number, i: number) => (i === 0 ? 4 : v));
    r = await api('POST', '/api/scores', t1, { teamId: team('Alpha')._id, stage: 2, panelId: awardB._id, scores: { [awardB.awardType]: bAnswers } });
    check('types: untyped Stage 2 award is still the plain 1–5 average, rounded exactly', r.status === 201 && r.json.totalScore === round9((5 * bCount - 1) / bCount), `${r.json?.totalScore} vs ${round9((5 * bCount - 1) / bCount)}`);

    const spTyped = (await api('POST', '/api/panels', admin, { name: `${tag} Typed`, stage: 3, judges: [j1._id], teams: [team('Delta')._id], awardCriteria: [{ question: 'Works?', type: 'yesno' }, { question: 'Quality', type: 'scale' }], scaleMax: 6, yesNoWeight: 0.5 })).json;
    criteriaPanels.push(spTyped);
    const spView = (await api('GET', '/api/judges/assigned-teams', t1)).json.specialPanels.find((p: any) => p._id === spTyped._id);
    check('types: judge sees the special panel question types and scale', JSON.stringify(spView?.questions.map((q: any) => q.type)) === '["yesno","scale"]' && spView.scaleMax === 6 && spView.yesNoWeight === 0.5, JSON.stringify(spView));
    r = await api('POST', '/api/scores', t1, { teamId: team('Delta')._id, stage: 3, panelId: spTyped._id, scores: { [spTyped._id]: [1, 3] } });
    check('types: special Yes + 3 of 6 = 5 × (50% + 50% × 3/6) = 3.75', r.status === 201 && r.json.totalScore === 3.75, `${r.json?.totalScore}`);
    r = await api('POST', '/api/scores', t1, { teamId: team('Delta')._id, stage: 3, panelId: spTyped._id, scores: { [spTyped._id]: [3, 3] } });
    check('types: special yes/no answer 3 rejected (400)', r.status === 400, `got ${r.status}`);
    for (const [name, body] of [['unknown question type', { awardCriteria: [{ question: 'x', type: 'stars' }] }], ['scale 1–12', { awardCriteria: [{ question: 'x', type: 'scale' }], scaleMax: 12 }], ['yes/no share 200%', { awardCriteria: [{ question: 'x', type: 'yesno' }], yesNoWeight: 2 }]] as Array<[string, object]>) {
      r = await api('POST', '/api/panels', admin, { name: `${tag} bad ${name}`, stage: 3, judges: [], teams: [], ...body });
      if (r.json?._id) criteriaPanels.push(r.json);
      check(`types: special panel with ${name} rejected (400)`, r.status === 400, `got ${r.status}`);
    }
    const spDefault = (await api('POST', '/api/panels', admin, { name: `${tag} Default split`, stage: 3, judges: [j1._id], teams: [team('Delta')._id], awardCriteria: [{ question: 'Y', type: 'yesno' }, { question: 'S', type: 'scale' }] })).json;
    criteriaPanels.push(spDefault);
    r = await api('POST', '/api/scores', t1, { teamId: team('Delta')._id, stage: 3, panelId: spDefault._id, scores: { [spDefault._id]: [1, 1] } });
    check('types: no split set = 50/50 and scale 1–5: Yes + 1 of 5 = 3.00', r.status === 201 && r.json.totalScore === 3, `${r.json?.totalScore}`);

    // ---------- Excel export data ----------
    const exportRes = await fetch(`${BASE}/api/export`, { headers: { Authorization: `Bearer ${admin}`, 'Accept-Encoding': 'gzip' } });
    const exportData = await exportRes.json();
    check('export: sent gzip-compressed', exportRes.status === 200 && exportRes.headers.get('content-encoding') === 'gzip', `${exportRes.status} ${exportRes.headers.get('content-encoding')}`);
    const plain = await fetch(`${BASE}/api/export`, { headers: { Authorization: `Bearer ${admin}`, 'Accept-Encoding': 'identity' } });
    check('export: plain JSON when gzip is not accepted', plain.status === 200 && !plain.headers.get('content-encoding') && Array.isArray((await plain.json()).teams));
    const allTeams = (await api('GET', '/api/teams', admin)).json as any[];
    const allJudges = (await api('GET', '/api/users/judges', admin)).json as any[];
    const scoreCount = (await Promise.all(allJudges.map(async (j) => ((await api('GET', `/api/scores/judge/${j._id}`, admin)).json as any[]).length))).reduce((a, b) => a + b, 0);
    check('export: every team, judge and panel included', exportData.teams.length === allTeams.length && exportData.judges.length === allJudges.length && exportData.panels.length === ((await api('GET', '/api/panels', admin)).json as any[]).length);
    check('export: every score included with its answers', exportData.scores.length === scoreCount && exportData.scores.every((s: any) => s.team && s.judge && typeof s.totalScore === 'number' && s.scores));
    check('export: no password hashes or login data', !JSON.stringify(exportData).match(/passwordHash|failedLoginAttempts|lockUntil/));
    check('export: final ranking identical to the dashboard', JSON.stringify(exportData.finalRanking) === JSON.stringify(await final()));
    check('export: judges refused (403)', (await api('GET', '/api/export', t1)).status === 403);

    // ---------- Read endpoints stay consistent ----------
    for (const path of ['/api/scores/overview', '/api/scores/top?stage=final&limit=1000', '/api/stage2-qualification/stats', '/api/winners/award-status', '/api/winners/leaderboard', '/api/panels', '/api/teams', '/api/users/judges']) {
      const res = await api('GET', path, admin);
      check(`after all changes: ${path} OK`, res.status === 200);
    }
  } finally {
    // ---------- Cleanup ----------
    for (const [i, panel] of awardPanels.entries()) {
      await api('PUT', `/api/panels/${panel._id}`, admin, { name: panel.name, stage: 2, awardType: panel.awardType, judges: awardPanelsBefore[i].judges, teams: awardPanelsBefore[i].teams });
    }
    for (const panel of [p1, p1b, sp, spEmpty, ...criteriaPanels]) if (panel?._id) await api('DELETE', `/api/panels/${panel._id}`, admin);
    for (const judge of [j1, j2, j3, j4]) if (judge?._id) await api('DELETE', `/api/users/${judge._id}`, admin);
    if (originalWeight !== undefined) await api('PUT', '/api/stages/final-weights', admin, { stage1: originalWeight });
    if (stagesChanged) {
      await api('PUT', '/api/stages/Stage%201', admin, { criteria: stage1.criteria });
      await api('PUT', '/api/stages/Stage%202', admin, { criteria: stage2.criteria });
    }
    for (const t of teams) await api('DELETE', `/api/teams/${t._id}`, admin);
    const leftovers = ((await api('GET', '/api/teams', admin)).json as any[]).filter((t) => t.name.startsWith(tag)).length;
    const restored = (await api('GET', `/api/panels/${awardPanels[0]._id}`, admin)).json;
    check('cleanup: fixtures removed and award panels restored', leftovers === 0 && restored.judges.length === awardPanelsBefore[0].judges.length);
  }

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log(failures.map((f) => ` - ${f}`).join('\n'));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
