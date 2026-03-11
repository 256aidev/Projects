import json, urllib.request

data = json.loads(urllib.request.urlopen("http://localhost:5100/tasks?limit=200").read())

counts = {}
for t in data:
    s = t["status"]
    counts[s] = counts.get(s, 0) + 1
print(f"Total: {len(data)} | Status: {counts}\n")

failed = [t for t in data if t["status"] == "FAIL"]
print(f"=== FAILED TASKS ({len(failed)}) ===\n")
for t in failed:
    tid = t["taskId"][:8]
    domain = t.get("domain", "?")
    worker = t.get("assignedWorkerId", "?")
    obj_line = t["objective"].split("\n")[0][:80]
    print(f"  [{tid}] domain={domain} worker={worker}")
    print(f"    objective: {obj_line}")

    # Get full task details for result/error
    detail = json.loads(urllib.request.urlopen(f"http://localhost:5100/tasks/{t['taskId']}").read())
    result = detail.get("result")
    if result:
        err = result.get("ErrorMessage", "")
        outputs = result.get("Outputs", {})
        resp = outputs.get("response", "")[:200] if outputs else ""
        print(f"    error: {err}")
        if resp:
            print(f"    response: {resp}")
    print()
