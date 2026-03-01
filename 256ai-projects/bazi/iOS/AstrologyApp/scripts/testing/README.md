# BaZi Testing Scripts

Scripts for load testing, cache validation, and throughput testing.

## Quick Start

```bash
cd ~/AstrologyApp
source venv/bin/activate
cd scripts/testing

# Step 1: Create test users (20 users for validation)
python seed_test_users.py --count 20

# Step 2: Generate cached readings for test users
python batch_generate_readings.py --type all

# Step 3: Validate cache is working
python validate_cache.py --api-base http://localhost:8000

# Step 4: Run throughput tests
python throughput_test.py --concurrency 10 --requests 100
```

## Scripts

### 1. seed_test_users.py
Creates test users with varied birth data.

```bash
# Create 20 users (default)
python seed_test_users.py

# Create 100 users
python seed_test_users.py --count 100

# Create users with specific ID offset
python seed_test_users.py --count 50 --start-id 200
```

### 2. batch_generate_readings.py
Pre-generates readings to warm the cache.

```bash
# Generate all reading types for all test users
python batch_generate_readings.py --type all

# Generate only daily readings
python batch_generate_readings.py --type daily

# Generate for specific users
python batch_generate_readings.py --type weekly --user-ids 4,5,6,7,8
```

**Note:** This can take a long time with Ollama (~30-60s per reading).
- 20 users x 4 reading types = 80 readings
- Estimated time: 40-80 minutes

### 3. validate_cache.py
Verifies cached readings are being returned quickly.

```bash
# Validate cache for first 10 test users
python validate_cache.py --limit 10

# Validate specific users
python validate_cache.py --user-ids 4,5,6

# Test against production API
python validate_cache.py --api-base https://256ai.xyz
```

### 4. throughput_test.py
Tests concurrent request handling and measures performance.

```bash
# Single test: 10 concurrent, 100 total requests
python throughput_test.py -c 10 -n 100 -e daily

# Test weekly endpoint
python throughput_test.py -c 10 -n 100 -e weekly

# Full test suite (multiple concurrency levels)
python throughput_test.py --full-suite

# Test production API
python throughput_test.py --api-base https://256ai.xyz -c 10 -n 50
```

## Expected Results

### Cache Validation
- Fast responses (<1s): Reading from cache
- Slow responses (>30s): Regenerating with Ollama
- Target cache hit rate: 90%+

### Throughput Metrics
| Metric | Target (Cached) | Target (Uncached) |
|--------|-----------------|-------------------|
| Latency Avg | <100ms | <60s |
| Latency P95 | <200ms | <90s |
| Success Rate | >99% | >95% |
| RPS (10 concurrent) | >50 | N/A |

## Testing Workflow

### Phase A: Small Scale (20 users)
1. Create 20 test users
2. Generate all readings (allow 1-2 hours)
3. Validate cache hit rate
4. Run throughput test

### Phase B: Full Scale (100 users)
1. Create additional 80 users
2. Run overnight batch generation
3. Validate cache
4. Run full throughput suite
5. Monitor Ollama/system resources

## Monitoring Tips

```bash
# Watch Ollama logs (Windows box)
# Check GPU usage, response times

# Watch API server logs
journalctl -u bazi-api -f

# Check database size
psql -U bazi -d bazi -c "SELECT pg_size_pretty(pg_database_size('bazi'));"

# Count readings
psql -U bazi -d bazi -c "
SELECT
  (SELECT COUNT(*) FROM daily_readings) as daily,
  (SELECT COUNT(*) FROM weekly_readings) as weekly,
  (SELECT COUNT(*) FROM monthly_readings) as monthly,
  (SELECT COUNT(*) FROM yearly_readings) as yearly;
"
```
