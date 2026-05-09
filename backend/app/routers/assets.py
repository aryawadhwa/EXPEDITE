from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from typing import List, Dict
from app.api.deps import get_current_user
from app.models import User, UserAsset
import base64

router = APIRouter()

# CORS preflight handler for upload
@router.options("/upload")
async def options_upload():
    """Handle CORS preflight for file upload"""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "3600",
        }
    )

@router.post("/upload")
async def upload_asset(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    """Upload a file to the user's asset library (MongoDB)"""
    
    # Check size (50MB limit for large documents)
    MAX_SIZE = 50 * 1024 * 1024  # 50MB
    
    try:
        # Read file content
        content = await file.read()
        size = len(content)
        
        if size > MAX_SIZE:
            raise HTTPException(
                status_code=413, 
                detail=f"File too large. Max size is 50MB. Your file is {size / (1024*1024):.2f}MB."
            )
        
        if size == 0:
            raise HTTPException(
                status_code=400,
                detail="File is empty"
            )
        
        # Create asset
        asset = UserAsset(
            user_id=user.clerk_id,
            filename=file.filename,
            content_type=file.content_type,
            file_data=content,
            size_bytes=size
        )
        await asset.insert()
        
        return {
            "status": "success", 
            "asset_id": str(asset.id),
            "filename": asset.filename,
            "size": asset.size_bytes,
            "content_type": asset.content_type
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload file: {str(e)}"
        )

@router.options("/")
async def options_list():
    """Handle CORS preflight requests"""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "3600",
        }
    )

@router.get("/")
async def list_assets(user: User = Depends(get_current_user)):

    
    try:
        # Fetch assets without projection (simpler, works reliably)
        assets = await UserAsset.find(UserAsset.user_id == user.clerk_id).to_list()

        
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


@router.get("/{asset_id}/content")
async def get_asset_content(asset_id: str, user: User = Depends(get_current_user)):
    """
    Extract and return the text content of a knowledge asset.
    Used for RAG (Retrieval Augmented Generation) context.
    """
    from app.services.rag import rag_service
    
    asset = await UserAsset.get(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Verify ownership
    if asset.user_id != user.clerk_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    content = await rag_service.get_asset_content(asset_id)
    
    return {
        "asset_id": asset_id,
        "filename": asset.filename,
        "content": content,
        "content_length": len(content) if content else 0
    }


@router.post("/context")
async def build_rag_context(
    asset_ids: List[str],
    max_chars: int = 8000,
    user: User = Depends(get_current_user)
):
    """
    Build a combined context string from multiple knowledge assets.
    
    This is used to inject relevant knowledge into AI prompts for
    content generation (posts, emails, etc.)
    """
    from app.services.rag import rag_service
    from beanie.operators import In
    import bson

    # Verify ownership of all assets using bulk query
    valid_object_ids = []
    for id_str in set(asset_ids):
        try:
            valid_object_ids.append(bson.ObjectId(id_str))
        except bson.errors.InvalidId:
            pass

    if not valid_object_ids:
        if asset_ids:
            raise HTTPException(status_code=403, detail="Invalid asset IDs provided")
        assets = []
    else:
        assets = await UserAsset.find(In(UserAsset.id, valid_object_ids)).to_list()

    asset_map = {str(a.id): a for a in assets}
    
    for asset_id in asset_ids:
        asset = asset_map.get(asset_id)
        if not asset or asset.user_id != user.clerk_id:
            raise HTTPException(
                status_code=403, 
                detail=f"Asset {asset_id} not found or access denied"
            )
    
    context = await rag_service.build_context_from_assets(asset_ids, max_chars)
    
    return {
        "context": context,
        "asset_count": len(asset_ids),
        "context_length": len(context)
    }
