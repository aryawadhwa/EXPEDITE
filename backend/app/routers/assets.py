from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from typing import List, Dict
from app.api.deps import get_current_user
from app.models import User, UserAsset
import base64
from pydantic import BaseModel

router = APIRouter()


class GitHubImportRequest(BaseModel):
    username: str
    max_repos: int = 20
    include_readmes: bool = True
    include_forks: bool = False

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
    
    # Verify ownership of all assets
    for asset_id in asset_ids:
        asset = await UserAsset.get(asset_id)
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


@router.post("/import/github")
async def import_from_github(
    req: GitHubImportRequest,
    user: User = Depends(get_current_user)
):
    """
    Import public GitHub repositories as a single markdown knowledge asset.
    This lets outbound generation use your projects automatically.
    """
    from app.services.github_ingest import github_ingest_service

    if req.max_repos < 1:
        raise HTTPException(status_code=400, detail="max_repos must be >= 1")
    if req.max_repos > 100:
        req.max_repos = 100

    profile = await github_ingest_service.build_profile_markdown(
        username=req.username,
        max_repos=req.max_repos,
        include_readmes=req.include_readmes,
        include_forks=req.include_forks,
    )

    markdown = profile.get("summary_markdown", "")
    repos = profile.get("repos", [])
    if not markdown or not repos:
        raise HTTPException(
            status_code=404,
            detail="No public repositories found for this username."
        )

    filename = f"github-profile-{req.username}.md"
    content_bytes = markdown.encode("utf-8", errors="ignore")

    existing = await UserAsset.find_one(
        UserAsset.user_id == user.clerk_id,
        UserAsset.filename == filename
    )
    if existing:
        existing.content_type = "text/markdown"
        existing.file_data = content_bytes
        existing.size_bytes = len(content_bytes)
        await existing.save()
        asset_id = str(existing.id)
    else:
        asset = UserAsset(
            user_id=user.clerk_id,
            filename=filename,
            content_type="text/markdown",
            file_data=content_bytes,
            size_bytes=len(content_bytes),
        )
        await asset.insert()
        asset_id = str(asset.id)

    return {
        "status": "success",
        "asset_id": asset_id,
        "filename": filename,
        "repo_count": len(repos),
        "message": "GitHub projects imported into knowledge assets."
    }
