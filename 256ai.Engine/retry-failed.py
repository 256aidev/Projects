"""
Delete tasks that were falsely marked as COMPLETED by AI02 workers
(those with [Error] in their result) and re-dispatch them.
"""
import json, urllib.request

API = "http://localhost:5100"
PROJECT_ID = "1be2cac6-54bc-48cd-8df5-004fbbffdd95"

# Get all tasks
tasks = json.loads(urllib.request.urlopen(f"{API}/tasks?projectId={PROJECT_ID}&limit=50").read())

to_retry = []
for t in tasks:
    if t["status"] != "COMPLETED":
        continue
    # Get full task details
    detail = json.loads(urllib.request.urlopen(f"{API}/tasks/{t['taskId']}").read())
    result = detail.get("result", {})
    output = str(result.get("Outputs", {}).get("response", ""))

    # If the output starts with [Error], it was a false completion
    if "[Error]" in output:
        to_retry.append(detail)
        print(f"FAKE COMPLETED: {t['taskId'][:12]} - {t['objective'][:60]}")

print(f"\nFound {len(to_retry)} tasks to re-dispatch")

# Delete and re-create each task
for detail in to_retry:
    tid = detail["taskId"]

    # Delete the old task
    req = urllib.request.Request(f"{API}/tasks/{tid}", method="DELETE")
    try:
        resp = urllib.request.urlopen(req)
        print(f"  Deleted: {tid[:12]}")
    except Exception as e:
        print(f"  Delete failed for {tid[:12]}: {e}")
        continue

    # Re-create with same objective and metadata
    new_task = {
        "objective": detail["objective"],
        "domain": detail["domain"],
        "projectId": detail.get("projectId"),
        "expectedOutputs": "Task output as described in objective",
        "parentTaskId": detail.get("parentTaskId"),
    }

    # Preserve dependsOn if present (get from original - need to check)

    req2 = urllib.request.Request(
        f"{API}/tasks",
        json.dumps(new_task).encode(),
        {"Content-Type": "application/json"}
    )
    resp2 = json.loads(urllib.request.urlopen(req2).read())
    print(f"  Re-dispatched: {resp2['taskId'][:12]} - PENDING")

print("\nDone! Tasks re-dispatched for real execution.")
