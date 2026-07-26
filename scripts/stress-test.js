import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// ─── Configuration ────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'https://guesthousewithpolicemodule.vercel.app';
const TEST_USER = __ENV.TEST_USER || 'police';
const TEST_PASS = __ENV.TEST_PASS || '123';
const SCENARIO = __ENV.SCENARIO || 'all'; // all | auth | list | export | freq

// ─── Custom metrics ───────────────────────────────────────────────────────
const loginErrors = new Counter('login_errors');
const listErrors = new Counter('list_errors');
const exportErrors = new Counter('export_errors');
const freqErrors = new Counter('freq_errors');
const loginLatency = new Trend('login_latency', true);
const listLatency = new Trend('list_latency', true);
const exportLatency = new Trend('export_latency', true);
const freqLatency = new Trend('freq_latency', true);

// ─── Test options ─────────────────────────────────────────────────────────
export const options = {
  scenarios: {
    // ── Scenario 1: Login + auth flow ──
    auth: {
      executor: 'ramping-vus',
      exec: 'authScenario',
      startTime: '0s',
      stages: [
        { duration: '5s', target: 20 },   // ramp to 20 VUs
        { duration: '20s', target: 50 },  // hold at 50 VUs (medium target)
        { duration: '5s', target: 0 },    // ramp down
      ],
      gracefulStop: '5s',
    },
    // ── Scenario 2: List endpoints (pagination) ──
    list: {
      executor: 'ramping-vus',
      exec: 'listScenario',
      startTime: '35s',  // starts after auth finishes
      stages: [
        { duration: '5s', target: 20 },
        { duration: '20s', target: 50 },
        { duration: '5s', target: 0 },
      ],
      gracefulStop: '5s',
    },
    // ── Scenario 3: Export endpoints (streaming) ──
    export: {
      executor: 'ramping-vus',
      exec: 'exportScenario',
      startTime: '70s',
      stages: [
        { duration: '5s', target: 10 },  // fewer VUs — exports are heavier
        { duration: '20s', target: 20 },
        { duration: '5s', target: 0 },
      ],
      gracefulStop: '5s',
    },
    // ── Scenario 4: Frequent-stays analysis (Phase 1.7 SQL) ──
    freq: {
      executor: 'ramping-vus',
      exec: 'freqScenario',
      startTime: '105s',
      stages: [
        { duration: '5s', target: 10 },  // POST endpoint, expensive
        { duration: '20s', target: 20 },
        { duration: '5s', target: 0 },
      ],
      gracefulStop: '5s',
    },
  },
  thresholds: {
    // Strict pass/fail criteria per user choice
    'http_req_failed': ['rate<0.01'],         // <1% errors total
    'http_req_duration': ['p(95)<500'],        // P95 < 500ms
    'login_errors': ['count==0'],              // no auth errors
    'list_errors': ['count==0'],               // no list errors
    'export_errors': ['count==0'],             // no export errors
    'freq_errors': ['count==0'],               // no freq errors
    'login_latency': ['p(95)<500'],
    'list_latency': ['p(95)<500'],
    'export_latency': ['p(95)<2000'],          // exports get 2s budget — they're heavier
    'freq_latency': ['p(95)<2000'],            // freq analysis gets 2s budget
  },
  noConnectionReuse: false,
  userAgent: 'k6-stress-test/1.0',
};

// ─── Helper: login and return auth cookie ─────────────────────────────────
function login() {
  const res = http.post(
    `${BASE_URL}/api/auth`,
    JSON.stringify({ username: TEST_USER, password: TEST_PASS }),
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '10s',
    }
  );

  const ok = check(res, {
    'login status 200': (r) => r.status === 200,
    'login has token cookie': (r) => {
      const cookies = r.cookies.ghms_token;
      return cookies && cookies.length > 0 && cookies[0].value.length > 0;
    },
  });

  if (!ok) {
    loginErrors.add(1);
    return null;
  }

  loginLatency.add(res.timings.duration);
  // k6 auto-captures cookies; we just need to make subsequent requests
  return res.cookies.ghms_token[0].value;
}

// ─── Scenario 1: Auth flow ────────────────────────────────────────────────
export function authScenario() {
  group('auth', () => {
    const token = login();
    if (token) {
      // Hit dashboard to verify token works
      const dashRes = http.get(`${BASE_URL}/api/police-dashboard`, { timeout: '10s' });
      check(dashRes, {
        'dashboard status 200': (r) => r.status === 200,
        'dashboard has data': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body && (body.totalGuests !== undefined || body.providers !== undefined);
          } catch (e) { return false; }
        },
      }) || loginErrors.add(1);
    }
    sleep(0.5);
  });
}

// ─── Scenario 2: List endpoints (pagination) ──────────────────────────────
export function listScenario() {
  group('list', () => {
    // Login once per VU iteration
    const token = login();
    if (!token) { sleep(1); return; }

    const endpoints = [
      '/api/police-guests?page=1&pageSize=20',
      '/api/police-guests?page=1&pageSize=50',
      '/api/police-guests?page=2&pageSize=20',
      '/api/suspected-persons?page=1&pageSize=20',
      '/api/suspect-matches?page=1&pageSize=20',
      '/api/police-officers',
      '/api/providers',
    ];

    // Pick a random endpoint per iteration
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const res = http.get(`${BASE_URL}${endpoint}`, { timeout: '10s' });

    const ok = check(res, {
      'list status 200': (r) => r.status === 200,
      'list has data': (r) => {
        try {
          JSON.parse(r.body);
          return true;
        } catch (e) { return false; }
      },
      'list no error in body': (r) => !r.body.includes('"error"'),
    });

    if (!ok) listErrors.add(1);
    listLatency.add(res.timings.duration);
    sleep(0.3);
  });
}

// ─── Scenario 3: Export endpoints (streaming) ─────────────────────────────
export function exportScenario() {
  group('export', () => {
    const token = login();
    if (!token) { sleep(1); return; }

    // Hit the streaming export endpoint
    const res = http.get(`${BASE_URL}/api/police-export`, { timeout: '30s' });

    const ok = check(res, {
      'export status 200': (r) => r.status === 200,
      'export has content': (r) => r.body && r.body.length > 0,
      'export is valid json or csv': (r) => {
        if (!r.body) return false;
        const trimmed = r.body.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          try { JSON.parse(trimmed); return true; } catch (e) { return false; }
        }
        // CSV check — has commas and newlines
        return trimmed.includes(',') && trimmed.includes('\n');
      },
    });

    if (!ok) exportErrors.add(1);
    exportLatency.add(res.timings.duration);
    sleep(1);  // exports are heavy — slower pacing
  });
}

// ─── Scenario 4: Frequent-stays analysis (Phase 1.7 SQL) ──────────────────
export function freqScenario() {
  group('freq', () => {
    const token = login();
    if (!token) { sleep(1); return; }

    // POST to trigger the SQL GROUP BY aggregation
    const res = http.post(
      `${BASE_URL}/api/police-intelligence/frequent-stays`,
      JSON.stringify({}),
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: '30s',
      }
    );

    const ok = check(res, {
      'freq status 200': (r) => r.status === 200,
      'freq returns array or object': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body) || (body && typeof body === 'object');
        } catch (e) { return false; }
      },
    });

    if (!ok) freqErrors.add(1);
    freqLatency.add(res.timings.duration);
    sleep(1);
  });
}

// ─── Default function (not used — scenarios take over) ────────────────────
export default function () {
  // No-op — scenarios run individually
}
