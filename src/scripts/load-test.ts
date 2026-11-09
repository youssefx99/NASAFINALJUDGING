// Load test: many judges scoring at the same time while admins watch the dashboards.
// Usage: LOAD_URL=http://localhost:3000 LOAD_JUDGES=100 LOAD_ADMINS=5 LOAD_DURATION_S=120 npm run load-test
const BASE = process.env.LOAD_URL || 'http://localhost:3000';
const JUDGES = Number(process.env.LOAD_JUDGES || 100);
const ADMINS = Number(process.env.LOAD_ADMINS || 5);
const DURATION_MS = Number(process.env.LOAD_DURATION_S || 120) * 1000;
const THINK_MS = Number(process.env.LOAD_THINK_MS || 0);
const IMPORT_ROWS = Number(process.env.LOAD_IMPORT_ROWS || 0);
const JUDGE_PASSWORD = process.env.LOAD_JUDGE_PASSWORD || 'judge123';

type Stat = { latencies: number[]; server: number[]; errors: number; errorSamples: string[] };
const stats = new Map<string, Stat>();
let totalRequests = 0;

function record(label: string, ms: number, server: number | null, error?: string) {
  let stat = stats.get(label);
  if (!stat) {
    stat = { latencies: [], server: [], errors: 0, errorSamples: [] };
    stats.set(label, stat);
  }
  totalRequests++;
  stat.latencies.push(ms);
  if (server !== null) stat.server.push(server);
  if (error) {
    stat.errors++;
    if (stat.errorSamples.length < 5) stat.errorSamples.push(error);
  }
}

async function call(label: string, path: string, token?: string, body?: unknown, method = body ? 'POST' : 'GET') {
  const start = performance.now();
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    const timing = /dur=([\d.]+)/.exec(res.headers.get('server-timing') || '');
    const ms = performance.now() - start;
    if (!res.ok) {
      record(label, ms, timing ? Number(timing[1]) : null, `${res.status} ${text.slice(0, 160)}`);
      return null;
    }
    record(label, ms, timing ? Number(timing[1]) : null);
    return text ? JSON.parse(text) : null;
  } catch (error: any) {
    record(label, performance.now() - start, null, `network: ${error.cause?.code || error.message}`);
    return null;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const pick = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)];

async function judgeLoop(email: string, deadline: number) {
  const login = await call('POST /api/auth/login', '/api/auth/login', undefined, { email, password: JUDGE_PASSWORD });
  if (!login) return;
  const token = login.token;
  const judgeId = login.user.id;
  while (Date.now() < deadline) {
    const assigned = await call('GET /api/judges/assigned-teams', '/api/judges/assigned-teams', token);
    if (!assigned) {
      await sleep(500);
      continue;
    }
    const stage = assigned.stage2Teams.length && Math.random() < 0.3 ? 2 : 1;
    const team = pick(stage === 1 ? assigned.stage1Teams : assigned.stage2Teams) as any;
    if (!team) {
      await sleep(1000);
      continue;
    }
    // Scoring page loads these in parallel
    const [criteria] = await Promise.all([
      call(`GET /api/stages/Stage ${stage}`, `/api/stages/Stage%20${stage}`, token),
      call('GET /api/teams/:id', `/api/teams/${team._id}`, token),
      call('GET /api/judges/assigned-teams', '/api/judges/assigned-teams', token),
      call('GET /api/scores/judge/:id/team/:id/stage/:n', `/api/scores/judge/${judgeId}/team/${team._id}/stage/${stage}`, token),
    ]);
    if (THINK_MS) await sleep(THINK_MS);
    if (stage === 1 && criteria) {
      const scores: Record<string, number[]> = {};
      const criteriaScores: Record<string, number> = {};
      let total = 0;
      let max = 0;
      for (const c of criteria.criteria) {
        scores[c.name] = c.questions.map(() => (Math.random() < 0.6 ? 1 : 0));
        criteriaScores[c.name] = scores[c.name].reduce((a, b) => a + b, 0);
        total += criteriaScores[c.name] * c.weight;
        max += c.questions.length * c.weight;
      }
      await call('POST /api/scores', '/api/scores', token, { teamId: team._id, stage: 1, scores, criteriaScores, totalScore: max ? (total / max) * 5 : 0 });
    } else if (stage === 2) {
      const values = [0, 1, 2].map(() => 1 + Math.floor(Math.random() * 5));
      await call('POST /api/scores', '/api/scores', token, {
        teamId: team._id,
        stage: 2,
        scores: { [assigned.stage2AwardType]: values },
        totalScore: values.reduce((a, b) => a + b, 0) / values.length,
        awardType: assigned.stage2AwardType,
      });
    }
    if (THINK_MS) await sleep(THINK_MS);
  }
}

