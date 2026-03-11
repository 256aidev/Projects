import json, urllib.request

projects = json.loads(urllib.request.urlopen("http://localhost:5100/projects").read())
print(f"Projects: {len(projects)}")
for p in projects:
    print(f"  {p['name']:30s} {p['status']:12s} {p.get('workingDirectory','?')}")

tasks = json.loads(urllib.request.urlopen("http://localhost:5100/tasks?limit=200").read())
print(f"\nTasks: {len(tasks)}")
counts = {}
for t in tasks:
    s = t["status"]
    counts[s] = counts.get(s, 0) + 1
    obj = t["objective"].split("\n")[0][:80]
    print(f"  [{t['status']:12s}] {t.get('domain','?'):15s} {obj}")
print(f"\nStatus: {counts}")
