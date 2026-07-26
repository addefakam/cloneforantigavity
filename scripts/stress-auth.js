import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

const BASE_URL = 'https://guesthousewithpolicemodule.vercel.app';
const TEST_USER = 'police';
const TEST_PASS = '123';

const loginErrors = new Counter('login_errors');
const loginLatency = new Trend('login_latency', true);

export const options = {
  vus: 20,
  duration: '20s',
  thresholds: {
    'http_req_failed': ['rate<0.01'],
    'http_req_duration': ['p(95)<500'],
    'login_errors': ['count==0'],
    'login_latency': ['p(95)<500'],
  },
  noConnectionReuse: false,
};

function login() {
  const res = http.post(
    `${BASE_URL}/api/auth`,
    JSON.stringify({ username: TEST_USER, password: TEST_PASS }),
    { headers: { 'Content-Type': 'application/json' }, timeout: '10s' }
  );

  const ok = check(res, {
    'login status 200': (r) => r.status === 200,
    'login has token': (r) => r.cookies && r.cookies.ghms_token && r.cookies.ghms_token.length > 0,
  });

  if (!ok) {
    loginErrors.add(1);
    return null;
  }
  loginLatency.add(res.timings.duration);

  // Hit dashboard to verify token works
  const dashRes = http.get(`${BASE_URL}/api/police-dashboard`, { timeout: '10s' });
  check(dashRes, {
    'dashboard 200': (r) => r.status === 200,
  }) || loginErrors.add(1);

  return res.cookies.ghms_token[0].value;
}

export default function () {
  login();
  sleep(0.3);
}
