# Load Testing with k6

This directory contains load testing scripts for the GSHOP backend using [k6](https://k6.io/).

## Setup

### Install k6

**macOS:**
```bash
brew install k6
```

**Linux:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Windows:**
```powershell
choco install k6
```

**Or use Docker:**
```bash
docker pull grafana/k6
```

## Running Tests

### Live Streaming Load Test

Test the live streaming system with simulated user behavior:

```bash
# Basic test (50 concurrent users for 5 minutes)
k6 run tests/load/live-streaming-load.js

# Custom configuration
k6 run --vus 100 --duration 10m tests/load/live-streaming-load.js

# With environment variable
k6 run --vus 50 --duration 5m -e BASE_URL=http://localhost:3000/api/v1 tests/load/live-streaming-load.js

# Using Docker
docker run --rm -i grafana/k6 run - <tests/load/live-streaming-load.js
```

### Test Stages

The default test has 5 stages:

1. **Ramp-up (30s)**: 0 → 10 users
2. **Ramp-up (1m)**: 10 → 50 users
3. **Sustained Load (3m)**: 50 users constant
4. **Spike Test (30s)**: 50 → 100 users
5. **Ramp-down (1m)**: 100 → 0 users

### Performance Thresholds

Tests will fail if these thresholds are exceeded:

- **p95 HTTP Duration**: < 500ms (95% of requests must complete in under 500ms)
- **Failed Requests**: < 1% (less than 1% of requests can fail)
- **Discovery Latency**: < 300ms (stream discovery must be fast)
- **Chat Success Rate**: > 95% (at least 95% of chat messages must succeed)
- **Error Rate**: < 5% (total error rate must be below 5%)

## Test Scenarios

Each virtual user performs the following actions:

1. **Discover Streams**: Fetch list of active live streams
2. **Join Stream**: Join a random live stream
3. **Send Messages**: Send 3 chat messages with random delays
4. **Send Reactions**: Send reactions (hearts, fire, etc.)
5. **Search Streams**: Search for specific streams

## Metrics

### Built-in Metrics

- `http_req_duration`: Total request duration
- `http_req_waiting`: Time waiting for response
- `http_req_blocked`: Time blocked (DNS, TCP)
- `http_req_connecting`: Time establishing TCP connection
- `http_req_failed`: Rate of failed requests
- `http_reqs`: Total HTTP requests per second
- `iteration_duration`: Time to complete one full user scenario

### Custom Metrics

- `discovery_latency`: Time to discover live streams
- `chat_message_success`: Success rate of chat messages
- `reaction_success`: Success rate of reactions
- `streams_joined`: Total number of stream joins
- `errors`: Total error rate

## Analyzing Results

### Real-time Output

k6 provides real-time metrics during the test run. Watch for:

- Request rate (http_reqs)
- Error rate (http_req_failed)
- Response times (p95, p99)

### JSON Results

Results are saved to `load-test-results.json`:

```bash
# View summary
cat load-test-results.json | jq '.metrics'

# Export to CSV (requires jq)
cat load-test-results.json | jq -r '.metrics | to_entries[] | [.key, .value.values.avg] | @csv' > metrics.csv
```

### k6 Cloud (Optional)

For advanced analytics, use k6 Cloud:

```bash
k6 login cloud
k6 cloud tests/load/live-streaming-load.js
```

## Optimization Tips

If tests fail thresholds:

### High Response Times (p95 > 500ms)

1. **Database Indexes**: Run the index optimization migration
   ```bash
   npm run migration:run
   ```

2. **Caching**: Ensure Redis/Cache is properly configured

3. **Database Connection Pool**: Increase pool size in TypeORM config

4. **Query Optimization**: Check for N+1 queries using TypeORM logging

### High Error Rate

1. **Rate Limiting**: Adjust rate limits in guards
2. **Database Connections**: Increase max connections
3. **Memory**: Monitor Node.js heap usage
4. **WebSocket Limits**: Increase socket.io connection limits

### High Latency

1. **Enable Compression**: Add compression middleware
2. **CDN**: Use CDN for static assets
3. **Database**: Add read replicas for read-heavy operations
4. **Horizontal Scaling**: Use PM2 or Kubernetes for multi-instance deployment

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Load Test
on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM
jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run k6 test
        uses: grafana/k6-action@v0.3.1
        with:
          filename: tests/load/live-streaming-load.js
          flags: --vus 50 --duration 5m
```

## Monitoring During Tests

### Server-Side Monitoring

Monitor these during load tests:

1. **CPU Usage**: `top` or `htop`
2. **Memory**: `free -m`
3. **Database Connections**:
   ```sql
   SELECT count(*) FROM pg_stat_activity;
   ```
4. **PostgreSQL Performance**:
   ```sql
   SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
   ```

### Application Logs

Tail logs to see errors:

```bash
# Development
npm run start:dev

# Production
pm2 logs
```

## Troubleshooting

### Connection Refused

- Ensure backend is running on the correct port
- Check BASE_URL environment variable

### High Failure Rate

- Check backend logs for errors
- Verify database is accessible
- Ensure sufficient resources (CPU, memory)

### Timeout Errors

- Increase k6 timeout: `--http-debug`
- Check for slow database queries
- Monitor network latency

## Best Practices

1. **Start Small**: Begin with 10 users, then scale up
2. **Monitor Resources**: Watch CPU, memory, and database during tests
3. **Realistic Scenarios**: Model actual user behavior patterns
4. **Regular Testing**: Run load tests weekly to catch regressions
5. **Test Environments**: Use staging environment, not production
6. **Cleanup**: Remove test data after runs to avoid pollution
