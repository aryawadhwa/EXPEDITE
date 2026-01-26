from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import List, Dict
from app.api.deps import get_current_user
from app.models import User, UserAsset
import base64

router = APIRouter()

@router.post("/upload")
async def upload_asset(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    """Upload a file to the user's asset library (MongoDB)"""
    
    # Check size (Example limit: 10MB to be safe for Mongo 16MB doc limit)
    MAX_SIZE = 10 * 1024 * 1024 # 10MB
    
    # Read file content
    content = await file.read()
    size = len(content)
    
    if size > MAX_SIZE:
        raise HTTPException(status_code=413, detail=f"File too large. Max size is 10MB.")
    
    # Check if duplicate name exists for user? (Optional, let's allow duplicates for now)
    
    asset = UserAsset(
        user_id=user.clerk_id,
        filename=file.filename,
        content_type=file.content_type,
        file_data=content,
        size_bytes=size
    )
    await asset.insert()
    print(f"[DEBUG] Uploaded asset {asset.id} for user {user.clerk_id}")
    
    return {
        "status": "success", 
        "asset_id": str(asset.id),
        "filename": asset.filename,
        "size": asset.size_bytes
    }

@router.options("/")
async def options_list():
    from fastapi import Response
    return Response(status_code=200)

@router.get("/")
async def list_assets(user: User = Depends(get_current_user)):
    print(f"[DEBUG] list_assets for user: {user.clerk_id}")
    
    try:
        # Fetch assets without projection (simpler, works reliably)
        assets = await UserAsset.find(UserAsset.user_id == user.clerk_id).to_list()
        print(f"[DEBUG] Found {len(assets)} assets")
        
        return [
            {
                "id": str(a.id),
                "filename": a.filename,
                "content_type": a.content_type,
                "size_bytes": a.size_bytes,
                "created_at": a.created_at.isoformat()
            }
            for a in assets
        ]
    except Exception as e:
        print(f"[ERROR] list_assets failed: {e}")
        return []

@router.get("/{asset_id}")
async def get_asset(asset_id: str):
    """Download/view a specific asset (public - asset_id acts as secret)"""
    from fastapi.responses import Response as FileResponse
    
    asset = await UserAsset.get(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    return FileResponse(
        content=asset.file_data,
        media_type=asset.content_type,
        headers={
            "Content-Disposition": f'inline; filename="{asset.filename}"'
        }
    )

@router.delete("/{asset_id}")
async def delete_asset(asset_id: str, user: User = Depends(get_current_user)):
    """Delete an asset"""
    asset = await UserAsset.get(asset_id)
    if not asset or asset.user_id != user.clerk_id:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    await asset.delete()
    return {"status": "deleted", "asset_id": asset_id}

# Explicit options handler if needed for some environments (usually main CORSMiddleware handles this, but sometimes specific routers need help)
from fastapi import Response
@router.options("/upload")
async def options_upload():
    return Response(status_code=200)
