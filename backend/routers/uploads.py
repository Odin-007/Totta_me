"""Photo upload routes — proxy files to Supabase Storage."""

import json
import uuid
from datetime import datetime

import httpx
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from config import (
    MAX_UPLOAD_BYTES,
    SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_STORAGE_BUCKET,
    SUPABASE_URL,
    SUPPORTED_IMAGE_TYPES,
)
from models import User
from security import get_current_user

router = APIRouter(tags=["uploads"])


async def _upload_to_supabase(file: UploadFile, folder: str, user_id: str) -> dict:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(
            status_code=503,
            detail="Supabase storage is not configured"
        )

    if file.content_type not in SUPPORTED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, and WebP images are allowed"
        )

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Image must be smaller than {MAX_UPLOAD_BYTES // (1024 * 1024)} MB"
        )

    extension = SUPPORTED_IMAGE_TYPES[file.content_type]
    filename = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex}.{extension}"
    storage_path = f"{folder}/{user_id}/{filename}"
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_STORAGE_BUCKET}/{storage_path}"

    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": file.content_type,
        "x-upsert": "false",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(upload_url, content=content, headers=headers)

    if response.status_code >= 400:
        try:
            supabase_error = response.json()
        except json.JSONDecodeError:
            supabase_error = response.text

        raise HTTPException(
            status_code=502,
            detail={
                "message": "Failed to upload image to Supabase Storage",
                "supabase_status": response.status_code,
                "supabase_error": supabase_error,
            }
        )

    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_STORAGE_BUCKET}/{storage_path}"
    return {
        "photo_url": public_url,
        "storage_path": storage_path,
        "content_type": file.content_type,
        "size": len(content),
    }


@router.post("/api/uploads/place-photo")
async def upload_place_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload place photo to Supabase Storage"""
    return await _upload_to_supabase(file, "places", current_user.id)


@router.post("/api/uploads/memory-photo")
async def upload_memory_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload memory photo to Supabase Storage"""
    return await _upload_to_supabase(file, "memories", current_user.id)
