from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.meeting_survey import Meeting, MeetingRSVP, Survey, SurveyOption, SurveyVote
from app.models.user import User
from app.schemas.meeting_survey import (
    MeetingCreate, MeetingOut, MeetingRSVPOut,
    SurveyCreate, SurveyOut, SurveyOptionOut,
    MeetingUpdate, SurveyUpdate
)
from app.services.audit_service import log_action


# ══════════════════════════════════════════════
#  MEETING SERVICES
# ══════════════════════════════════════════════
def create_meeting(data: MeetingCreate, user_id: int, db: Session) -> Meeting:
    # Verify user exists
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise ValueError("User not found.")

    meeting = Meeting(
        community_id=data.community_id,
        title=data.title.strip(),
        description=data.description.strip(),
        meeting_date=data.meeting_date,
        location=data.location.strip() if data.location else None,
        meeting_link=data.meeting_link.strip() if data.meeting_link else None,
        created_by_id=user_id,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    log_action(
        db=db,
        action="CREATE_MEETING",
        module="meeting",
        description=f"Meeting scheduled: '{meeting.title}' on {meeting.meeting_date} (Community ID: {meeting.community_id})",
        user_id=user_id,
        community_id=meeting.community_id
    )
    return meeting


def get_community_meetings(community_id: int, user_id: int, db: Session) -> list[MeetingOut]:
    meetings = (
        db.query(Meeting)
        .filter(Meeting.community_id == community_id, Meeting.active_status == True)
        .order_by(Meeting.meeting_date.desc())
        .all()
    )

    results = []
    for m in meetings:
        # Fetch created_by user full name
        creator = db.query(User).filter(User.user_id == m.created_by_id).first()
        creator_name = f"{creator.first_name or ''} {creator.last_name or ''}".strip() if creator else "System"

        # Calculate RSVPs counts
        rsvps = db.query(MeetingRSVP).filter(MeetingRSVP.meeting_id == m.meeting_id).all()
        yes_count = sum(1 for r in rsvps if r.status == "YES")
        no_count = sum(1 for r in rsvps if r.status == "NO")
        maybe_count = sum(1 for r in rsvps if r.status == "MAYBE")

        # Check current user's RSVP status
        user_rsvp_record = next((r for r in rsvps if r.user_id == user_id), None)
        user_rsvp_status = user_rsvp_record.status if user_rsvp_record else None

        results.append(
            MeetingOut(
                meeting_id=m.meeting_id,
                community_id=m.community_id,
                title=m.title,
                description=m.description,
                meeting_date=m.meeting_date,
                location=m.location,
                meeting_link=m.meeting_link,
                active_status=m.active_status,
                created_by_id=m.created_by_id,
                created_by_name=creator_name,
                created_date=m.created_date,
                user_rsvp=user_rsvp_status,
                rsvp_yes_count=yes_count,
                rsvp_no_count=no_count,
                rsvp_maybe_count=maybe_count
            )
        )
    return results


def rsvp_meeting(meeting_id: int, status: str, user_id: int, db: Session) -> MeetingRSVP:
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id, Meeting.active_status == True).first()
    if not meeting:
        raise ValueError("Meeting not found or inactive.")

    rsvp = db.query(MeetingRSVP).filter(
        MeetingRSVP.meeting_id == meeting_id,
        MeetingRSVP.user_id == user_id
    ).first()

    if rsvp:
        rsvp.status = status.upper()
    else:
        rsvp = MeetingRSVP(
            meeting_id=meeting_id,
            user_id=user_id,
            status=status.upper()
        )
        db.add(rsvp)

    db.commit()
    db.refresh(rsvp)

    log_action(
        db=db,
        action="RSVP_MEETING",
        module="meeting",
        description=f"User RSVP response: '{rsvp.status}' for meeting ID {meeting_id}",
        user_id=user_id,
        community_id=meeting.community_id
    )
    return rsvp


# ══════════════════════════════════════════════
#  SURVEY SERVICES
# ══════════════════════════════════════════════
def create_survey(data: SurveyCreate, user_id: int, db: Session) -> Survey:
    # Verify user exists
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise ValueError("User not found.")

    survey = Survey(
        community_id=data.community_id,
        title=data.title.strip(),
        question=data.question.strip(),
        expires_at=data.expires_at,
        created_by_id=user_id
    )
    db.add(survey)
    db.commit()
    db.refresh(survey)

    # Save options
    for opt_text in data.options:
        opt = SurveyOption(
            survey_id=survey.survey_id,
            option_text=opt_text.strip()
        )
        db.add(opt)
    
    db.commit()
    db.refresh(survey)

    log_action(
        db=db,
        action="CREATE_SURVEY",
        module="survey",
        description=f"Survey/Poll created: '{survey.title}' (Community ID: {survey.community_id})",
        user_id=user_id,
        community_id=survey.community_id
    )
    return survey


