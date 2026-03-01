# Launch and Kill Rules

## Launch Criteria
- Core loop is reliable
- No blocking errors
- Acceptable latency or async fallback
- Monitoring active

## Kill Criteria
- No repeat usage
- Unbounded cost
- Structural complexity explosion
- Better absorbed by another app

## Rule
Killing an app is success.
Keeping broken infrastructure is failure.
