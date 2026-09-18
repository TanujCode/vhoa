import os

main_path = r"d:\Vhoa_Management\backend\app\main.py"
with open(main_path, "rb") as f:
    raw = f.read()

# Replace invalid bytes with empty string or clean up
clean_text = raw.decode("utf-8", errors="ignore")

# Find the start of the garbled reminder section
cut_point = clean_text.find("# ── Background Automated Rental Reminder")
if cut_point != -1:
    clean_text = clean_text[:cut_point]

ending = """# ── Background Automated Rental Reminder Scheduler ───────────────────
import threading
import time


def _start_rental_reminder_scheduler():
    def _run():
        # Short initial delay to let DB connections settle
        time.sleep(10)
        while True:
            try:
                db = SessionLocal()
                try:
                    from app.services.rental.reminder_service import trigger_auto_monthly_rent_reminders
                    res = trigger_auto_monthly_rent_reminders(db)
                    if res.get("reminders_sent", 0) > 0:
                        print(f"[REMINDER_SCHEDULER] Automatically dispatched {res['reminders_sent']} reminder email(s).")
                finally:
                    db.close()
            except Exception as e:
                print(f"[REMINDER_SCHEDULER] Background check error: {e}")
            # Runs every 6 hours
            time.sleep(21600)

    t = threading.Thread(target=_run, daemon=True)
    t.start()
    print("[REMINDER_SCHEDULER] Automated monthly rent reminder background scheduler started.")


@app.on_event("startup")
def on_app_startup():
    _start_rental_reminder_scheduler()


@app.get("/", tags=["Health"])
def health():
    return {"status": "running", "app": settings.APP_NAME, "version": "2.5.0-test"}
"""

clean_text = clean_text.rstrip() + "\n\n\n" + ending

with open(main_path, "w", encoding="utf-8") as f:
    f.write(clean_text)

print("Fixed main.py cleanly!")
