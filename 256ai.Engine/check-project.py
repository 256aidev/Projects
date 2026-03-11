import json, urllib.request, os

# Get all tasks
data = json.loads(urllib.request.urlopen("http://localhost:5100/tasks?limit=200").read())
print(f"Total tasks: {len(data)}")

counts = {}
for t in data:
    s = t["status"]
    counts[s] = counts.get(s, 0) + 1
print(f"Status: {counts}\n")

print("=== ALL TASKS ===\n")
for t in data:
    tid = t["taskId"][:8]
    status = t["status"]
    domain = t.get("domain", "?")
    worker = t.get("assignedWorkerId") or "unassigned"
    obj_lines = t["objective"].split("\n")
    first_line = obj_lines[0][:90]
    print(f"  [{status:10s}] {domain:15s} {worker:30s} {first_line}")

# Check project directory
proj_dir = r"C:\Projects\256ai-projects\ChoreQuest"
if os.path.exists(proj_dir):
    print(f"\n=== FILES IN {proj_dir} ===\n")
    for root, dirs, files in os.walk(proj_dir):
        # Skip node_modules and .git
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', '.expo')]
        level = root.replace(proj_dir, '').count(os.sep)
        indent = '  ' * level
        print(f"{indent}{os.path.basename(root)}/")
        subindent = '  ' * (level + 1)
        for f in files:
            fpath = os.path.join(root, f)
            size = os.path.getsize(fpath)
            print(f"{subindent}{f} ({size} bytes)")
else:
    print(f"\nProject directory {proj_dir} does not exist yet")
