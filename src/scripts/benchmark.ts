const BASE = process.env.BENCH_URL || 'http://localhost:3000';
const RUNS = Number(process.env.BENCH_RUNS || 5);
const LIMIT_MS = Number(process.env.BENCH_LIMIT_MS || 50);

async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed for ${email}: ${res.status}`);
  return (await res.json()).token;
}

async function get(path: string, token: string) {
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await res.text();
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${body.slice(0, 200)}`);
  return body ? JSON.parse(body) : null;
}

async function time(path: string, token: string) {
  const samples: number[] = [];
  let size = 0;
  for (let i = 0; i < RUNS; i++) {
    const start = performance.now();
    const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    const body = await res.arrayBuffer();
    samples.push(performance.now() - start);
    if (!res.ok) throw new Error(`${path} -> ${res.status}`);
    size = body.byteLength;
  }
  samples.sort((a, b) => a - b);
  return { median: samples[Math.floor(samples.length / 2)], max: samples[samples.length - 1], size };
}

async function main() {
  const admin = await login(process.env.BENCH_ADMIN_EMAIL || 'admin@test.com', process.env.BENCH_ADMIN_PASSWORD || '1234');
  const teams = await get('/api/teams', admin);
  const judges = await get('/api/users/judges', admin);
  const panels = await get('/api/panels', admin);
  const team = teams[0];
  const judge = judges[0];
  const panel = panels.find((p: any) => p.stage === 1) || panels[0];
  const judgeToken = await login(judge.email, process.env.BENCH_JUDGE_PASSWORD || 'judge123');
  const award = encodeURIComponent('Best Use of Science');

  const adminPaths = [
    '/api/teams/count',
    '/api/teams',
    `/api/teams/${team._id}`,
    '/api/users/judges',
    `/api/users/${judge._id}`,
    '/api/panels',
    `/api/panels/${panel._id}`,
    '/api/scores/overview',
    '/api/scores/top?stage=1&limit=10',
    '/api/scores/top?stage=2&limit=10',
    '/api/scores/top?stage=final&limit=10',
    '/api/scores/top?stage=final&limit=1000',
    `/api/scores/team/${team._id}/stage/1`,
    `/api/scores/team/${team._id}/stage/2`,
    `/api/scores/judge/${judge._id}`,
    `/api/scores/judge/${judge._id}/team/${team._id}/stage/1`,
    '/api/stages',
    '/api/stages/Stage%201',
    '/api/stages/Stage%202',
    `/api/stages/award/${award}`,
    '/api/stage2-qualification/stats',
    '/api/stage2-qualification/incomplete-judges?page=1&limit=10',
    '/api/stage2-qualification/top-teams?limit=60',
    '/api/winners',
    '/api/winners/by-award',
    '/api/winners/summary',
    '/api/winners/award-status',
    '/api/winners/ranked-teams?limit=10',
    `/api/winners/award/${award}/team/${team._id}/breakdown`,
  ];
  const judgePaths = ['/api/judges/assigned-teams'];

  console.log(`Benchmark ${BASE} — ${teams.length} teams, ${judges.length} judges, ${panels.length} panels — median of ${RUNS} runs\n`);
  let failures = 0;
  const rows: Array<[string, string, number, number, number]> = [];
  for (const [who, token, paths] of [['admin', admin, adminPaths], ['judge', judgeToken, judgePaths]] as const) {
    for (const path of paths) {
      const r = await time(path, token);
      rows.push([who, path, r.median, r.max, r.size]);
      if (r.median > LIMIT_MS) failures++;
    }
  }
  for (const [who, path, median, max, size] of rows) {
    const flag = median > LIMIT_MS ? 'SLOW' : 'ok  ';
    console.log(`${flag} ${median.toFixed(1).padStart(8)}ms  (max ${max.toFixed(1).padStart(8)}ms) ${(size / 1024).toFixed(1).padStart(8)}KB  [${who}] ${path}`);
  }
  console.log(`\n${failures === 0 ? 'ALL ENDPOINTS' : `${failures} ENDPOINT(S) NOT`} under ${LIMIT_MS}ms`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
