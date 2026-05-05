import os
import uuid
from fastapi import HTTPException, UploadFile

#Config
UPLOAD_DIR = "uploads/profile_pictures"   # backend folder ke andar
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp"}
MAX_SIZE_MB = 5
MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

# Folder exist nahi karta toh banao
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

    # ── Unique filename banao ─────────────────────────────
    # Format: profile_<user_id>_<random_uuid>.<extension>
    extension = file.filename.split(".")[-1].lower()
    filename = f"profile_{user_id}_{uuid.uuid4().hex}.{extension}"
    filepath = os.path.join(UPLOAD_DIR, filename)


    # ── File save karo ────────────────────────────────────
    with open(filepath, "wb") as f:
        f.write(contents)

    # ── URL return karo ───────────────────────────────────
    # Frontend is URL se image access karega
    url = f"/uploads/profile_pictures/{filename}"
    return url


def delete_profile_picture(url: str):
    """
    Delete the old profile picture when a new one is uploaded.
Extract the file path from the URL and remove the file.
    """
    if not url:
        return

    # URL se local path nikalo
    # "/uploads/profile_pictures/abc.jpg" → "uploads/profile_pictures/abc.jpg"
    local_path = url.lstrip("/")

    if os.path.exists(local_path):
        os.remove(local_path)


async def save_document(file: UploadFile, community_id: int) -> str:
    """Community document (PDF etc.) save karo"""
    import os, uuid
    ALLOWED = {"application/pdf", "image/jpeg", "image/png", "application/msword",
               "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
    folder = f"uploads/community_documents/{community_id}"
    os.makedirs(folder, exist_ok=True)

    if file.content_type not in ALLOWED:
        raise ValueError("Only PDF, Word, and image files are allowed.")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise ValueError("The file should not exceed 10 MB.")

    ext = file.filename.split(".")[-1].lower()
    filename = f"doc_{community_id}_{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(folder, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    return f"/uploads/community_documents/{community_id}/{filename}"


async def save_violation_document(file: UploadFile, violation_id: int) -> str:
    """Violation photo/document save karo"""
    import os, uuid
    ALLOWED = {"image/jpeg", "image/png", "image/jpg", "image/webp", "application/pdf"}
    folder = f"uploads/violation_documents/{violation_id}"
    os.makedirs(folder, exist_ok=True)

    if file.content_type not in ALLOWED:
        raise ValueError("Only image and PDF files are allowed.")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise ValueError("The file should not exceed 10 MB.")

    ext = file.filename.split(".")[-1].lower()
    filename = f"vdoc_{violation_id}_{uuid.uuid4().hex}.{ext}"

    with open(f"{folder}/{filename}", "wb") as f:
        f.write(contents)

    return f"/uploads/violation_documents/{violation_id}/{filename}"