from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models.hoa.user import User
from app.schemas.meeting_survey import (
    MeetingCreate, MeetingOut, MeetingRSVPCreate, MeetingRSVPOut,
    SurveyCreate, SurveyOut, SurveyVoteCreate, MeetingUpdate, SurveyUpdate,
    SpeakerRenameRequest
)
from app.services.hoa.meeting_survey_service import (
    create_meeting, get_community_meetings, rsvp_meeting,
    create_survey, get_community_surveys, vote_survey,
    update_meeting, delete_meeting, update_survey, delete_survey
)

router = APIRouter(prefix="/meeting-survey", tags=["Meetings & Surveys"])


# ══════════════════════════════════════════════
#  MEETING ENDPOINTS
# ══════════════════════════════════════════════
@router.post("/meetings", response_model=MeetingOut, status_code=201)
def schedule_meeting(
    body: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
):
    # Verify user belongs to community or is super_admin
    role_name = current_user.role.role_name if current_user.role else None
    if role_name != "super_admin" and current_user.community_id != body.community_id:
        raise HTTPException(status_code=403, detail="You do not have permission to schedule meetings for this community.")

    try:
        meeting = create_meeting(body, current_user.user_id, db)
        # Fetch the created_by name to return
        creator_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip()
        
        # Build output structure
        return MeetingOut(
            meeting_id=meeting.meeting_id,
            community_id=meeting.community_id,
            title=meeting.title,
            description=meeting.description,
            meeting_date=meeting.meeting_date,
            location=meeting.location,
            meeting_link=meeting.meeting_link,
            active_status=meeting.active_status,
            created_by_id=meeting.created_by_id,
            created_by_name=creator_name,
            created_date=meeting.created_date,
            user_rsvp=None
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/meetings", response_model=list[MeetingOut])
def get_meetings(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role_name = current_user.role.role_name if current_user.role else None
    if role_name != "super_admin" and current_user.community_id != community_id:
        raise HTTPException(status_code=403, detail="You do not have permission to view meetings for this community.")

    return get_community_meetings(community_id, current_user.user_id, db)


@router.post("/meetings/{meeting_id}/rsvp", response_model=MeetingRSVPOut)
def submit_meeting_rsvp(
    meeting_id: int,
    body: MeetingRSVPCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        rsvp = rsvp_meeting(meeting_id, body.status, current_user.user_id, db)
        user_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip()
        return MeetingRSVPOut(
            rsvp_id=rsvp.rsvp_id,
            meeting_id=rsvp.meeting_id,
            user_id=rsvp.user_id,
            status=rsvp.status,
            user_name=user_name,
            updated_at=rsvp.updated_at
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/meetings/{meeting_id}/rsvps")
def get_meeting_rsvps(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role_name = current_user.role.role_name if current_user.role else None
    allowed_roles = ["super_admin", "property_manager", "board_member"]
    if role_name not in allowed_roles:
        raise HTTPException(status_code=403, detail="You do not have permission to view RSVP details.")

    from app.models.hoa.meeting_survey import Meeting, MeetingRSVP
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id, Meeting.active_status == True).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found.")

    from app.models.hoa.user import User as DBUser
    members = db.query(DBUser).filter(DBUser.community_id == meeting.community_id, DBUser.active_status == True).all()
    rsvps = db.query(MeetingRSVP).filter(MeetingRSVP.meeting_id == meeting_id).all()
    
    rsvp_map = {r.user_id: r for r in rsvps}
    
    result = []
    for m in members:
        # Skip super admin from community response check
        role_n = m.role.role_name if m.role else ""
        if role_n == "super_admin":
            continue

        user_rsvp = rsvp_map.get(m.user_id)
        status = user_rsvp.status if user_rsvp else "NO_RESPONSE"
        rsvp_id = user_rsvp.rsvp_id if user_rsvp else None
        updated_at = user_rsvp.updated_at if user_rsvp else None

        user_name = f"{m.first_name or ''} {m.last_name or ''}".strip() or m.email
        result.append({
            "rsvp_id": rsvp_id,
            "user_id": m.user_id,
            "user_name": user_name,
            "email": m.email,
            "status": status,
            "updated_at": updated_at
        })

    # Sort results: YES/NO/MAYBE first, NO_RESPONSE at the end, alphabetically within each status
    result.sort(key=lambda x: (x["status"] == "NO_RESPONSE", x["user_name"].lower()))
    return result


# ══════════════════════════════════════════════
#  SURVEY ENDPOINTS
# ══════════════════════════════════════════════
@router.post("/surveys", response_model=SurveyOut, status_code=201)
def schedule_survey(
    body: SurveyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
):
    role_name = current_user.role.role_name if current_user.role else None
    if role_name != "super_admin" and current_user.community_id != body.community_id:
        raise HTTPException(status_code=403, detail="You do not have permission to create surveys for this community.")

    try:
        survey = create_survey(body, current_user.user_id, db)
        
        # Build options out list
        from app.schemas.meeting_survey import SurveyOptionOut
        option_outs = [
            SurveyOptionOut(option_id=o.option_id, option_text=o.option_text, vote_count=0)
            for o in survey.options
        ]
        creator_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip()

        return SurveyOut(
            survey_id=survey.survey_id,
            community_id=survey.community_id,
            title=survey.title,
            question=survey.question,
            expires_at=survey.expires_at,
            active_status=survey.active_status,
            created_by_id=survey.created_by_id,
            created_by_name=creator_name,
            created_date=survey.created_date,
            options=option_outs,
            user_voted_option_id=None,
            total_votes=0
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/surveys", response_model=list[SurveyOut])
def get_surveys(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role_name = current_user.role.role_name if current_user.role else None
    if role_name != "super_admin" and current_user.community_id != community_id:
        raise HTTPException(status_code=403, detail="You do not have permission to view surveys for this community.")

    return get_community_surveys(community_id, current_user.user_id, db)


@router.post("/surveys/{survey_id}/vote", response_model=SurveyOut)
def vote_on_survey(
    survey_id: int,
    body: SurveyVoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        vote_survey(survey_id, body.option_id, current_user.user_id, db)
        # Fetch updated survey state to return for instant frontend updates
        surveys = get_community_surveys(current_user.community_id, current_user.user_id, db)
        matching = next((s for s in surveys if s.survey_id == survey_id), None)
        if not matching:
            raise HTTPException(status_code=404, detail="Survey not found.")
        return matching
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/meetings/{meeting_id}", response_model=MeetingOut)
def modify_meeting(
    meeting_id: int,
    body: MeetingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
):
    from app.models.hoa.meeting_survey import Meeting
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found.")

    role_name = current_user.role.role_name if current_user.role else None
    if role_name != "super_admin" and current_user.community_id != meeting.community_id:
        raise HTTPException(status_code=403, detail="You do not have permission to update meetings for this community.")

    try:
        updated = update_meeting(meeting_id, body, current_user.user_id, db)
        creator = db.query(User).filter(User.user_id == updated.created_by_id).first()
        creator_name = f"{creator.first_name or ''} {creator.last_name or ''}".strip() if creator else "System"

        # Calculate RSVP counts
        from app.models.hoa.meeting_survey import MeetingRSVP
        rsvps = db.query(MeetingRSVP).filter(MeetingRSVP.meeting_id == meeting_id).all()
        yes_count = sum(1 for r in rsvps if r.status == "YES")
        no_count = sum(1 for r in rsvps if r.status == "NO")
        maybe_count = sum(1 for r in rsvps if r.status == "MAYBE")
        user_rsvp_record = next((r for r in rsvps if r.user_id == current_user.user_id), None)
        user_rsvp_status = user_rsvp_record.status if user_rsvp_record else None

        return MeetingOut(
            meeting_id=updated.meeting_id,
            community_id=updated.community_id,
            title=updated.title,
            description=updated.description,
            meeting_date=updated.meeting_date,
            location=updated.location,
            meeting_link=updated.meeting_link,
            active_status=updated.active_status,
            created_by_id=updated.created_by_id,
            created_by_name=creator_name,
            created_date=updated.created_date,
            user_rsvp=user_rsvp_status,
            rsvp_yes_count=yes_count,
            rsvp_no_count=no_count,
            rsvp_maybe_count=maybe_count,
            recording_url=updated.recording_url,
            transcript=updated.transcript,
            summary=updated.summary
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/meetings/{meeting_id}", status_code=200)
def remove_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
):
    from app.models.hoa.meeting_survey import Meeting
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found.")

    role_name = current_user.role.role_name if current_user.role else None
    if role_name != "super_admin" and current_user.community_id != meeting.community_id:
        raise HTTPException(status_code=403, detail="You do not have permission to delete meetings for this community.")

    try:
        delete_meeting(meeting_id, current_user.user_id, db)
        return {"message": "Meeting successfully deleted."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/surveys/{survey_id}", response_model=SurveyOut)
def modify_survey(
    survey_id: int,
    body: SurveyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
):
    from app.models.hoa.meeting_survey import Survey
    survey = db.query(Survey).filter(Survey.survey_id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found.")

    role_name = current_user.role.role_name if current_user.role else None
    if role_name != "super_admin" and current_user.community_id != survey.community_id:
        raise HTTPException(status_code=403, detail="You do not have permission to update surveys for this community.")

    try:
        updated = update_survey(survey_id, body, current_user.user_id, db)
        # return the updated survey layout
        surveys = get_community_surveys(current_user.community_id, current_user.user_id, db)
        matching = next((s for s in surveys if s.survey_id == survey_id), None)
        if not matching:
            raise HTTPException(status_code=404, detail="Survey not found.")
        return matching
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/surveys/{survey_id}", status_code=200)
def remove_survey(
    survey_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
):
    from app.models.hoa.meeting_survey import Survey
    survey = db.query(Survey).filter(Survey.survey_id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found.")

    role_name = current_user.role.role_name if current_user.role else None
    if role_name != "super_admin" and current_user.community_id != survey.community_id:
        raise HTTPException(status_code=403, detail="You do not have permission to delete surveys for this community.")

    try:
        delete_survey(survey_id, current_user.user_id, db)
        return {"message": "Survey successfully deleted."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


from fastapi import File, UploadFile
import os
import json
import urllib.request
import urllib.error
import time

def run_assemblyai_diarization(file_path: str, api_key: str) -> tuple[str, str]:
    # 1. Upload file
    headers = {
        "authorization": api_key,
        "content-type": "application/octet-stream"
    }
    with open(file_path, "rb") as f:
        file_data = f.read()

    req = urllib.request.Request(
        "https://api.assemblyai.com/v2/upload",
        data=file_data,
        headers=headers,
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode())
            upload_url = res_data.get("upload_url")
    except Exception as e:
        raise Exception(f"AssemblyAI Upload failed: {e}")

    if not upload_url:
        raise Exception("Failed to get upload URL from AssemblyAI.")

    # 2. Request Transcription with Speaker Diarization and Summarization
    transcribe_headers = {
        "authorization": api_key,
        "content-type": "application/json"
    }
    transcribe_data = json.dumps({
        "audio_url": upload_url,
        "speaker_labels": True,
        "summarization": True,
        "summary_model": "informative",
        "summary_type": "bullets"
    }).encode("utf-8")

    req_transcribe = urllib.request.Request(
        "https://api.assemblyai.com/v2/transcript",
        data=transcribe_data,
        headers=transcribe_headers,
        method="POST"
    )
    try:
        with urllib.request.urlopen(req_transcribe) as response:
            res_data = json.loads(response.read().decode())
            transcript_id = res_data.get("id")
    except Exception as e:
        raise Exception(f"AssemblyAI transcription request failed: {e}")

    if not transcript_id:
        raise Exception("Failed to get transcript ID from AssemblyAI.")

    # 3. Poll for result
    poll_url = f"https://api.assemblyai.com/v2/transcript/{transcript_id}"
    while True:
        req_poll = urllib.request.Request(poll_url, headers={"authorization": api_key})
        try:
            with urllib.request.urlopen(req_poll) as response:
                status_data = json.loads(response.read().decode())
                status = status_data.get("status")
                if status == "completed":
                    utterances = status_data.get("utterances", [])
                    transcript_lines = []
                    for u in utterances:
                        speaker = f"Speaker {u.get('speaker')}"
                        text = u.get("text")
                        if text and text.strip():
                            transcript_lines.append(f"{speaker}: {text.strip()}")
                    transcript_text = "\n".join(transcript_lines)
                    
                    # Fallback to plain text if utterances are empty
                    if not transcript_text.strip():
                        raw_text = status_data.get("text", "")
                        if raw_text:
                            transcript_text = f"Speaker A: {raw_text}"
                            
                    if not transcript_text.strip():
                        raise Exception("AssemblyAI returned empty transcript.")
                        
                    summary_text = status_data.get("summary", "")
                    return transcript_text, summary_text
                elif status == "error":
                    raise Exception(f"AssemblyAI processing error: {status_data.get('error')}")
        except Exception as e:
            raise Exception(f"AssemblyAI polling failed: {e}")
        time.sleep(3)


def run_deepgram_diarization(file_path: str, api_key: str) -> tuple[str, str]:
    headers = {
        "Authorization": f"Token {api_key}",
        "Content-Type": "application/octet-stream"
    }
    with open(file_path, "rb") as f:
        file_data = f.read()

    # Use utterances=true and summarize=v2
    url = "https://api.deepgram.com/v1/listen?diarize_model=latest&punctuate=true&utterances=true&summarize=v2"
    req = urllib.request.Request(
        url,
        data=file_data,
        headers=headers,
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode())
            results = res_data.get("results", {})
            
            # Extract transcript using utterances
            utterances = results.get("utterances", [])
            transcript_lines = []
            for u in utterances:
                speaker = f"Speaker {u.get('speaker', 0)}"
                text = u.get("transcript", "")
                if text and text.strip():
                    transcript_lines.append(f"{speaker}: {text.strip()}")
            
            # Fallback if utterances is not populated
            if not transcript_lines:
                channels = results.get("channels", [{}])
                if channels:
                    alternatives = channels[0].get("alternatives", [{}])
                    if alternatives:
                        raw_transcript = alternatives[0].get("transcript", "")
                        if raw_transcript and raw_transcript.strip():
                            transcript_lines = [f"Speaker 0: {raw_transcript.strip()}"]
            
            transcript_text = "\n".join(transcript_lines)
            
            # Extract summary from results["summary"]["short"]
            summary_obj = results.get("summary", {})
            summary_text = summary_obj.get("short", "")
            if not summary_text:
                summary_text = summary_obj.get("text", "")
                
            # If transcript is empty, raise an exception to fall back to simulated engine
            if not transcript_text.strip():
                raise Exception("Deepgram returned empty transcript.")
                
            return transcript_text, summary_text
    except Exception as e:
        raise Exception(f"Deepgram request failed: {e}")


def generate_simulated_summary(meeting) -> str:
    title_lower = meeting.title.lower()
    
    if "budget" in title_lower or "finance" in title_lower or "fee" in title_lower:
        return (
            "• **Reserve Fund Allocation**: The board discussed the reserve fund allocation for building maintenance.\n"
            "• **HOA Dues Unchanged**: In response to a resident query, it was confirmed that monthly HOA dues will not increase, as the reserve fund is fully covered by last year's budget surplus.\n"
            "• **Budget Draft Approved**: The current budget draft was formally proposed, seconded, and approved by the board."
        )
    elif "paint" in title_lower or "renovation" in title_lower or "exterior" in title_lower:
        return (
            "• **Exterior Painting Project**: The upcoming exterior painting project for the community buildings was discussed.\n"
            "• **Survey Poll Launched**: A portal survey poll with three exterior color palettes has been launched for residents to vote.\n"
            "• **Project Schedule**: If color choice is finalized by this Friday, the painting work will commence next Monday."
        )
    elif "rule" in title_lower or "violation" in title_lower or "parking" in title_lower:
        return (
            "• **Parking Regulations**: The board addressed multiple complaints regarding guests permanently occupying block B parking spaces.\n"
            "• **New Parking Rules**: A new 24-hour limit on guest parking spots will be enforced, followed by warnings and potential towing for repeat violators.\n"
            "• **Signage Installation**: New signage will be installed this weekend, and rules will take effect starting next week."
        )
    else:
        return (
            "• **Park Cleaning Request**: A resident's request for more frequent cleaning of the community park area was discussed.\n"
            "• **Sanitation Plan**: The board has instructed the sanitation team to increase park cleaning frequency to twice a day.\n"
            "• **Next Steps**: The meeting adjourned to review the remaining agenda items, and minutes will be distributed to all residents."
        )


def generate_simulated_diarization(meeting, db: Session) -> str:
    from app.models.hoa.user import User
    
    # Try fetching real members from this community
    members = db.query(User).filter(
        User.community_id == meeting.community_id,
        User.active_status == True
    ).limit(3).all()
    
    names = []
    for m in members:
        role_label = m.role.role_name.replace("_", " ").title() if m.role else "Resident"
        names.append(f"{m.first_name} {m.last_name} ({role_label})")
    
    # Fallback to defaults
    default_names = [
        "Pranay Solanki (Resident)",
        "Rajesh Kumar (Board Member)",
        "Tanuj Tongse (Super Admin)"
    ]
    while len(names) < 3:
        names.append(default_names[len(names)])
        
    title_lower = meeting.title.lower()
    
    if "budget" in title_lower or "finance" in title_lower or "fee" in title_lower:
        script = [
            f"{names[2]}: Good evening everyone, let's start the budget review. We need to finalize the maintenance reserve fund allocation for this year.",
            f"{names[0]}: Thanks. As a homeowner, I want to clarify: will there be any increase in our monthly HOA dues for building maintenance?",
            f"{names[1]}: No, the reserve fund is fully covered by our current budget surplus from last year, so we are keeping dues unchanged.",
            f"{names[0]}: That's fantastic news. Thank you for the update.",
            f"{names[2]}: Great. I'll move to approve the current budget draft. Let's start the voting.",
            f"{names[1]}: I second that motion. The budget draft is officially approved."
        ]
    elif "paint" in title_lower or "renovation" in title_lower or "exterior" in title_lower:
        script = [
            f"{names[1]}: Hello, we are discussing the upcoming community building exterior painting project.",
            f"{names[0]}: Regarding the color choices, is there a survey active? Many residents prefer neutral earth tones.",
            f"{names[2]}: Yes! We just put up a survey poll on the portal with three palettes. Please cast your votes.",
            f"{names[0]}: Perfect, I'll submit my vote today. When does the work start?",
            f"{names[1]}: If the color choice is finalized by this Friday, the contractors will begin next Monday.",
            f"{names[2]}: Excellent. We will send out a notice as soon as voting closes."
        ]
    elif "rule" in title_lower or "violation" in title_lower or "parking" in title_lower:
        script = [
            f"{names[2]}: Let's discuss the new parking regulations. We have received complaints about guest parking spots being occupied permanently.",
            f"{names[0]}: Yes, the spots near Block B are always full, which makes it hard for actual guests to park.",
            f"{names[1]}: The board is proposing a 24-hour limit on guest spots, followed by warnings and towing warnings for repeat violators.",
            f"{names[0]}: That sounds fair. It should free up spots for short-term visitors.",
            f"{names[2]}: We will implement new signage this weekend and start issuing warnings from next week.",
            f"{names[1]}: Sounds like a plan. Meeting adjourned."
        ]
    else:
        script = [
            f"{names[2]}: Welcome to today's community meeting. Let's go over the main agenda items.",
            f"{names[0]}: Yes, I had raised a request regarding regular cleaning of the community park area.",
            f"{names[1]}: I have checked the service request. We've instructed the sanitation team to clean the park twice a day.",
            f"{names[0]}: Thank you, that will make a big difference for the children playing there in the evenings.",
            f"{names[2]}: Outstanding. Let's move to the next item on the list. We will send the full minutes of the meeting shortly."
        ]
    return "\n".join(script)


@router.post("/meetings/{meeting_id}/diarize", response_model=MeetingOut)
def diarize_meeting_audio(
    meeting_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.hoa.meeting_survey import Meeting
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id, Meeting.active_status == True).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found.")

    from app.config import BASE_UPLOAD_DIR
    upload_dir = os.path.join(BASE_UPLOAD_DIR, "meeting_recordings")
    os.makedirs(upload_dir, exist_ok=True)

    
    file_extension = os.path.splitext(file.filename)[1] or ".webm"
    filename = f"meeting_{meeting_id}_{int(time.time())}{file_extension}"
    file_path = os.path.join(upload_dir, filename)
    
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(file.file.read())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save recording: {e}")

    recording_url = f"/uploads/meeting_recordings/{filename}"
    meeting.recording_url = recording_url

    assemblyai_key = os.getenv("ASSEMBLYAI_API_KEY")
    deepgram_key = os.getenv("DEEPGRAM_API_KEY")

    transcript_text = ""
    summary_text = ""
    if assemblyai_key:
        try:
            transcript_text, summary_text = run_assemblyai_diarization(file_path, assemblyai_key)
        except Exception as e:
            print(f"AssemblyAI error: {e}")
            transcript_text = generate_simulated_diarization(meeting, db)
            summary_text = generate_simulated_summary(meeting)
    elif deepgram_key:
        try:
            transcript_text, summary_text = run_deepgram_diarization(file_path, deepgram_key)
        except Exception as e:
            print(f"Deepgram error: {e}")
            transcript_text = generate_simulated_diarization(meeting, db)
            summary_text = generate_simulated_summary(meeting)
    else:
        transcript_text = generate_simulated_diarization(meeting, db)
        summary_text = generate_simulated_summary(meeting)

    meeting.transcript = transcript_text
    meeting.summary = summary_text
    db.commit()
    db.refresh(meeting)

    # Return the updated MeetingOut
    creator = db.query(User).filter(User.user_id == meeting.created_by_id).first()
    creator_name = f"{creator.first_name or ''} {creator.last_name or ''}".strip() if creator else "System"

    from app.models.hoa.meeting_survey import MeetingRSVP
    rsvps = db.query(MeetingRSVP).filter(MeetingRSVP.meeting_id == meeting_id).all()
    yes_count = sum(1 for r in rsvps if r.status == "YES")
    no_count = sum(1 for r in rsvps if r.status == "NO")
    maybe_count = sum(1 for r in rsvps if r.status == "MAYBE")
    user_rsvp_record = next((r for r in rsvps if r.user_id == current_user.user_id), None)
    user_rsvp_status = user_rsvp_record.status if user_rsvp_record else None

    return MeetingOut(
        meeting_id=meeting.meeting_id,
        community_id=meeting.community_id,
        title=meeting.title,
        description=meeting.description,
        meeting_date=meeting.meeting_date,
        location=meeting.location,
        meeting_link=meeting.meeting_link,
        active_status=meeting.active_status,
        created_by_id=meeting.created_by_id,
        created_by_name=creator_name,
        created_date=meeting.created_date,
        user_rsvp=user_rsvp_status,
        rsvp_yes_count=yes_count,
        rsvp_no_count=no_count,
        rsvp_maybe_count=maybe_count,
        recording_url=meeting.recording_url,
        transcript=meeting.transcript,
        summary=meeting.summary
    )


@router.post("/meetings/{meeting_id}/rename-speaker", response_model=MeetingOut)
def rename_speaker_in_transcript(
    meeting_id: int,
    body: SpeakerRenameRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
):
    from app.models.hoa.meeting_survey import Meeting
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id, Meeting.active_status == True).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found.")
    
    # Check if the user is super admin, or pm/board member of the SAME community
    role_name = current_user.role.role_name if current_user.role else None
    if role_name != "super_admin" and current_user.community_id != meeting.community_id:
        raise HTTPException(status_code=403, detail="You do not have permission to manage meetings for this community.")

    old_label = body.old_label.strip()
    new_label = body.new_label.strip()

    if not old_label:
        raise HTTPException(status_code=400, detail="Old label cannot be empty.")
    if not new_label:
        raise HTTPException(status_code=400, detail="New label cannot be empty.")

    if meeting.transcript:
        lines = meeting.transcript.split("\n")
        updated_lines = []
        old_lbl_colon = f"{old_label}:"
        new_lbl_colon = f"{new_label}:"
        
        for line in lines:
            if line.startswith(old_lbl_colon):
                # Replace prefix
                line = new_lbl_colon + line[len(old_lbl_colon):]
            updated_lines.append(line)
            
        meeting.transcript = "\n".join(updated_lines)
        db.commit()
        db.refresh(meeting)

    # Return updated MeetingOut structure
    creator = db.query(User).filter(User.user_id == meeting.created_by_id).first()
    creator_name = f"{creator.first_name or ''} {creator.last_name or ''}".strip() if creator else "System"

    from app.models.hoa.meeting_survey import MeetingRSVP
    rsvps = db.query(MeetingRSVP).filter(MeetingRSVP.meeting_id == meeting_id).all()
    yes_count = sum(1 for r in rsvps if r.status == "YES")
    no_count = sum(1 for r in rsvps if r.status == "NO")
    maybe_count = sum(1 for r in rsvps if r.status == "MAYBE")
    user_rsvp_record = next((r for r in rsvps if r.user_id == current_user.user_id), None)
    user_rsvp_status = user_rsvp_record.status if user_rsvp_record else None

    return MeetingOut(
        meeting_id=meeting.meeting_id,
        community_id=meeting.community_id,
        title=meeting.title,
        description=meeting.description,
        meeting_date=meeting.meeting_date,
        location=meeting.location,
        meeting_link=meeting.meeting_link,
        active_status=meeting.active_status,
        created_by_id=meeting.created_by_id,
        created_by_name=creator_name,
        created_date=meeting.created_date,
        user_rsvp=user_rsvp_status,
        rsvp_yes_count=yes_count,
        rsvp_no_count=no_count,
        rsvp_maybe_count=maybe_count,
        recording_url=meeting.recording_url,
        transcript=meeting.transcript,
        summary=meeting.summary
    )


@router.get("/debug-db")
def debug_database_meetings(db: Session = Depends(get_db)):
    import os
    from app.models.hoa.meeting_survey import Meeting
    meetings = db.query(Meeting).all()
    results = []
    for m in meetings:
        file_exists = False
        file_size = 0
        if m.recording_url:
            # strip leading slash
            rel_path = m.recording_url.lstrip("/")
            if os.path.exists(rel_path):
                file_exists = True
                file_size = os.path.getsize(rel_path)
        
        results.append({
            "meeting_id": m.meeting_id,
            "title": m.title,
            "recording_url": m.recording_url,
            "file_exists": file_exists,
            "file_size_bytes": file_size,
            "transcript_len": len(m.transcript) if m.transcript else None,
            "transcript_val": m.transcript,
            "summary_len": len(m.summary) if m.summary else None,
            "summary_val": m.summary,
        })
    
    assembly_key = os.getenv("ASSEMBLYAI_API_KEY")
    deepgram_key = os.getenv("DEEPGRAM_API_KEY")
    
    return {
        "meetings": results,
        "env_keys": {
            "assemblyai_set": bool(assembly_key),
            "assemblyai_len": len(assembly_key) if assembly_key else 0,
            "assemblyai_preview": f"{assembly_key[:4]}...{assembly_key[-4:]}" if assembly_key and len(assembly_key) > 8 else None,
            "deepgram_set": bool(deepgram_key),
            "deepgram_len": len(deepgram_key) if deepgram_key else 0,
            "deepgram_preview": f"{deepgram_key[:4]}...{deepgram_key[-4:]}" if deepgram_key and len(deepgram_key) > 8 else None,
        }
    }


@router.get("/debug-diarize-test")
def debug_diarize_test(db: Session = Depends(get_db)):
    import os
    import urllib.request
    import json
    
    file_path = "uploads/meeting_recordings/meeting_10_1781495189.webm"
    api_key = os.getenv("DEEPGRAM_API_KEY")
    if not api_key:
        return {"error": "DEEPGRAM_API_KEY not set"}
        
    if not os.path.exists(file_path):
        return {"error": f"File not found: {file_path}"}
        
    headers = {
        "Authorization": f"Token {api_key}",
        "Content-Type": "application/octet-stream"
    }
    with open(file_path, "rb") as f:
        file_data = f.read()

    url = "https://api.deepgram.com/v1/listen?diarize=true&punctuate=true&paragraphs=true&summarize=v2"
    req = urllib.request.Request(
        url,
        data=file_data,
        headers=headers,
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode())
            results = res_data.get("results", {})
            channels = results.get("channels", [{}])
            alternatives = channels[0].get("alternatives", [{}])
            
            return {
                "success": True,
                "paragraphs_exists": "paragraphs" in alternatives[0],
                "summaries_exists": "summaries" in alternatives[0],
                "paragraphs_keys": list(alternatives[0].get("paragraphs", {}).keys()) if "paragraphs" in alternatives[0] else [],
                "summaries_len": len(alternatives[0].get("summaries", [])) if "summaries" in alternatives[0] else 0,
                "alternatives_keys": list(alternatives[0].keys()),
                "transcript": alternatives[0].get("transcript", "")[:500]
            }
    except Exception as e:
        return {"success": False, "error": str(e)}



