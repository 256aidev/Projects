"""
Clean up all tasks for ChoreQuest and re-dispatch.
Phase 16 (DevOps) actually succeeded on Dragon worker - keep that.
"""
import json, urllib.request

API = "http://localhost:5100"
PROJECT_ID = "1be2cac6-54bc-48cd-8df5-004fbbffdd95"

# Get all tasks
tasks = json.loads(urllib.request.urlopen(f"{API}/tasks?projectId={PROJECT_ID}&limit=50").read())

print(f"Total tasks: {len(tasks)}")

# Delete all tasks EXCEPT Phase 16 (which actually completed on Dragon)
phase16_id = None
for t in tasks:
    detail = json.loads(urllib.request.urlopen(f"{API}/tasks/{t['taskId']}").read())
    result = detail.get("result") or {}
    outputs = result.get("Outputs") or {}
    output = str(outputs.get("response", ""))
    worker = t.get("assignedWorkerId", "")
    obj_first_line = t["objective"].split("\\n")[0][:60]

    # Keep Phase 16 if it actually completed on Dragon worker (real work)
    if "Phase 16" in t["objective"] and worker == "worker-256ai-001" and t["status"] == "COMPLETED" and "[Error]" not in output:
        phase16_id = t["taskId"]
        print(f"KEEPING: {t['taskId'][:12]} - {obj_first_line} (real completion by {worker})")
        continue

    # Delete everything else
    try:
        req = urllib.request.Request(f"{API}/tasks/{t['taskId']}", method="DELETE")
        urllib.request.urlopen(req)
        print(f"DELETED: {t['taskId'][:12]} - {t['status']:12s} {obj_first_line}")
    except Exception as e:
        # If can't delete (active task), cancel first
        try:
            req_cancel = urllib.request.Request(
                f"{API}/tasks/{t['taskId']}/cancel",
                b"",
                {"Content-Type": "application/json"},
                method="POST"
            )
            urllib.request.urlopen(req_cancel)
            req = urllib.request.Request(f"{API}/tasks/{t['taskId']}", method="DELETE")
            urllib.request.urlopen(req)
            print(f"CANCEL+DELETE: {t['taskId'][:12]} - {obj_first_line}")
        except Exception as e2:
            print(f"FAILED TO DELETE: {t['taskId'][:12]} - {e2}")

print(f"\nPhase 16 kept: {phase16_id}")
print("Now re-run dispatch-chorequest.py to re-dispatch all phases (Phase 16 will be skipped if already done)")
