import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics
const apiDuration = new Trend('api_duration');
const apiErrors = new Counter('api_errors');
const successRate = new Rate('success_rate');
const activeConnections = new Gauge('active_connections');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 50 },    // Ramp up to 50 users
    { duration: '5m', target: 100 },   // Increase to 100 users
    { duration: '10m', target: 150 },  // Peak load: 150 users
    { duration: '5m', target: 100 },   // Ramp down to 100 users
    { duration: '2m', target: 0 },     // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],  // 95% under 500ms, 99% under 1s
    http_req_failed: ['rate<0.1'],                    // Error rate < 10%
    api_duration: ['p(95)<500', 'p(99)<1000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost';

export default function () {
  // Test 1: Health Check
  group('Health Checks', () => {
    const res = http.get(`${BASE_URL}/health`);
    const success = check(res, {
      'health status is 200': (r) => r.status === 200,
      'health response time < 100ms': (r) => r.timings.duration < 100,
    });
    successRate.add(success);
    if (!success) apiErrors.add(1);
    apiDuration.add(res.timings.duration);
  });

  sleep(1);

  // Test 2: Auth endpoint (login)
  group('Authentication', () => {
    const loginPayload = JSON.stringify({
      email: `user${Math.floor(Math.random() * 1000)}@example.com`,
      password: 'Demo@123',
    });

    const res = http.post(`${BASE_URL}/api/account/login`, loginPayload, {
      headers: { 'Content-Type': 'application/json' },
    });

    const success = check(res, {
      'login status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'login response time < 300ms': (r) => r.timings.duration < 300,
    });
    successRate.add(success);
    if (res.status >= 400) apiErrors.add(1);
    apiDuration.add(res.timings.duration);
  });

  sleep(1);

  // Test 3: Get groups (authenticated would be better, but testing with unauthenticated)
  group('Groups API', () => {
    const res = http.get(`${BASE_URL}/api/groups/my-groups`, {
      headers: {
        'Authorization': 'Bearer fake-token',
      },
    });

    const success = check(res, {
      'groups status is 401 (expected without token)': (r) => r.status === 401,
      'groups response time < 200ms': (r) => r.timings.duration < 200,
    });
    successRate.add(success);
    if (res.status >= 500) apiErrors.add(1);  // Only count 5xx as errors
    apiDuration.add(res.timings.duration);
  });

  sleep(1);

  // Test 4: Chores endpoint
  group('Chores API', () => {
    const res = http.get(`${BASE_URL}/api/Chores/group/1`, {
      headers: {
        'Authorization': 'Bearer fake-token',
      },
    });

    const success = check(res, {
      'chores returns response': (r) => r.status > 0,
      'chores response time < 300ms': (r) => r.timings.duration < 300,
    });
    successRate.add(success);
    if (res.status >= 500) apiErrors.add(1);
    apiDuration.add(res.timings.duration);
  });

  sleep(1);

  // Test 5: Swagger/API docs
  group('API Documentation', () => {
    const res = http.get(`${BASE_URL}/swagger/index.html`);

    const success = check(res, {
      'swagger status is 200 or 404': (r) => r.status === 200 || r.status === 404,
      'swagger response time < 500ms': (r) => r.timings.duration < 500,
    });
    successRate.add(success);
    apiDuration.add(res.timings.duration);
  });

  sleep(Math.random() * 3); // Random sleep between tests
}

export function teardown(data) {
  console.log('\n=== Load Test Results ===');
  console.log(`Success Rate: ${successRate.value}%`);
  console.log(`Total Errors: ${apiErrors.value}`);
}
