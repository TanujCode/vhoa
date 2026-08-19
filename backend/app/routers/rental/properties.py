from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_rental_db
from app.models.rental.rental_user import RentalUser
from app.schemas.rental import PropertyCreate, PropertyOut, UnitCreate, UnitOut, PropertyWithUnitsCreate
from app.services.rental import rental_service
from app.services.rental.audit_service import log_rental_action
from app.routers.rental.dependencies import require_rental_role, get_verified_rental_user

router = APIRouter(prefix="/rental", tags=["Rental - Properties & Units"])

@router.post("/properties-with-units", response_model=PropertyOut, status_code=201)
def create_property_with_units(
    body: PropertyWithUnitsCreate,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    try:
        from app.models.rental.property import Property
        from app.models.rental.unit import Unit
        from sqlalchemy import func
        
        # Check property count limit
        current_properties_count = db.query(func.count(Property.property_id)).filter(
            Property.landlord_id == current_user.user_id,
            Property.active_status == True
        ).scalar() or 0
        if current_properties_count >= 2:
            raise ValueError("Property limit reached. A landlord can register a maximum of 2 properties.")
            
        requested_units_count = len(body.units)
        if requested_units_count > 5:
            raise ValueError(f"Unit limit reached. A property can have a maximum of 5 units. You requested {requested_units_count} units.")

        prop_data = PropertyCreate(
            name=body.name,
            address=body.address,
            city=body.city,
            state=body.state,
            zip_code=body.zip_code
        )
        prop = rental_service.create_property(current_user.user_id, prop_data, db)
        log_rental_action(db, "CREATE_PROPERTY", "rental", f"Property '{prop.name}' created via wizard.", current_user.user_id)
        
        for unit_item in body.units:
            new_unit = Unit(
                property_id=prop.property_id,
                unit_number=unit_item.unit_number,
                rent_amount=unit_item.rent_amount,
                status="VACANT",
                active_status=True
            )
            db.add(new_unit)
            db.commit()
            db.refresh(new_unit)
            log_rental_action(db, "CREATE_UNIT", "rental", f"Unit '{unit_item.unit_number}' added via wizard.", current_user.user_id)
            
        return prop
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/properties", response_model=PropertyOut, status_code=201)
def create_property(
    body: PropertyCreate,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    try:
        prop = rental_service.create_property(current_user.user_id, body, db)
        log_rental_action(db, "CREATE_PROPERTY", "rental", f"Property '{prop.name}' created.", current_user.user_id)
        return prop
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/properties", response_model=List[PropertyOut])
def list_properties(
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord", "tenant"))
):
    rental_role = current_user.role.role_name if current_user.role else ""
    if rental_role == "tenant":
        from app.models.rental.property import Property
        return db.query(Property).filter(Property.active_status == True).order_by(Property.property_id.asc()).all()
    is_super_admin = (rental_role == "super_admin")
    return rental_service.get_properties(current_user.user_id, db, is_super_admin=is_super_admin)


@router.post("/units", response_model=UnitOut, status_code=201)
def create_unit(
    body: UnitCreate,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    try:
        unit = rental_service.create_unit(body, db)
        log_rental_action(db, "CREATE_UNIT", "rental", f"Unit '{unit.unit_number}' added to property {body.property_id}.", current_user.user_id)
        return unit
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/properties/{property_id}/units", response_model=List[UnitOut])
def list_units(
    property_id: int,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_verified_rental_user)
):
    return rental_service.get_units_by_property(property_id, db)


@router.put("/properties/{property_id}", response_model=PropertyOut)
def update_property(
    property_id: int,
    body: PropertyCreate,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    rental_role = current_user.role.role_name if current_user.role else ""
    is_super_admin = (rental_role == "super_admin")
    try:
        prop = rental_service.update_property(property_id, current_user.user_id, body, db, is_super_admin=is_super_admin)
        log_rental_action(db, "UPDATE_PROPERTY", "rental", f"Property '{prop.name}' updated.", current_user.user_id)
        return prop
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/properties/{property_id}")
def delete_property(
    property_id: int,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    rental_role = current_user.role.role_name if current_user.role else ""
    is_super_admin = (rental_role == "super_admin")
    try:
        rental_service.delete_property(property_id, current_user.user_id, db, is_super_admin=is_super_admin)
        log_rental_action(db, "DELETE_PROPERTY", "rental", f"Property {property_id} soft deleted.", current_user.user_id)
        return {"detail": "Property deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/units/{unit_id}")
def delete_unit(
    unit_id: int,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    rental_role = current_user.role.role_name if current_user.role else ""
    is_super_admin = (rental_role == "super_admin")
    try:
        rental_service.delete_unit(unit_id, current_user.user_id, db, is_super_admin=is_super_admin)
        log_rental_action(db, "DELETE_UNIT", "rental", f"Unit {unit_id} soft deleted.", current_user.user_id)
        return {"detail": "Unit deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/units/{unit_id}", response_model=UnitOut)
def update_unit(
    unit_id: int,
    body: UnitCreate,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    rental_role = current_user.role.role_name if current_user.role else ""
    is_super_admin = (rental_role == "super_admin")
    try:
        unit = rental_service.update_unit(unit_id, current_user.user_id, body, db, is_super_admin=is_super_admin)
        log_rental_action(db, "UPDATE_UNIT", "rental", f"Unit '{unit.unit_number}' updated.", current_user.user_id)
        return unit
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
