import json, urllib.request

data = json.loads(urllib.request.urlopen("http://localhost:5100/health/workers").read())
print(f"Total workers: {len(data)}")
for w in data:
    print(f"  {w['workerId']:30s} role={w.get('role','?'):15s} status={w['status']:10s} online={w['isOnline']} lastSeen={w.get('lastSeenAt','?')}")
