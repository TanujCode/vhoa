import requests

def test_register():
    url = "http://127.0.0.1:9999/api/auth/register"
    payload = {
        "full_name": "Test User",
        "email_id": "k6370079@gmail.com", # Kunal's email which we deleted
        "password": "Password123",
        "confirm_password": "Password123",
        "role": "resident",
        "mobile_number": "",
        "time_zone": "America/New_York",
        "captcha_token": "local_captcha_math:2+2",
        "captcha_answer": "4"
    }
    
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == '__main__':
    test_register()
