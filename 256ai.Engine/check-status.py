import json, urllib.request

# Check tasks
data = json.loads(urllib.request.urlopen("http://localhost:5100/tasks?limit=200").read())
print(f"Total tasks: {len(data)}")

counts = {}
pids = set()
for t in data:
    s = t["status"]
    counts[s] = counts.get(s, 0) + 1
    pids.add(t.get("projectId", "none"))

print(f"Status counts: {counts}")
print(f"Project IDs: {pids}")

# Check projects
projects = json.loads(urllib.request.urlopen("http://localhost:5100/projects").read())
print(f"\nTotal projects: {len(projects)}")
for p in projects:
    print(f"  {p['name']} | {p['status']} | {p['projectId']}")
