from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user, require_role, check_community_access
from app.models.user import User
from app.schemas.meeting_survey import (
    MeetingCreate, MeetingOut, MeetingRSVPCreate, MeetingRSVPOut,
    SurveyCreate, SurveyOut, SurveyVoteCreate, MeetingUpdate, SurveyUpdate
)
from app.services.meeting_survey_service import (
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
    # Verify user belongs to community
    check_community_access(current_user, body.community_id, db)

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
    check_community_access(current_user, community_id, db)

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


# ══════════════════════════════════════════════
#  SURVEY ENDPOINTS
# ══════════════════════════════════════════════
@router.post("/surveys", response_model=SurveyOut, status_code=201)
def schedule_survey(
    body: SurveyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
):
    check_community_access(current_user, body.community_id, db)

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
    check_community_access(current_user, community_id, db)

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
        from app.models.meeting_survey import Survey
        survey = db.query(Survey).filter(Survey.survey_id == survey_id).first()
        comm_id = survey.community_id if survey else current_user.community_id
        surveys = get_community_surveys(comm_id, current_user.user_id, db)
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
    from app.models.meeting_survey import Meeting
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found.")

    check_community_access(current_user, meeting.community_id, db)

    try:
        updated = update_meeting(meeting_id, body, current_user.user_id, db)
        creator = db.query(User).filter(User.user_id == updated.created_by_id).first()
        creator_name = f"{creator.first_name or ''} {creator.last_name or ''}".strip() if creator else "System"

        # Calculate RSVP counts
        from app.models.meeting_survey import MeetingRSVP
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
            rsvp_maybe_count=maybe_count
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/meetings/{meeting_id}", status_code=200)
def remove_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
):
    from app.models.meeting_survey import Meeting
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found.")

    check_community_access(current_user, meeting.community_id, db)

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
    from app.models.meeting_survey import Survey
    survey = db.query(Survey).filter(Survey.survey_id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found.")

    check_community_access(current_user, survey.community_id, db)

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
    from app.models.meeting_survey import Survey
    survey = db.query(Survey).filter(Survey.survey_id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found.")

    check_community_access(current_user, survey.community_id, db)

    try:
        delete_survey(survey_id, current_user.user_id, db)
        return {"message": "Survey successfully deleted."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
