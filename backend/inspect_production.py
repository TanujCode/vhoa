import urllib.request
import json

url_db = "https://nestbloq.onrender.com/api/meeting-survey/debug-db"
url_test = "https://nestbloq.onrender.com/api/meeting-survey/debug-diarize-test"

try:
    with urllib.request.urlopen(url_db) as response:
        data = json.loads(response.read().decode())
        print("PRODUCTION MEETINGS:")
        print(json.dumps(data.get("meetings", []), indent=2))
        print("ENV KEYS STATUS:")
        print(json.dumps(data.get("env_keys", {}), indent=2))
except Exception as e:
    print(f"Error fetching debug-db: {e}")

print("=" * 60)

try:
    with urllib.request.urlopen(url_test) as response:
        data = json.loads(response.read().decode())
        print("DIARIZE TEST RESULT:")
        print(json.dumps(data, indent=2))
except Exception as e:
    print(f"Error fetching debug-diarize-test: {e}")
