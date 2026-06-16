import urllib.request
import json

url = "https://nestbloq.onrender.com/openapi.json"
try:
    with urllib.request.urlopen(url) as response:
        data = json.loads(response.read().decode())
        schemas = data.get("components", {}).get("schemas", {})
        meeting_out = schemas.get("MeetingOut", {})
        print("MeetingOut schema properties:")
        print(json.dumps(meeting_out.get("properties", {}), indent=2))
except Exception as e:
    print(f"Error fetching openapi.json: {e}")
