import random
import string
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.routers.condo.dependencies import require_condo_role
from app.models.condo import (
    CondoDocument, CondoMaintenanceRequest, CondoPayment, 
    CondoParkingAllocation, CondoVisitorPass, CondoParcelLog, CondoUser
)
from app.utils.file_service import save_document

router = APIRouter(prefix="/condo/operations", tags=["Condo - Operations"])


def generate_pass_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


# ─── DOCUMENTS ───

@router.get("/documents")
def get_condo_documents(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member", "resident"))
):
    return db.query(CondoDocument).filter(
        CondoDocument.community_id == community_id,
        CondoDocument.active_status == True
    ).order_by(CondoDocument.created_date.desc()).all()


@router.post("/documents")
async def upload_condo_document(
    community_id: int = Form(...),
    document_name: str = Form(...),
    document_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member"))
):
    try:
        file_url = await save_document(file, folder_name="community_documents")
        new_doc = CondoDocument(
            community_id=community_id,
            document_name=document_name.strip(),
            document_type=document_type.upper().strip(),
            document_url=file_url,
            uploaded_by_id=current_user.user_id,
            active_status=True
        )
        db.add(new_doc)
        db.commit()
        db.refresh(new_doc)
        return new_doc
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/documents/{document_id}")
def delete_condo_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member"))
):
    doc = db.query(CondoDocument).filter(CondoDocument.document_id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.active_status = False
    db.commit()
    return {"message": "Document deleted successfully"}


# ─── MAINTENANCE ───

@router.get("/maintenance")
def get_condo_maintenance_requests(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member", "resident"))
):
    query = db.query(CondoMaintenanceRequest).filter(CondoMaintenanceRequest.community_id == community_id)
    # Residents can only see their own requests
    if current_user.role.role_name == "resident":
        query = query.filter(CondoMaintenanceRequest.created_by_id == current_user.user_id)
    return query.order_by(CondoMaintenanceRequest.created_date.desc()).all()


@router.post("/maintenance")
def create_condo_maintenance_request(
    body: dict,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member", "resident"))
):
    comm_id = body.get("community_id")
    title = body.get("title")
    description = body.get("description")
    category = body.get("category", "OTHER")
    priority = body.get("priority", "MEDIUM")

    if not comm_id or not title or not description:
        raise HTTPException(status_code=400, detail="Community ID, title and description are required.")

    req = CondoMaintenanceRequest(
        community_id=comm_id,
        created_by_id=current_user.user_id,
        title=title.strip(),
        description=description.strip(),
        category=category.upper().strip(),
        priority=priority.upper().strip(),
        status="OPEN"
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.put("/maintenance/{request_id}/status")
def update_condo_maintenance_status(
    request_id: int,
    body: dict,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member"))
):
    new_status = body.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="Status is required")

    req = db.query(CondoMaintenanceRequest).filter(CondoMaintenanceRequest.request_id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Maintenance request not found")

    req.status = new_status.upper().strip()
    if req.status == "RESOLVED":
        req.resolved_date = datetime.now(timezone.utc)
    db.commit()
    db.refresh(req)
    return req


# ─── PAYMENTS ───

@router.get("/payments")
def get_condo_payments(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member", "resident"))
):
    query = db.query(CondoPayment).filter(CondoPayment.community_id == community_id)
    # Residents see their own payments
    if current_user.role.role_name == "resident":
        query = query.filter(CondoPayment.user_id == current_user.user_id)
    return query.order_by(CondoPayment.created_date.desc()).all()


@router.post("/payments")
def create_condo_payment(
    body: dict,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member", "resident"))
):
    comm_id = body.get("community_id")
    amount = body.get("amount")
    pay_type = body.get("payment_type", "MAINTENANCE")
    pay_method = body.get("payment_method", "ACH")
    notes = body.get("notes")

    if not comm_id or amount is None:
        raise HTTPException(status_code=400, detail="Community ID and amount are required.")

    payment = CondoPayment(
        community_id=comm_id,
        user_id=current_user.user_id,
        amount=float(amount),
        payment_type=pay_type.upper().strip(),
        payment_method=pay_method.upper().strip(),
        status="PAID",
        notes=notes,
        payment_date=datetime.now(timezone.utc),
        transaction_id="TXN-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=12))
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


# ─── PARKING ───

@router.get("/parking")
def get_condo_parking_allocations(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member", "resident"))
):
    return db.query(CondoParkingAllocation).filter(CondoParkingAllocation.community_id == community_id).all()


@router.post("/parking")
def allocate_condo_parking(
    body: dict,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member"))
):
    comm_id = body.get("community_id")
    unit_no = body.get("unit_no")
    spot_no = body.get("parking_spot_no")
    locker_no = body.get("locker_no")
    ev_charger = body.get("has_ev_charger", False)
    assigned_email = body.get("assigned_user_email")

    if not comm_id or not unit_no:
        raise HTTPException(status_code=400, detail="Community ID and Unit number are required.")

    assigned_user = None
    if assigned_email:
        assigned_user = db.query(CondoUser).filter(CondoUser.email_id == assigned_email.lower().strip()).first()

    # Look for existing allocation for that spot
    existing = db.query(CondoParkingAllocation).filter(
        CondoParkingAllocation.community_id == comm_id,
        CondoParkingAllocation.unit_no == unit_no
    ).first()

    if existing:
        existing.parking_spot_no = spot_no
        existing.locker_no = locker_no
        existing.has_ev_charger = ev_charger
        if assigned_user:
            existing.assigned_user_id = assigned_user.user_id
        db.commit()
        db.refresh(existing)
        return existing

    new_alloc = CondoParkingAllocation(
        community_id=comm_id,
        unit_no=unit_no,
        parking_spot_no=spot_no,
        locker_no=locker_no,
        has_ev_charger=ev_charger,
        assigned_user_id=assigned_user.user_id if assigned_user else None
    )
    db.add(new_alloc)
    db.commit()
    db.refresh(new_alloc)
    return new_alloc


# ─── VISITORS ───

@router.get("/visitors")
def get_condo_visitor_passes(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member", "resident"))
):
    query = db.query(CondoVisitorPass).filter(CondoVisitorPass.community_id == community_id)
    if current_user.role.role_name == "resident":
        query = query.filter(CondoVisitorPass.resident_id == current_user.user_id)
    return query.order_by(CondoVisitorPass.created_date.desc()).all()


@router.post("/visitors")
def create_condo_visitor_pass(
    body: dict,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member", "resident"))
):
    comm_id = body.get("community_id")
    guest_name = body.get("guest_name")
    guest_phone = body.get("guest_phone")
    vehicle_no = body.get("vehicle_no")

    if not comm_id or not guest_name:
        raise HTTPException(status_code=400, detail="Community ID and Guest Name are required.")

    new_pass = CondoVisitorPass(
        community_id=comm_id,
        resident_id=current_user.user_id,
        guest_name=guest_name.strip(),
        guest_phone=guest_phone,
        vehicle_no=vehicle_no,
        otp_code=generate_pass_otp(),
        status="ACTIVE"
    )
    db.add(new_pass)
    db.commit()
    db.refresh(new_pass)
    return new_pass


# ─── PARCELS ───

@router.get("/parcels")
def get_condo_parcel_logs(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member", "resident"))
):
    query = db.query(CondoParcelLog).filter(CondoParcelLog.community_id == community_id)
    if current_user.role.role_name == "resident":
        query = query.filter(CondoParcelLog.recipient_id == current_user.user_id)
    return query.order_by(CondoParcelLog.received_at.desc()).all()


@router.post("/parcels")
def log_condo_parcel(
    body: dict,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member"))
):
    comm_id = body.get("community_id")
    recipient_email = body.get("recipient_email")
    carrier = body.get("carrier")
    tracking_no = body.get("tracking_no")

    if not comm_id or not recipient_email or not carrier:
        raise HTTPException(status_code=400, detail="Community ID, Recipient Email and Carrier are required.")

    recipient = db.query(CondoUser).filter(CondoUser.email_id == recipient_email.lower().strip()).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient user with this email not found in condo system")

    log = CondoParcelLog(
        community_id=comm_id,
        recipient_id=recipient.user_id,
        carrier=carrier.strip(),
        tracking_no=tracking_no,
        status="RECEIVED"
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.put("/parcels/{parcel_id}/collect")
def collect_condo_parcel(
    parcel_id: int,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member"))
):
    log = db.query(CondoParcelLog).filter(CondoParcelLog.parcel_id == parcel_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Parcel log not found")
    
    log.status = "COLLECTED"
    log.collected_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(log)
    return log