async function adminLoop(token: string, deadline: number) {
  const pages: Array<Array<[string, string]>> = [
    [['GET /api/teams', '/api/teams'], ['GET /api/panels', '/api/panels']],
    [['GET /api/panels', '/api/panels'], ['GET /api/users/judges', '/api/users/judges'], ['GET /api/teams', '/api/teams']],
    [['GET /api/stage2-qualification/stats', '/api/stage2-qualification/stats'], ['GET /api/stage2-qualification/top-teams', '/api/stage2-qualification/top-teams?limit=60']],
    [['GET /api/winners/award-status', '/api/winners/award-status']],
    [['GET /api/winners/leaderboard', '/api/winners/leaderboard?finalists=4']],
    [['GET /api/scores/top?stage=final&limit=1000', '/api/scores/top?stage=final&limit=1000']],
  ];
  while (Date.now() < deadline) {
    await Promise.all([
      call('GET /api/teams/count', '/api/teams/count', token),
      call('GET /api/users/judges', '/api/users/judges', token),
      call('GET /api/scores/overview', '/api/scores/overview', token),
      call('GET /api/scores/top?stage=final&limit=10', '/api/scores/top?stage=final&limit=10', token),
    ]);
    await Promise.all(pick(pages).map(([label, path]) => call(label, path, token)));
    await sleep(THINK_MS || 1000);
  }
}

const percentile = (sorted: number[], p: number) =>
  sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] : NaN;

async function main() {
  const admin = await call('POST /api/auth/login', '/api/auth/login', undefined, {
    email: process.env.LOAD_ADMIN_EMAIL || 'admin@test.com',
    password: process.env.LOAD_ADMIN_PASSWORD || '1234',
  });
  if (!admin) throw new Error('Admin login failed');
  const judges: any[] = (await call('GET /api/users/judges', '/api/users/judges', admin.token)) || [];
  const teamCount = (await call('GET /api/teams/count', '/api/teams/count', admin.token))?.count;
  console.log(`Load test ${BASE}: ${teamCount} teams, ${judges.length} judge accounts → ${JUDGES} concurrent judges + ${ADMINS} admins for ${DURATION_MS / 1000}s (think time ${THINK_MS}ms)\n`);

  if (IMPORT_ROWS) {
    const teams: any[] = (await call('GET /api/teams', '/api/teams', admin.token)) || [];
    const rows = teams.slice(0, IMPORT_ROWS).map((t) => ({ team_name: t.name, challenge: t.challenge, panel_number: t.panelNumber, actualSolution: t.actualSolution }));
    const start = performance.now();
    for (let i = 0; i < rows.length; i += 250) {
      await call('POST /api/teams/import', '/api/teams/import', admin.token, { rows: rows.slice(i, i + 250) });
    }
    console.log(`Imported ${rows.length} rows (Excel import path, 250-row batches) in ${((performance.now() - start) / 1000).toFixed(1)}s\n`);
  }

  const deadline = Date.now() + DURATION_MS;
  const started = performance.now();
  await Promise.all([
    ...Array.from({ length: JUDGES }, (_, i) => judgeLoop(judges[i % judges.length].email, deadline)),
    ...Array.from({ length: ADMINS }, () => adminLoop(admin.token, deadline)),
  ]);
  const seconds = (performance.now() - started) / 1000;

  let errors = 0;
  const rows = [...stats.entries()].sort((a, b) => b[1].latencies.length - a[1].latencies.length);
  console.log('requests   errors    p50     p95     p99     max   server p95  endpoint');
  for (const [label, stat] of rows) {
    const sorted = [...stat.latencies].sort((a, b) => a - b);
    const server = [...stat.server].sort((a, b) => a - b);
    errors += stat.errors;
    console.log(
      `${String(stat.latencies.length).padStart(8)} ${String(stat.errors).padStart(8)} ${[50, 95, 99].map((p) => percentile(sorted, p).toFixed(0).padStart(6)).join(' ')}  ${sorted[sorted.length - 1].toFixed(0).padStart(6)}  ${percentile(server, 95).toFixed(1).padStart(9)}  ${label}`,
    );
    stat.errorSamples.forEach((sample) => console.log(`         ↳ ${sample}`));
  }
  console.log(`\n${totalRequests} requests in ${seconds.toFixed(1)}s (${(totalRequests / seconds).toFixed(0)} req/s), ${errors} errors (${((errors / totalRequests) * 100).toFixed(3)}%)`);
  process.exit(errors === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
