"""Update the ChoreQuest project with full spec markdown for dashboard plan tracker."""
import json, urllib.request

PROJECT_ID = "1be2cac6-54bc-48cd-8df5-004fbbffdd95"
API = "http://localhost:5100"

# Read the spec
with open(r"C:\Projects\256ai-projects\ChoreQuest\SPEC.md", "r", encoding="utf-8") as f:
    spec = f.read()

# Update the project
data = json.dumps({"specMarkdown": spec}).encode("utf-8")
req = urllib.request.Request(
    f"{API}/projects/{PROJECT_ID}",
    data=data,
    headers={"Content-Type": "application/json"},
    method="PUT"
)
resp = urllib.request.urlopen(req)
result = json.loads(resp.read())
print(f"Updated project: {result.get('name')} - status: {result.get('status')}")
