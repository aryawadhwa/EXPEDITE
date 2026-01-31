from app.core.composio_config import get_composio_client
from typing import Optional
import os


async def send_email_via_composio(
    user_id: str,
    recipient: str,
    subject: str,
    body: str,
    attachments: Optional[list] = None,
):
    """
    Execute Gmail Send Email action via Composio SDK.
    
    Args:
        user_id: Composio entity ID (e.g., clerk_id)
        recipient: Email address to send to
        subject: Email subject line
        body: Email body content
        attachments: Optional list of dicts with 'asset_id' keys
        
    Returns:
        Dict with execution result
    """
    import tempfile
    
    client = get_composio_client()

    arguments = {
        "recipient_email": recipient,
        "subject": subject,
        "body": body,
        "user_id": "me",  # Required by Gmail API
    }

    temp_files = []

    if attachments:
        from app.models import UserAsset
        import base64

        # Process first attachment (Composio uses singular "attachment" parameter)
        for att in attachments:
            asset_id = att.get("asset_id")
            if not asset_id:
                continue
                
            asset = await UserAsset.get(asset_id)
            if not asset:
                continue

            # Get file extension and create proper filename
            filename = asset.filename
            suffix = os.path.splitext(filename)[1] if "." in filename else ""
            
            # Create temp file with the asset data - use original filename
            tf = tempfile.NamedTemporaryFile(delete=False, suffix=suffix, prefix=os.path.splitext(filename)[0] + "_")
            tf.write(asset.file_data)
            tf.close()

            temp_files.append(tf.name)
            
            # Composio Gmail uses singular "attachment" parameter with file path
            arguments["attachment"] = tf.name
            print(f"Including attachment: {filename} -> {tf.name}")
            break  # Gmail SEND_EMAIL only supports one attachment at a time

    try:
        result = client.tools.execute(
            slug="GMAIL_SEND_EMAIL",
            arguments=arguments,
            user_id=user_id,
            dangerously_skip_version_check=True,
        )
        print(f"Email sent - Composio result: {result}")
        
        # Composio SDK returns a result object with 'successful' key
        is_success = False
        response_data = {}
        
        if hasattr(result, 'successful'):
            is_success = result.successful
            response_data = result.data if hasattr(result, 'data') else {}
            if not is_success:
                response_data['error'] = getattr(result, 'error', None) or str(result)
        elif isinstance(result, dict):
            is_success = result.get("successful") or result.get("success")
            response_data = result
        else:
            # Fallback for unknown object types
            is_success = True
            response_data = {"raw": str(result)}
            
        if is_success:
            print(f"Email sent successfully via Composio: {subject}")
            return {"success": True, "data": response_data}
        else:
            error_msg = response_data.get("error") or response_data.get("message") or "Unknown error from Composio"
            print(f"Composio send failed: {error_msg}")
            return {"success": False, "error": error_msg}
    except Exception as e:
        print(f"ERROR: Composio SDK execution failed: {e}")
        return {"success": False, "error": str(e)}
    finally:
        # Cleanup temp files
        for p in temp_files:
            try:
                os.unlink(p)
            except Exception:
                pass
