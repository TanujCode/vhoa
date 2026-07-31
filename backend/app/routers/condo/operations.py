import random
import string
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.routers.condo.dependencies import require_condo_role
from app.models.condo import (
    CondoDocument, CondoPayment, 
    CondoParkingAllocation, CondoParkingChangeRequest, CondoVisitorPass, CondoParcelLog, CondoUser
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
        if not assigned_user:
            raise HTTPException(status_code=404, detail="Resident email not found in condo database.")
        
        # Validate that the user doesn't already have another spot allocated
        already_allocated = db.query(CondoParkingAllocation).filter(
            CondoParkingAllocation.community_id == comm_id,
            CondoParkingAllocation.assigned_user_id == assigned_user.user_id,
            CondoParkingAllocation.unit_no != unit_no
        ).first()
        if already_allocated:
            raise HTTPException(
                status_code=400, 
                detail=f"Resident {assigned_user.full_name} is already allocated to spot {already_allocated.parking_spot_no} (Unit {already_allocated.unit_no})."
            )

    # Validate that the requested parking spot is not already allocated to another unit
    if spot_no and spot_no.strip():
        spot_conflict = db.query(CondoParkingAllocation).filter(
            CondoParkingAllocation.community_id == comm_id,
            CondoParkingAllocation.parking_spot_no == spot_no.strip(),
            CondoParkingAllocation.unit_no != unit_no
        ).first()
        if spot_conflict:
            raise HTTPException(
                status_code=400,
                detail=f"Parking spot '{spot_no}' is already allocated to Unit {spot_conflict.unit_no}."
            )

    # Validate that the requested storage locker is not already allocated to another unit
    if locker_no and locker_no.strip():
        locker_conflict = db.query(CondoParkingAllocation).filter(
            CondoParkingAllocation.community_id == comm_id,
            CondoParkingAllocation.locker_no == locker_no.strip(),
            CondoParkingAllocation.unit_no != unit_no
        ).first()
        if locker_conflict:
            raise HTTPException(
                status_code=400,
                detail=f"Storage locker '{locker_no}' is already allocated to Unit {locker_conflict.unit_no}."
            )

    # Look for existing allocation for that unit
    existing = db.query(CondoParkingAllocation).filter(
        CondoParkingAllocation.community_id == comm_id,
        CondoParkingAllocation.unit_no == unit_no
    ).first()

    if existing:
        existing.parking_spot_no = spot_no
        existing.locker_no = locker_no
        existing.has_ev_charger = ev_charger
        existing.assigned_user_id = assigned_user.user_id if assigned_user else None
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


@router.delete("/parking/{allocation_id}")
def delete_condo_parking_allocation(
    allocation_id: int,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member"))
):
    alloc = db.query(CondoParkingAllocation).filter(CondoParkingAllocation.allocation_id == allocation_id).first()
    if not alloc:
        raise HTTPException(status_code=404, detail="Parking allocation not found")
    db.delete(alloc)
    db.commit()
    return {"message": "Parking allocation released successfully"}


@router.get("/parking/change-requests")
def get_condo_parking_change_requests(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member", "resident"))
):
    query = db.query(CondoParkingChangeRequest).filter(CondoParkingChangeRequest.community_id == community_id)
    if current_user.role.role_name == "resident":
        query = query.filter(CondoParkingChangeRequest.user_id == current_user.user_id)
    
    requests = query.order_by(CondoParkingChangeRequest.created_date.desc()).all()
    
    out = []
    for r in requests:
        out.append({
            "request_id": r.request_id,
            "community_id": r.community_id,
            "user_id": r.user_id,
            "current_spot_no": r.current_spot_no,
            "requested_spot_no": r.requested_spot_no,
            "reason": r.reason,
            "status": r.status,
            "created_date": r.created_date,
            "reviewed_date": r.reviewed_date,
            "rejection_reason": r.rejection_reason,
            "user": {
                "full_name": r.user.full_name,
                "email_id": r.user.email_id,
                "unit_no": r.user.unit_no
            } if r.user else None
        })
    return out


@router.post("/parking/change-requests")
def create_condo_parking_change_request(
    body: dict,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("resident"))
):
    comm_id = body.get("community_id")
    requested_spot = body.get("requested_spot_no")
    reason = body.get("reason")

    if not comm_id or not reason:
        raise HTTPException(status_code=400, detail="Community ID and reason are required.")

    current_alloc = db.query(CondoParkingAllocation).filter(
        CondoParkingAllocation.community_id == comm_id,
        CondoParkingAllocation.assigned_user_id == current_user.user_id
    ).first()

    current_spot = current_alloc.parking_spot_no if current_alloc else None

    existing = db.query(CondoParkingChangeRequest).filter(
        CondoParkingChangeRequest.community_id == comm_id,
        CondoParkingChangeRequest.user_id == current_user.user_id,
        CondoParkingChangeRequest.status == "PENDING"
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending change request.")

    new_req = CondoParkingChangeRequest(
        community_id=comm_id,
        user_id=current_user.user_id,
        current_spot_no=current_spot,
        requested_spot_no=requested_spot.strip() if requested_spot else None,
        reason=reason.strip(),
        status="PENDING"
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    return new_req


@router.put("/parking/change-requests/{request_id}/review")
def review_condo_parking_change_request(
    request_id: int,
    body: dict,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member"))
):
    action = body.get("action")
    rejection_reason = body.get("rejection_reason")
    new_spot = body.get("new_parking_spot_no")
    new_locker = body.get("new_locker_no")
    new_ev = body.get("new_has_ev_charger", False)

    if action not in ["APPROVE", "REJECT"]:
        raise HTTPException(status_code=400, detail="Action must be APPROVE or REJECT.")

    req = db.query(CondoParkingChangeRequest).filter(CondoParkingChangeRequest.request_id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Change request not found.")

    if req.status != "PENDING":
        raise HTTPException(status_code=400, detail="This request has already been reviewed.")

    if action == "REJECT":
        if not rejection_reason:
            raise HTTPException(status_code=400, detail="Rejection reason is required.")
        req.status = "REJECTED"
        req.rejection_reason = rejection_reason.strip()
        req.reviewed_date = datetime.now(timezone.utc)
        db.commit()
        db.refresh(req)
        return req

    req.status = "APPROVED"
    req.reviewed_date = datetime.now(timezone.utc)

    user = db.query(CondoUser).filter(CondoUser.user_id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User associated with request not found.")

    alloc = db.query(CondoParkingAllocation).filter(
        CondoParkingAllocation.community_id == req.community_id,
        CondoParkingAllocation.unit_no == user.unit_no
    ).first()

    final_spot = new_spot.strip() if new_spot else (req.requested_spot_no or req.current_spot_no)

    if alloc:
        alloc.parking_spot_no = final_spot
        if new_locker:
            alloc.locker_no = new_locker.strip()
        alloc.has_ev_charger = new_ev
        alloc.assigned_user_id = user.user_id
    else:
        alloc = CondoParkingAllocation(
            community_id=req.community_id,
            unit_no=user.unit_no,
            parking_spot_no=final_spot,
            locker_no=new_locker.strip() if new_locker else None,
            has_ev_charger=new_ev,
            assigned_user_id=user.user_id
        )
        db.add(alloc)

    db.commit()
    db.refresh(req)
    return req


@router.put("/visitors/verify")
def verify_condo_visitor_pass(
    body: dict,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member", "security_guard", "front_desk_concierge"))
):
    otp = body.get("otp_code")
    comm_id = body.get("community_id")

    if not otp or not comm_id:
        raise HTTPException(status_code=400, detail="OTP code and community ID are required.")

    visitor_pass = db.query(CondoVisitorPass).filter(
        CondoVisitorPass.community_id == comm_id,
        CondoVisitorPass.otp_code == otp.strip(),
        CondoVisitorPass.status == "ACTIVE"
    ).first()

    if not visitor_pass:
        raise HTTPException(status_code=404, detail="No active visitor pass found with this code.")

    visitor_pass.status = "USED"
    visitor_pass.check_in_time = datetime.now(timezone.utc)
    db.commit()
    db.refresh(visitor_pass)
    
    return {
        "pass_id": visitor_pass.pass_id,
        "guest_name": visitor_pass.guest_name,
        "guest_phone": visitor_pass.guest_phone,
        "vehicle_no": visitor_pass.vehicle_no,
        "status": visitor_pass.status,
        "check_in_time": visitor_pass.check_in_time,
        "resident_name": visitor_pass.resident.full_name if visitor_pass.resident else "N/A",
        "unit_no": visitor_pass.resident.unit_no if visitor_pass.resident else "N/A"
    }


@router.put("/visitors/{pass_id}/check-out")
def check_out_condo_visitor_pass(
    pass_id: int,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member", "security_guard", "front_desk_concierge"))
):
    visitor_pass = db.query(CondoVisitorPass).filter(CondoVisitorPass.pass_id == pass_id).first()
    if not visitor_pass:
        raise HTTPException(status_code=404, detail="Visitor pass not found.")

    if visitor_pass.status != "USED":
        raise HTTPException(status_code=400, detail="Visitor pass is not currently checked-in.")

    visitor_pass.status = "EXPIRED"
    visitor_pass.check_out_time = datetime.now(timezone.utc)
    db.commit()
    db.refresh(visitor_pass)
    return visitor_pass


# ─── VISITORS ───

@router.get("/visitors")
def get_condo_visitor_passes(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member", "resident", "security_guard", "front_desk_concierge"))
):
    query = db.query(CondoVisitorPass).filter(CondoVisitorPass.community_id == community_id)
    role_name = current_user.role.role_name if current_user.role else ""
    if role_name == "resident":
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


@router.delete("/visitors/{pass_id}")
def delete_condo_visitor_pass(
    pass_id: int,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member", "resident"))
):
    visitor_pass = db.query(CondoVisitorPass).filter(CondoVisitorPass.pass_id == pass_id).first()
    if not visitor_pass:
        raise HTTPException(status_code=404, detail="Visitor pass not found.")

    role_name = current_user.role.role_name if current_user.role else ""
    if role_name == "resident" and visitor_pass.resident_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this pass.")

    db.delete(visitor_pass)
    db.commit()
    return {"message": "Visitor pass deleted successfully."}


# ─── PARCELS ───

@router.get("/parcels")
def get_condo_parcel_logs(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member", "resident", "security_guard", "front_desk_concierge"))
):
    query = db.query(CondoParcelLog).filter(CondoParcelLog.community_id == community_id)
    role_name = current_user.role.role_name if current_user.role else ""
    if role_name == "resident":
        query = query.filter(CondoParcelLog.recipient_id == current_user.user_id)
    return query.order_by(CondoParcelLog.received_at.desc()).all()


@router.post("/parcels")
def log_condo_parcel(
    body: dict,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member", "security_guard", "front_desk_concierge"))
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
