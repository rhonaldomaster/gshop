# Load Tests for GSHOP API

This directory contains Artillery load test configurations to verify rate limiting behavior.

## Prerequisites

1. Start the backend server:
   ```bash
   cd backend
   npm run start:dev
   ```

2. Ensure the server is running on `http://localhost:3000`

## Available Tests

### 1. Rate Limit Test (`rate-limit.yml`)
Tests the rate limiting behavior across multiple endpoints.

```bash
npm run test:load
# or
npm run test:load:rate-limit
```

**What it tests:**
- Login endpoint (5 req/min limit)
- Products list (100 req/min limit)
- Product search (30 req/min limit)
- Categories (global 100 req/min limit)

### 2. Auth Stress Test (`auth-stress.yml`)
Simulates brute force attacks on the login endpoint.

```bash
npm run test:load:auth
```

**What it tests:**
- Login endpoint under sustained attack
- Verifies 429 responses after limit exceeded
- Tests rate limit reset behavior

### 3. API Load Test (`api-load.yml`)
General load test with mixed traffic patterns.

```bash
npm run test:load:api
```

**What it tests:**
- Product browsing patterns
- Search functionality under load
- Trending products endpoint
- Overall API stability

## Interpreting Results

### Success Criteria
- All requests should return either expected status (200, 401) or rate limit (429)
- No 5xx errors should occur
- Response times should remain acceptable under load

### Key Metrics
- `http.response_time.p95` - 95th percentile response time
- `http.codes.429` - Number of rate limited requests
- `http.codes.200` - Successful requests
- `vusers.failed` - Failed virtual users (should be 0)

### Example Output
```
All VUs finished. Total time: 70 seconds

Summary:
  http.codes.200: 1500
  http.codes.401: 300
  http.codes.429: 200  <-- Rate limiting working!
  http.request_rate: 50/sec
  http.response_time:
    min: 5
    max: 150
    median: 25
    p95: 75
    p99: 120
```

## Custom Tests

Create a new YAML file following the Artillery format:

```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "My Test"
    flow:
      - get:
          url: "/api/v1/my-endpoint"
```

Run with:
```bash
npx artillery run test/load/my-test.yml
```

## Environment Variables

Override the target URL:
```bash
TARGET_URL=http://staging.example.com npm run test:load
```

## CI/CD Integration

For CI pipelines, use the `--output` flag to generate JSON reports:

```bash
npx artillery run --output results.json test/load/rate-limit.yml
```

Then analyze with:
```bash
npx artillery report results.json
```
