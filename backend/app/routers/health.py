from fastapi import APIRouter
router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "ok"}

@router.get("/check-multipart")
def check_multipart():
    try:
        import python_multipart
        return {"status": "installed", "version": python_multipart.__version__}
    except ImportError:
        return {"status": "missing", "error": "python-multipart not found"}
