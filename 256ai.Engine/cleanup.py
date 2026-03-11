import json, urllib.request

# Get all tasks
data = json.loads(urllib.request.urlopen("http://localhost:5100/tasks?limit=200").read())
print(f"Found {len(data)} tasks to clean up")

for t in data:
    tid = t["taskId"]
    status = t["status"]

    # Cancel active tasks first
    if status in ("PENDING", "LEASED", "ACKED", "IN_PROGRESS", "RUNNING"):
        req = urllib.request.Request(
            f"http://localhost:5100/tasks/{tid}/cancel",
            data=b"{}",
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        try:
            urllib.request.urlopen(req)
            print(f"  Cancelled {tid[:8]}... ({status})")
        except Exception as e:
            print(f"  Failed to cancel {tid[:8]}...: {e}")

    # Delete the task
    req = urllib.request.Request(
        f"http://localhost:5100/tasks/{tid}",
        method="DELETE"
    )
    try:
        urllib.request.urlopen(req)
        print(f"  Deleted {tid[:8]}...")
    except Exception as e:
        print(f"  Failed to delete {tid[:8]}...: {e}")

# Verify
data2 = json.loads(urllib.request.urlopen("http://localhost:5100/tasks?limit=200").read())
print(f"\nRemaining tasks: {len(data2)}")