def get_community_surveys(community_id: int, user_id: int, db: Session) -> list[SurveyOut]:
    surveys = (
        db.query(Survey)
        .filter(Survey.community_id == community_id, Survey.active_status == True)
        .order_by(Survey.created_date.desc())
        .all()
    )

    results = []
    for s in surveys:
        # Fetch creator details
        creator = db.query(User).filter(User.user_id == s.created_by_id).first()
        creator_name = f"{creator.first_name or ''} {creator.last_name or ''}".strip() if creator else "System"

        # Fetch option vote details
        options = db.query(SurveyOption).filter(SurveyOption.survey_id == s.survey_id).all()
        option_outs = []
        for o in options:
            vote_count = db.query(SurveyVote).filter(SurveyVote.option_id == o.option_id).count()
            option_outs.append(
                SurveyOptionOut(
                    option_id=o.option_id,
                    option_text=o.option_text,
                    vote_count=vote_count
                )
            )

        # Total votes
        total_votes = db.query(SurveyVote).filter(SurveyVote.survey_id == s.survey_id).count()

        # Check if current user voted
        user_vote = db.query(SurveyVote).filter(
            SurveyVote.survey_id == s.survey_id,
            SurveyVote.user_id == user_id
        ).first()
        user_voted_opt = user_vote.option_id if user_vote else None

        results.append(
            SurveyOut(
                survey_id=s.survey_id,
                community_id=s.community_id,
                title=s.title,
                question=s.question,
                expires_at=s.expires_at,
                active_status=s.active_status,
                created_by_id=s.created_by_id,
                created_by_name=creator_name,
                created_date=s.created_date,
                options=option_outs,
                user_voted_option_id=user_voted_opt,
                total_votes=total_votes
            )
        )
    return results


def vote_survey(survey_id: int, option_id: int, user_id: int, db: Session) -> SurveyVote:
    survey = db.query(Survey).filter(Survey.survey_id == survey_id, Survey.active_status == True).first()
    if not survey:
        raise ValueError("Survey not found or inactive.")

    # Check if survey has expired
    # Compare timezone-aware
    now = datetime.now(timezone.utc)
    expires = survey.expires_at.replace(tzinfo=timezone.utc) if survey.expires_at.tzinfo is None else survey.expires_at
    if now > expires:
        raise ValueError("This survey/poll has expired and is closed for voting.")

    # Check if option exists for this survey
    option = db.query(SurveyOption).filter(
        SurveyOption.option_id == option_id,
        SurveyOption.survey_id == survey_id
    ).first()
    if not option:
        raise ValueError("Selected option is invalid for this survey.")

    # Check if user already voted
    existing_vote = db.query(SurveyVote).filter(
        SurveyVote.survey_id == survey_id,
        SurveyVote.user_id == user_id
    ).first()
    if existing_vote:
        raise ValueError("You have already voted on this survey.")

    vote = SurveyVote(
        survey_id=survey_id,
        option_id=option_id,
        user_id=user_id
    )
    db.add(vote)
    db.commit()
    db.refresh(vote)

    log_action(
        db=db,
        action="VOTE_SURVEY",
        module="survey",
        description=f"User voted on option {option_id} for survey ID {survey_id}",
        user_id=user_id,
        community_id=survey.community_id
    )
    return vote


def update_meeting(meeting_id: int, data: MeetingUpdate, user_id: int, db: Session) -> Meeting:
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id, Meeting.active_status == True).first()
    if not meeting:
        raise ValueError("Meeting not found.")

    if data.title is not None:
        meeting.title = data.title.strip()
    if data.description is not None:
        meeting.description = data.description.strip()
    if data.meeting_date is not None:
        meeting.meeting_date = data.meeting_date
    if data.location is not None:
        meeting.location = data.location.strip()
    if data.meeting_link is not None:
        meeting.meeting_link = data.meeting_link.strip()

    meeting.modified_by_id = user_id
    db.commit()
    db.refresh(meeting)

    log_action(
        db=db,
        action="UPDATE_MEETING",
        module="meeting",
        description=f"Meeting updated: '{meeting.title}' (Meeting ID: {meeting_id}) by user_id {user_id}",
        user_id=user_id,
        community_id=meeting.community_id
    )
    return meeting


def delete_meeting(meeting_id: int, user_id: int, db: Session) -> bool:
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id, Meeting.active_status == True).first()
    if not meeting:
        raise ValueError("Meeting not found.")

    meeting.active_status = False
    meeting.modified_by_id = user_id
    db.commit()

    log_action(
        db=db,
        action="DELETE_MEETING",
        module="meeting",
        description=f"Meeting deleted: '{meeting.title}' (Meeting ID: {meeting_id}) by user_id {user_id}",
        user_id=user_id,
        community_id=meeting.community_id
    )
    return True


def update_survey(survey_id: int, data: SurveyUpdate, user_id: int, db: Session) -> Survey:
    survey = db.query(Survey).filter(Survey.survey_id == survey_id, Survey.active_status == True).first()
    if not survey:
        raise ValueError("Survey not found.")

    if data.title is not None:
        survey.title = data.title.strip()
    if data.question is not None:
        survey.question = data.question.strip()
    if data.expires_at is not None:
        survey.expires_at = data.expires_at

    survey.modified_by_id = user_id
    db.commit()
    db.refresh(survey)

    log_action(
        db=db,
        action="UPDATE_SURVEY",
        module="survey",
        description=f"Survey updated: '{survey.title}' (Survey ID: {survey_id}) by user_id {user_id}",
        user_id=user_id,
        community_id=survey.community_id
    )
    return survey


def delete_survey(survey_id: int, user_id: int, db: Session) -> bool:
    survey = db.query(Survey).filter(Survey.survey_id == survey_id, Survey.active_status == True).first()
    if not survey:
        raise ValueError("Survey not found.")

    survey.active_status = False
    survey.modified_by_id = user_id
    db.commit()

    log_action(
        db=db,
        action="DELETE_SURVEY",
        module="survey",
        description=f"Survey deleted: '{survey.title}' (Survey ID: {survey_id}) by user_id {user_id}",
        user_id=user_id,
        community_id=survey.community_id
    )
    return True
