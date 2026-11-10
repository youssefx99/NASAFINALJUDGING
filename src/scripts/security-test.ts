// Attacks the running app and fails if any of them succeed.
// Usage: SECURITY_URL=http://localhost:3000 npm run security-test   (reads ADMIN_* and SEED_JUDGE_PASSWORD from .env)
const BASE = process.env.SECURITY_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const JUDGE_PASSWORD = process.env.SEED_JUDGE_PASSWORD || '';

let passed = 0;
const failures: string[] = [];
function check(name: string, ok: boolean, detail = '') {
  if (ok) passed++;
  else failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? ` — ${detail}` : ''}`);
}

async function request(method: string, path: string, { token, body, headers = {} }: { token?: string; body?: unknown; headers?: Record<string, string> } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json, text, headers: res.headers };
}

const b64url = (value: string) => Buffer.from(value).toString('base64url');

async function main() {
  const adminLogin = await request('POST', '/api/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  if (adminLogin.status !== 201) throw new Error(`Admin login failed (${adminLogin.status}) — set ADMIN_EMAIL / ADMIN_PASSWORD`);
  const admin = adminLogin.json.token as string;
  const adminId = String(adminLogin.json.user.id);

  const judges = (await request('GET', '/api/users/judges', { token: admin })).json as any[];
  const panels = (await request('GET', '/api/panels', { token: admin })).json as any[];
  const teams = (await request('GET', '/api/teams', { token: admin })).json as any[];
  const judge = judges.find((j) => panels.some((p) => p.stage === 1 && p.judges.some((x: any) => x._id === j._id)))!;
  const otherJudge = judges.find((j) => j._id !== judge._id)!;
  const judgeLogin = await request('POST', '/api/auth/login', { body: { email: judge.email, password: JUDGE_PASSWORD } });
  if (judgeLogin.status !== 201) throw new Error('Judge login failed — set SEED_JUDGE_PASSWORD');
  const judgeToken = judgeLogin.json.token as string;
  const judgePanels = panels.filter((p) => p.judges.some((x: any) => x._id === judge._id));
  const assignedTeamIds = new Set(judgePanels.flatMap((p) => p.teams.map((t: any) => t._id)));
  const stage1Team = judgePanels.find((p) => p.stage === 1)!.teams[0]._id;
  const unassignedTeam = teams.find((t) => !assignedTeamIds.has(t._id))!._id;
  const panelId = panels[0]._id;
  const anyTeam = teams[0]._id;

  const adminRoutes: Array<[string, string, unknown?]> = [
    ['GET', '/api/teams'], ['GET', '/api/teams/count'], ['POST', '/api/teams/import', { rows: [{ team_name: 'x', challenge: 'y' }] }],
    ['DELETE', `/api/teams/${anyTeam}`], ['DELETE', '/api/teams'],
    ['GET', '/api/users/judges'], ['GET', `/api/users/${otherJudge._id}`], ['POST', '/api/users', { name: 'x', email: 'x@x.x', password: 'xxxxxxxxxx' }],
    ['PUT', `/api/users/${otherJudge._id}`, { name: 'hacked' }], ['DELETE', `/api/users/${otherJudge._id}`],
    ['GET', '/api/panels'], ['GET', `/api/panels/${panelId}`], ['POST', '/api/panels', { name: 'x', stage: 1 }], ['PUT', `/api/panels/${panelId}`, { name: 'x' }],
    ['DELETE', `/api/panels/${panelId}`], ['POST', '/api/panels/stage2/initialize'],
    ['GET', '/api/scores/overview'], ['GET', '/api/scores/top?stage=1&limit=10'], ['GET', `/api/scores/team/${anyTeam}/stage/1`], ['GET', `/api/scores/judge/${otherJudge._id}`],
    ['PUT', '/api/stages/Stage%201', { criteria: [] }],
    ['GET', '/api/stage2-qualification/stats'], ['GET', '/api/stage2-qualification/incomplete-judges'], ['GET', '/api/stage2-qualification/top-teams'], ['POST', '/api/stage2-qualification/qualify', { limit: 60 }],
    ['GET', '/api/winners'], ['GET', '/api/winners/by-award'], ['GET', '/api/winners/leaderboard'], ['GET', '/api/winners/summary'], ['GET', '/api/winners/award-status'], ['GET', '/api/winners/ranked-teams'],
    ['GET', `/api/winners/award/Best%20Use%20of%20Science/team/${anyTeam}/breakdown`],
    ['POST', '/api/judges/upload-csv'],
  ];
  const judgeRoutes: Array<[string, string, unknown?]> = [
    ['GET', '/api/judges/assigned-teams'], ['GET', '/api/stages/Stage%201'], ['GET', '/api/stages'], ['GET', `/api/teams/${stage1Team}`],
    ['GET', `/api/scores/judge/${judge._id}/team/${stage1Team}/stage/1`], ['POST', '/api/scores', { teamId: stage1Team, stage: 1, scores: {} }],
    ['POST', '/api/auth/change-password', { currentPassword: 'a', newPassword: 'b', confirmPassword: 'b' }],
  ];

  console.log(`Security test against ${BASE}\n`);

  // 1. No token / forged tokens
  for (const [method, path, body] of [...adminRoutes, ...judgeRoutes]) {
    const res = await request(method, path, { body });
    check(`no token → 401: ${method} ${path}`, res.status === 401, `got ${res.status}`);
  }
  const legacyToken = Buffer.from(`${adminId}:${Date.now()}`).toString('base64');
  const noneToken = `${b64url('{"alg":"none","typ":"JWT"}')}.${b64url(JSON.stringify({ sub: adminId, role: 'admin', iat: Math.floor(Date.now() / 1000) }))}.`;
  const [header, , signature] = judgeToken.split('.');
  const tamperedToken = `${header}.${b64url(JSON.stringify({ sub: adminId, role: 'admin', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 }))}.${signature}`;
  for (const [name, token] of [['old base64 userId:timestamp token', legacyToken], ['alg:none JWT', noneToken], ['JWT with forged payload (judge → admin)', tamperedToken], ['garbage token', 'abc.def.ghi']]) {
    const res = await request('GET', '/api/users/judges', { token });
    check(`${name} → 401`, res.status === 401, `got ${res.status}`);
  }

  // 2. Judge cannot use admin endpoints or other judges' data
  for (const [method, path, body] of adminRoutes) {
    const res = await request(method, path, { token: judgeToken, body });
    check(`judge → 403: ${method} ${path}`, res.status === 403, `got ${res.status}`);
  }
  check('judge reads own score', (await request('GET', `/api/scores/judge/${judge._id}/team/${stage1Team}/stage/1`, { token: judgeToken })).status === 200);
  check('judge cannot read another judge’s score', (await request('GET', `/api/scores/judge/${otherJudge._id}/team/${stage1Team}/stage/1`, { token: judgeToken })).status === 403);
  check('judge reads assigned team', (await request('GET', `/api/teams/${stage1Team}`, { token: judgeToken })).status === 200);
  check('judge cannot read unassigned team', (await request('GET', `/api/teams/${unassignedTeam}`, { token: judgeToken })).status === 403);

  // 3. Score tampering
  const stage1 = (await request('GET', '/api/stages/Stage%201', { token: judgeToken })).json;
  const allNo: Record<string, number[]> = Object.fromEntries(stage1.criteria.map((c: any) => [c.name, c.questions.map(() => 0)]));
  const tampered = await request('POST', '/api/scores', { token: judgeToken, body: { teamId: stage1Team, stage: 1, scores: allNo, totalScore: 999, criteriaScores: { Innovation: 999 } } });
  check('client totalScore ignored (all "No" answers + totalScore 999 → stored 0)', tampered.status === 201 && tampered.json.totalScore === 0, `status ${tampered.status} total ${tampered.json?.totalScore}`);
  check('score for unassigned team rejected', (await request('POST', '/api/scores', { token: judgeToken, body: { teamId: unassignedTeam, stage: 1, scores: allNo } })).status === 403);
  const badValue = Object.fromEntries(Object.entries(allNo).map(([k, v]) => [k, v.map(() => 7)]));
  check('out-of-range answers rejected', (await request('POST', '/api/scores', { token: judgeToken, body: { teamId: stage1Team, stage: 1, scores: badValue } })).status === 400);
  check('missing answers rejected', (await request('POST', '/api/scores', { token: judgeToken, body: { teamId: stage1Team, stage: 1, scores: {} } })).status === 400);
  check('admin cannot submit scores', (await request('POST', '/api/scores', { token: admin, body: { teamId: stage1Team, stage: 1, scores: allNo } })).status === 403);

  // 4. Injection
  const injectedLogin = await request('POST', '/api/auth/login', { body: { email: { $ne: null }, password: { $ne: null } } });
  check('NoSQL operator login rejected', injectedLogin.status === 400 || injectedLogin.status === 401, `got ${injectedLogin.status}`);
  check('NoSQL operator in score teamId rejected', (await request('POST', '/api/scores', { token: judgeToken, body: { teamId: { $ne: null }, stage: 1, scores: allNo } })).status === 400);
  check('NoSQL operator in query string rejected', (await request('GET', '/api/stage2-qualification/top-teams?limit[$gt]=1', { token: admin })).status === 400);
  check('__proto__ pollution payload rejected', (await request('POST', '/api/scores', { token: judgeToken, body: '{"__proto__":{"role":"admin"},"teamId":"x","stage":1}' })).status === 400);
  check('default admin@test.com / 1234 login fails', (await request('POST', '/api/auth/login', { body: { email: 'admin@test.com', password: '1234' } })).status === 401);

  // 5. Account takeover protections (on a throwaway judge)
  const tempEmail = `security-test-${Date.now()}@example.com`;
  const tempPassword = `Tmp-${Date.now()}-pass`;
  const created = await request('POST', '/api/users', { token: admin, body: { name: 'Security Test', email: tempEmail, password: tempPassword, role: 'admin', panelAssignments: [] } });
  check('created account cannot be given admin role', created.status === 201 && created.json.role === 'judge', `status ${created.status} role ${created.json?.role}`);
  check('created account response has no passwordHash', created.status === 201 && !('passwordHash' in (created.json || {})));
  const tempId = created.json?._id;
  const weak = await request('POST', '/api/users', { token: admin, body: { name: 'Weak', email: `weak-${Date.now()}@example.com`, password: '123', panelAssignments: [] } });
  check('weak password (<8 chars) rejected on create', weak.status === 400, `got ${weak.status}`);
  const escalate = await request('PUT', `/api/users/${tempId}`, { token: admin, body: { role: 'admin', passwordHash: 'x', panelAssignments: [] } });
  const afterEscalate = await request('GET', `/api/users/${tempId}`, { token: admin });
  check('mass assignment of role/passwordHash ignored', escalate.status === 200 && afterEscalate.json.role === 'judge');

  const sessionA = (await request('POST', '/api/auth/login', { body: { email: tempEmail, password: tempPassword } })).json.token;
  const newPassword = `${tempPassword}-new`;
  const changed = await request('POST', '/api/auth/change-password', { token: sessionA, body: { currentPassword: tempPassword, newPassword, confirmPassword: newPassword } });
  await new Promise((resolve) => setTimeout(resolve, 1100));
  check('password change returns a new session', changed.status === 201 && !!changed.json.token);
  check('old session revoked after password change', (await request('GET', '/api/judges/assigned-teams', { token: sessionA })).status === 401);
  check('new session works', (await request('GET', '/api/judges/assigned-teams', { token: changed.json.token })).status === 200);

  let lastStatus = 0;
  for (let i = 0; i < 10; i++) {
    lastStatus = (await request('POST', '/api/auth/login', { body: { email: tempEmail, password: 'wrong-password' } })).status;
  }
  const lockedOut = await request('POST', '/api/auth/login', { body: { email: tempEmail, password: newPassword } });
  check('brute force: account locked after 10 wrong passwords (even correct password refused)', lastStatus === 401 && lockedOut.status === 429, `last ${lastStatus}, then ${lockedOut.status}`);
  await request('DELETE', `/api/users/${tempId}`, { token: admin });

  // 6. Data exposure
  const adminGets = adminRoutes.filter(([method]) => method === 'GET').map(([, path]) => path);
  let leaked = '';
  for (const path of [...adminGets, '/api/judges/assigned-teams']) {
    const res = await request('GET', path, { token: path.startsWith('/api/judges') ? judgeToken : admin });
    if (/passwordHash|failedLoginAttempts|lockUntil|\$2[aby]\$/.test(res.text)) leaked += ` ${path}`;
  }
  check('no password hashes or lockout fields in any response', !leaked, leaked);
  check('login response contains no password hash', !/passwordHash|\$2[aby]\$/.test(adminLogin.text));

  // 7. Transport / browser protections
  for (const path of ['/', '/api/auth/login']) {
    const res = await request(path === '/' ? 'GET' : 'POST', path, { body: path === '/' ? undefined : {}, headers: { Origin: 'https://evil.example' } });
    const h = res.headers;
    check(`security headers on ${path}`, !!h.get('content-security-policy')?.includes("frame-ancestors 'none'") && h.get('x-frame-options') === 'DENY' && h.get('x-content-type-options') === 'nosniff', [...h.keys()].join(','));
    check(`no X-Powered-By on ${path}`, !h.get('x-powered-by'));
    check(`no CORS for foreign origins on ${path}`, !h.get('access-control-allow-origin'));
  }
  const apiRes = await request('GET', '/api/judges/assigned-teams', { token: judgeToken });
  check('API responses are not cacheable', (apiRes.headers.get('cache-control') || '').includes('no-store'));

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
