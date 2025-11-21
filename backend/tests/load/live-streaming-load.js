/**
 * k6 Load Test: Live Streaming System
 *
 * Tests the performance and scalability of the live streaming platform
 * Simulates realistic user behavior:
 * - Discovering live streams
 * - Joining streams
 * - Sending chat messages
 * - Sending reactions
 * - Viewing stream stats
 *
 * Run:
 * k6 run --vus 50 --duration 5m tests/load/live-streaming-load.js
 *
 * Metrics to monitor:
 * - http_req_duration: Request latency (p95 should be < 500ms)
 * - http_req_failed: Failed requests (should be < 1%)
 * - http_reqs: Requests per second
 * - iteration_duration: Complete user journey time
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const discoveryLatency = new Trend('discovery_latency');
const chatMessageRate = new Rate('chat_message_success');
const reactionRate = new Rate('reaction_success');
const joinStreamCounter = new Counter('streams_joined');
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp-up to 10 users
    { duration: '1m', target: 50 },   // Ramp-up to 50 users
    { duration: '3m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 100 }, // Spike to 100 users
    { duration: '1m', target: 0 },    // Ramp-down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% of requests should fail
    discovery_latency: ['p(95)<300'], // Discovery should be fast (< 300ms)
    chat_message_success: ['rate>0.95'], // 95% of chat messages should succeed
    errors: ['rate<0.05'], // Less than 5% error rate
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api/v1';

// Test data
let authTokens = [];
let activeStreams = [];

/**
 * Setup: Create test users and get auth tokens
 */
export function setup() {
  console.log('🚀 Setting up load test...');

  const tokens = [];

  // Create 5 test users
  for (let i = 0; i < 5; i++) {
    const email = `loadtest-user-${Date.now()}-${i}@example.com`;
    const password = 'Test123!';

    const registerRes = http.post(`${BASE_URL}/auth/register`, JSON.stringify({
      email,
      password,
      firstName: `LoadTest`,
      lastName: `User${i}`,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

    if (registerRes.status === 201) {
      const body = JSON.parse(registerRes.body);
      tokens.push(body.accessToken);
    }
  }

  console.log(`✅ Created ${tokens.length} test users`);

  return { tokens };
}

/**
 * Main test scenario: Viewer behavior
 */
export default function(data) {
  // Randomly select a user token
  const token = data.tokens[Math.floor(Math.random() * data.tokens.length)];
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Scenario 1: Discover live streams
  group('Discover Live Streams', function() {
    const startTime = Date.now();
    const discoverRes = http.get(`${BASE_URL}/live/discover?page=1&limit=10`, { headers });

    const duration = Date.now() - startTime;
    discoveryLatency.add(duration);

    const success = check(discoverRes, {
      'discovery status is 200': (r) => r.status === 200,
      'has data array': (r) => JSON.parse(r.body).data !== undefined,
    });

    if (!success) {
      errorRate.add(1);
    } else {
      errorRate.add(0);
      const body = JSON.parse(discoverRes.body);
      if (body.data && body.data.length > 0) {
        activeStreams = body.data.map(s => s.id);
      }
    }
  });

  sleep(1);

  // Scenario 2: Join a random stream
  if (activeStreams.length > 0) {
    const streamId = activeStreams[Math.floor(Math.random() * activeStreams.length)];

    group('Join Stream', function() {
      const joinRes = http.post(`${BASE_URL}/live/streams/${streamId}/join`, '{}', { headers });

      const success = check(joinRes, {
        'join status is 201': (r) => r.status === 201,
      });

      if (success) {
        joinStreamCounter.add(1);
      } else {
        errorRate.add(1);
      }
    });

    sleep(2);

    // Scenario 3: Send chat messages
    group('Send Chat Messages', function() {
      const messages = [
        'Hello!',
        'This is amazing!',
        'Where can I buy this?',
        '🔥🔥🔥',
        'Love this product!',
      ];

      for (let i = 0; i < 3; i++) {
        const message = messages[Math.floor(Math.random() * messages.length)];
        const chatRes = http.post(
          `${BASE_URL}/live/streams/${streamId}/messages`,
          JSON.stringify({ message }),
          { headers }
        );

        const success = check(chatRes, {
          'message sent': (r) => r.status === 201,
        });

        chatMessageRate.add(success);
        sleep(Math.random() * 3 + 1); // Random delay 1-4 seconds
      }
    });

    // Scenario 4: Send reactions
    group('Send Reactions', function() {
      const reactions = ['heart', 'fire', 'clap', 'wow'];
      const reaction = reactions[Math.floor(Math.random() * reactions.length)];

      // Note: This endpoint would need to be exposed as REST or use WebSocket
      // For now, we'll skip or implement a REST endpoint for reactions
      sleep(1);
    });

    sleep(2);
  }

  // Scenario 5: Search streams
  group('Search Streams', function() {
    const searchRes = http.get(`${BASE_URL}/live/search?query=test&page=1&limit=10`, { headers });

    check(searchRes, {
      'search status is 200': (r) => r.status === 200,
    });
  });

  sleep(Math.random() * 2 + 1);
}

/**
 * Teardown: Cleanup test data
 */
export function teardown(data) {
  console.log('🧹 Tearing down load test...');
  // Note: Cleanup would require additional endpoints or direct DB access
  // For now, we'll leave cleanup for manual or automated scripts
}

/**
 * Summary handler
 */
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'load-test-results.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  let summary = `\n${indent}Load Test Summary\n`;
  summary += `${indent}==================\n\n`;

  // Metrics
  const metrics = data.metrics;

  if (metrics.http_req_duration) {
    summary += `${indent}HTTP Request Duration:\n`;
    summary += `${indent}  - p(95): ${metrics.http_req_duration.values['p(95)']}ms\n`;
    summary += `${indent}  - p(99): ${metrics.http_req_duration.values['p(99)']}ms\n`;
    summary += `${indent}  - avg: ${metrics.http_req_duration.values.avg}ms\n\n`;
  }

  if (metrics.http_reqs) {
    summary += `${indent}HTTP Requests:\n`;
    summary += `${indent}  - Total: ${metrics.http_reqs.values.count}\n`;
    summary += `${indent}  - Rate: ${metrics.http_reqs.values.rate.toFixed(2)}/s\n\n`;
  }

  if (metrics.http_req_failed) {
    const failRate = (metrics.http_req_failed.values.rate * 100).toFixed(2);
    summary += `${indent}Failed Requests: ${failRate}%\n\n`;
  }

  summary += `${indent}Custom Metrics:\n`;
  if (metrics.discovery_latency) {
    summary += `${indent}  - Discovery p(95): ${metrics.discovery_latency.values['p(95)']}ms\n`;
  }
  if (metrics.streams_joined) {
    summary += `${indent}  - Streams Joined: ${metrics.streams_joined.values.count}\n`;
  }
  if (metrics.chat_message_success) {
    const successRate = (metrics.chat_message_success.values.rate * 100).toFixed(2);
    summary += `${indent}  - Chat Success Rate: ${successRate}%\n`;
  }

  return summary;
}
