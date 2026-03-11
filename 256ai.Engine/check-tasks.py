import json, sys, urllib.request

url = "http://localhost:5100/projects/dbeaa34a-58a4-4a7b-a062-902dfb6e258b/tasks"
data = json.loads(urllib.request.urlopen(url).read())
for t in data:
    wid = t.get("assignedWorkerId") or "unassigned"
    obj = t["objective"][:60].replace("\n", " ")
    print(f'{t["status"]:12s} {t["domain"]:15s} {wid:30s} {obj}')
