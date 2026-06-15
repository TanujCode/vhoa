import os
import uuid
from fastapi import HTTPException, UploadFile

from app.config import BASE_UPLOAD_DIR

#Config
UPLOAD_DIR = os.path.join(BASE_UPLOAD_DIR, "profile_pictures")   # Dynamic base uploads dir
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp"}
MAX_SIZE_MB = 5
MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

# Create folder if it doesn't exist
os.makedirs(UPLOAD_DIR, exist_ok=True)


async def save_profile_picture(file: UploadFile, user_id: int) -> str:
    """
    Save profile picture in local folder. 

1. File type check only image) 
2. File size check (max 5MB) 
3. Create unique filename 
4. Saved 
5. URL returned 

Returns: URL string which will be stored in DB
    """

    # ── Type check ────────────────────────────────────────
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Only image files allowed (JPEG, PNG, WebP). You uploaded: {file.content_type}"
        )

    # ── Size check ────────────────────────────────────────
    contents = await file.read()
    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File size {MAX_SIZE_MB}should not exceed the maximum limit.."
        )

    # ── Create unique filename ─────────────────────────────
    # Format: profile_<user_id>_<random_uuid>.<extension>
    extension = file.filename.split(".")[-1].lower()
    filename = f"profile_{user_id}_{uuid.uuid4().hex}.{extension}"
    filepath = os.path.join(UPLOAD_DIR, filename)


    # ── Save file ────────────────────────────────────
    with open(filepath, "wb") as f:
        f.write(contents)

    # ── Return URL ───────────────────────────────────
    # Frontend will access the image using this URL
    url = f"/uploads/profile_pictures/{filename}"
    return url


def delete_profile_picture(url: str):
    """
    Delete the old profile picture when a new one is uploaded.
    Extract the file path from the URL and remove the file.
    """
    if not url or url.startswith("data:") or url.startswith("http://") or url.startswith("https://"):
        return

    # Extract filename and resolve with dynamic UPLOAD_DIR
    filename = url.split("/")[-1]
    local_path = os.path.join(UPLOAD_DIR, filename)

    if os.path.exists(local_path):
        os.remove(local_path)


async def save_document(file: UploadFile, folder_name: str) -> str:
    import os, uuid
    from app.config import BASE_UPLOAD_DIR
    ALLOWED = {"application/pdf", "image/jpeg", "image/png", "application/msword",
               "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
    
    # Save folder is dynamic
    folder = os.path.join(BASE_UPLOAD_DIR, folder_name)
    os.makedirs(folder, exist_ok=True)

    if file.content_type not in ALLOWED:
        raise ValueError(f"File type {file.content_type} not allowed.")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise ValueError("File exceeds 10MB limit.")

    ext = file.filename.split(".")[-1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}" 
    filepath = os.path.join(folder, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    return f"/uploads/{folder_name}/{filename}"

async def save_violation_document(file: UploadFile, violation_id: int) -> str:
    """Save violation photo/document"""
    import os, uuid
    from app.config import BASE_UPLOAD_DIR
    ALLOWED = {"image/jpeg", "image/png", "image/jpg", "image/webp", "application/pdf"}
    
    # Save folder is dynamic
    folder = os.path.join(BASE_UPLOAD_DIR, f"violation_documents/{violation_id}")
    os.makedirs(folder, exist_ok=True)

    if file.content_type not in ALLOWED:
        raise ValueError("Only image and PDF files are allowed.")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise ValueError("The file should not exceed 10 MB.")

    ext = file.filename.split(".")[-1].lower()
    filename = f"vdoc_{violation_id}_{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(folder, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    return f"/uploads/violation_documents/{violation_id}/{filename}"