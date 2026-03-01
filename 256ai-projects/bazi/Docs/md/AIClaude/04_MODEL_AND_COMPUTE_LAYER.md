# Model & Compute Layer

## Role
This layer produces intelligence reliably and at scale.

It must never block the user-facing core loop.

## Responsibilities
- Batch generation
- Cache population
- Throughput optimization
- Backpressure enforcement
- Health reporting

## Design Rules
- No synchronous LLM calls in critical request paths
- Cache-first reads
- Async generation for misses
- Graceful degradation on failure

## Required Metrics
- Queue depth
- Latency distribution
- Error rate
- Resource utilization
- Cost per output unit

If this layer is unhealthy, upstream layers must degrade safely.
