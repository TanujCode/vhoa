from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.contact import ContactInquiryCreate, ContactInquiryResponse
from app.services.contact_service import save_contact_inquiry

router = APIRouter(prefix="/contact", tags=["Contact Inquiries"])


@router.post("/submit", response_model=ContactInquiryResponse, status_code=status.HTTP_201_CREATED)
def submit_contact_inquiry(data: ContactInquiryCreate, db: Session = Depends(get_db)):
    """
    Public endpoint to submit a contact inquiry from the marketing website.
    Validates form data, stores the inquiry in the database, and dispatches a thank-you email.
    """
    try:
        inquiry = save_contact_inquiry(data, db)
        return inquiry
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while processing your request: {str(e)}"
        )
