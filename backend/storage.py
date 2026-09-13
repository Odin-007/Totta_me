"""Turns stored Supabase Storage object URLs into short-lived signed URLs.

Photos are uploaded to a private bucket (see routers/uploads.py) and only the
public-style URL shape is persisted in the DB. At read time we rewrite that
into a real signed URL so the bucket never needs public access.
"""

import httpx

from config import SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET, SUPABASE_URL

SIGNED_URL_EXPIRES_IN = 3600  # 1 hour

_PUBLIC_URL_PREFIX = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_STORAGE_BUCKET}/"


def _extract_storage_path(url):
    if not url or not url.startswith(_PUBLIC_URL_PREFIX):
        return None
    return url[len(_PUBLIC_URL_PREFIX):]


async def sign_urls(urls: list):
    """Given a list of stored photo URLs (any may be None), return a same-length
    list with Supabase object URLs replaced by fresh signed URLs. Non-Supabase
    or already-broken values are passed through unchanged."""

    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return urls

    paths_by_index = {}
    for index, url in enumerate(urls):
        path = _extract_storage_path(url)
        if path:
            paths_by_index[index] = path

    if not paths_by_index:
        return urls

    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }
    sign_url = f"{SUPABASE_URL}/storage/v1/object/sign/{SUPABASE_STORAGE_BUCKET}"
    body = {"expiresIn": SIGNED_URL_EXPIRES_IN, "paths": list(paths_by_index.values())}

    async with httpx.AsyncClient(timeout=15) as client:
        try:
            response = await client.post(sign_url, json=body, headers=headers)
            response.raise_for_status()
            signed = response.json()
        except httpx.HTTPError:
            return urls

    signed_by_path = {
        item["path"]: item["signedURL"]
        for item in signed
        if item.get("signedURL") and not item.get("error")
    }

    result = list(urls)
    for index, path in paths_by_index.items():
        signed_path_url = signed_by_path.get(path)
        if signed_path_url:
            result[index] = f"{SUPABASE_URL}/storage/v1{signed_path_url}"

    return result


async def sign_url(url):
    (signed,) = await sign_urls([url])
    return signed
