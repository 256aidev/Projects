import json, urllib.request

url = "http://localhost:5100/projects/dbeaa34a-58a4-4a7b-a062-902dfb6e258b/tasks"
data = json.loads(urllib.request.urlopen(url).read())
print(f"Total tasks: {len(data)}")
print()
by_status = {}
for t in data:
    s = t["status"]
    by_status[s] = by_status.get(s, 0) + 1
print("By status:", by_status)
print()
for t in data:
    wid = t.get("assignedWorkerId") or "unassigned"
    obj_lines = t["objective"].split("\n")
    first_line = obj_lines[0][:80]
    print(f'  {t["status"]:12s} {t["domain"]:15s} {wid:30s} {first_line}')
