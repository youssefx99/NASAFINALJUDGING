// Times every write endpoint (POST / PUT / DELETE) with throwaway data and cleans up after itself.
// Usage: BENCH_URL=http://localhost:3000 npm run benchmark:writes   (reads ADMIN_* and SEED_JUDGE_PASSWORD from .env)
// Uses only its own throwaway teams, judges and panels. BENCH_DESTRUCTIVE=1 also times qualification,
// criteria saves and "delete all teams", which change real data — local test databases only.
const BASE = process.env.BENCH_URL || 'http://localhost:3000';
const RUNS = Number(process.env.BENCH_RUNS || 5);

type Result = { status: number; json: any; ms: number; server: number };
async function call(method: string, path: string, token?: string, body?: unknown): Promise<Result> {
  const start = performance.now();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const ms = performance.now() - start;
  const timing = /dur=([\d.]+)/.exec(res.headers.get('server-timing') || '');
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text.slice(0, 200)}`);
  return { status: res.status, json: text ? JSON.parse(text) : null, ms, server: timing ? Number(timing[1]) : NaN };
}

const rows: Array<{ label: string; server: number; total: number; note: string }> = [];
async function measure(label: string, run: (i: number) => Promise<Result>, note = '') {
  const server: number[] = [];
  const total: number[] = [];
  for (let i = 0; i < RUNS; i++) {
    const r = await run(i);
    server.push(r.server);
    total.push(r.ms);
  }
  const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
  rows.push({ label, server: median(server), total: median(total), note });
}

async function main() {
  const admin = (await call('POST', '/api/auth/login', undefined, { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD })).json.token;
  const [stage1, stage2] = await Promise.all([call('GET', '/api/stages/Stage%201', admin), call('GET', '/api/stages/Stage%202', admin)]).then((results) => results.map((r) => r.json));
  const tag = Date.now();
  // Throwaway fixtures: 30 teams, 3 judges, one Stage 1 panel
  await call('POST', '/api/teams/import', admin, { rows: Array.from({ length: 30 }, (_, i) => ({ team_name: `Bench Fixture ${tag}-${i}`, challenge: 'Benchmark' })) });
  const fixtureTeams = (await call('GET', '/api/teams', admin)).json.filter((t: any) => t.name.startsWith(`Bench Fixture ${tag}-`));
  const teamIds = fixtureTeams.slice(0, 25).map((t: any) => t._id);
  const fixtureJudges: any[] = [];
  for (let i = 0; i < 3; i++) {
    fixtureJudges.push((await call('POST', '/api/users', admin, { name: `Bench Fixture Judge ${i}`, email: `bench-fixture-${tag}-${i}@example.com`, password: `bench-pass-${tag}`, panelAssignments: [] })).json);
  }
  const judgeIds = fixtureJudges.map((j) => j._id);
  const judge = fixtureJudges[0];
  const judgePanel = (await call('POST', '/api/panels', admin, { name: `Bench Fixture Panel ${tag}`, stage: 1, judges: judgeIds, teams: teamIds })).json;
  judgePanel.teams = teamIds.map((_id: string) => ({ _id }));
  const otherPanel = (await call('POST', '/api/panels', admin, { name: `Bench Fixture Panel B ${tag}`, stage: 1, judges: [], teams: [] })).json;
  const judgeToken = (await call('POST', '/api/auth/login', undefined, { email: judge.email, password: `bench-pass-${tag}` })).json.token;

  await measure('POST /api/auth/login', () => call('POST', '/api/auth/login', undefined, { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }), 'bcrypt (intentionally ~50-80ms)');

  const answers = Object.fromEntries(stage1.criteria.map((c: any) => [c.name, c.questions.map(() => 1)]));
  await measure('POST /api/scores (stage 1)', (i) => call('POST', '/api/scores', judgeToken, { teamId: judgePanel.teams[i % judgePanel.teams.length]._id, stage: 1, scores: answers }));

  const rows250 = Array.from({ length: 250 }, (_, i) => ({ team_name: `Bench Team ${tag}-${i}`, challenge: 'Benchmark' }));
  await measure('POST /api/teams/import (250 rows)', () => call('POST', '/api/teams/import', admin, { rows: rows250 }));
  const benchTeams = (await call('GET', '/api/teams', admin)).json.filter((t: any) => t.name.startsWith(`Bench Team ${tag}-`));
  await measure('DELETE /api/teams/:id', (i) => call('DELETE', `/api/teams/${benchTeams[i]._id}`, admin));
  for (const team of benchTeams.slice(RUNS)) await call('DELETE', `/api/teams/${team._id}`, admin);

  const createdUsers: string[] = [];
  await measure('POST /api/users (create judge)', async (i) => {
    const r = await call('POST', '/api/users', admin, { name: `Bench Judge ${i}`, email: `bench-${tag}-${i}@example.com`, password: `bench-pass-${tag}`, panelAssignments: [{ stage: 1, panel: otherPanel._id }] });
    createdUsers.push(r.json._id);
    return r;
  }, 'bcrypt hash');
  await measure('PUT /api/users/:id (edit judge + panels)', (i) => call('PUT', `/api/users/${createdUsers[i]}`, admin, { name: `Bench Judge ${i} edited`, email: `bench-${tag}-${i}@example.com`, panelAssignments: [{ stage: 1, panel: judgePanel._id }, { stage: 1, panel: otherPanel._id }] }));
  const pwUser = createdUsers[0];
  const pwToken = (await call('POST', '/api/auth/login', undefined, { email: `bench-${tag}-0@example.com`, password: `bench-pass-${tag}` })).json.token;
  let currentPassword = `bench-pass-${tag}`;
  let currentToken = pwToken;
  await measure('POST /api/auth/change-password', async (i) => {
    const next = `bench-pass-${tag}-${i}`;
    const r = await call('POST', '/api/auth/change-password', currentToken, { currentPassword, newPassword: next, confirmPassword: next });
    currentPassword = next;
    currentToken = r.json.token;
    return r;
  }, 'bcrypt verify + hash');
  await measure('DELETE /api/users/:id', (i) => call('DELETE', `/api/users/${createdUsers[i]}`, admin));
  void pwUser;

  const csv = 'Title,Name,Last time judged in NSAC,Email,LinkedIn,Phone,Judging Area,Reached Out by Call,Response Status,Confirmed,Filled the Form\n' +
    Array.from({ length: 10 }, (_, i) => `Dr,Bench Csv ${tag} ${i},2024,x@y.z,,,AI,Yes,Yes,Yes,Yes`).join('\n');
  await measure('POST /api/judges/upload-csv (10 judges)', async (i) => {
    const form = new FormData();
    form.append('csvFile', new Blob([csv.replace(/Bench Csv/g, `Bench Csv r${i}`)], { type: 'text/csv' }), 'judges.csv');
    return call('POST', '/api/judges/upload-csv', admin, form);
  }, 'bcrypt hash x10 in parallel');
  for (const user of (await call('GET', '/api/users/judges', admin)).json.filter((j: any) => j.name.includes(`Bench Csv`))) {
    await call('DELETE', `/api/users/${user._id}`, admin);
  }

  const createdPanels: string[] = [];
  await measure('POST /api/panels (stage 1, 3 judges, 25 teams)', async (i) => {
    const r = await call('POST', '/api/panels', admin, { name: `Bench Panel ${tag}-${i}`, stage: 1, judges: judgeIds, teams: teamIds });
    createdPanels.push(r.json._id);
    return r;
  });
  await measure('PUT /api/panels/:id', (i) => call('PUT', `/api/panels/${createdPanels[i]}`, admin, { name: `Bench Panel ${tag}-${i}`, stage: 1, judges: judgeIds.slice(0, 2), teams: teamIds.slice(0, 20) }));
  await measure('DELETE /api/panels/:id', (i) => call('DELETE', `/api/panels/${createdPanels[i]}`, admin));

  const specialPanels: string[] = [];
  await measure('POST /api/panels (special panel)', async (i) => {
    const r = await call('POST', '/api/panels', admin, { name: `Bench Special ${tag}-${i}`, stage: 3, judges: [judge._id], teams: teamIds.slice(0, 10), awardCriteria: [{ question: 'Q1' }, { question: 'Q2' }] });
    specialPanels.push(r.json._id);
    return r;
  });
  await measure('POST /api/scores (special panel)', (i) => call('POST', '/api/scores', judgeToken, { teamId: teamIds[i], stage: 3, panelId: specialPanels[0], scores: { [specialPanels[0]]: [4, 5] } }));
  await measure('PUT /api/panels/:id (special)', (i) => call('PUT', `/api/panels/${specialPanels[i]}`, admin, { name: `Bench Special ${tag}-${i}`, stage: 3, judges: [judge._id], teams: teamIds.slice(0, 12), awardCriteria: [{ question: 'Q1' }, { question: 'Q2' }, { question: 'Q3' }] }));
  await measure('DELETE /api/panels/:id (special + its scores)', (i) => call('DELETE', `/api/panels/${specialPanels[i]}`, admin));

  await measure('POST /api/panels/stage2/initialize', () => call('POST', '/api/panels/stage2/initialize', admin));

  for (const team of fixtureTeams) await call('DELETE', `/api/teams/${team._id}`, admin);
  for (const fixture of fixtureJudges) await call('DELETE', `/api/users/${fixture._id}`, admin);
  for (const panel of [judgePanel, otherPanel]) await call('DELETE', `/api/panels/${panel._id}`, admin);

  if (process.env.BENCH_DESTRUCTIVE === '1') {
    await measure('PUT /api/stages/Stage 1 (criteria)', () => call('PUT', '/api/stages/Stage%201', admin, { criteria: stage1.criteria, timerMinutes: stage1.timerMinutes }));
    await measure('PUT /api/stages/Stage 2 (criteria)', () => call('PUT', '/api/stages/Stage%202', admin, { criteria: stage2.criteria, timerMinutes: stage2.timerMinutes }));
    await measure('POST /api/stage2-qualification/qualify (60)', () => call('POST', '/api/stage2-qualification/qualify', admin, { limit: 60 }));
    await measure('DELETE /api/teams (delete ALL teams)', async () => call('DELETE', '/api/teams', admin));
  }

  console.log(`Write benchmark ${BASE} — median of ${RUNS} runs\n`);
  console.log('  server     total   endpoint');
  for (const row of rows) {
    console.log(`${row.server.toFixed(1).padStart(7)}ms ${row.total.toFixed(1).padStart(8)}ms   ${row.label}${row.note ? `  (${row.note})` : ''}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
