# Launch and Kill Rules

## Launch Criteria

Before launching an app to production, verify:

- [ ] Core loop is reliable
- [ ] No blocking errors
- [ ] Acceptable latency or async fallback exists
- [ ] Monitoring is active (health messages flowing)
- [ ] Escalation path is clear

## Kill Criteria

An app should be killed when:

- [ ] No repeat usage (users don't return)
- [ ] Unbounded cost (grows without revenue)
- [ ] Structural complexity explosion (can't maintain)
- [ ] Better absorbed by another app

## The Rule

**Killing an app is success.**

**Keeping broken infrastructure is failure.**

## Process

### To Launch

1. Verify all launch criteria
2. Deploy to production
3. Monitor health messages for 24h
4. If stable → document and hand off
5. If unstable → fix or kill

### To Kill

1. Identify kill criteria met
2. Document reason
3. Archive code (don't delete)
4. Redirect users (if any)
5. Shut down infrastructure
6. Remove from monitoring

## Remember

Apps are disposable. The engine is permanent.

Don't be attached to apps. Be attached to the engine working correctly.
