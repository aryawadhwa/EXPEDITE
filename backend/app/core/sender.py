from app.core.config import settings
from composio import Composio
import base64

# Lazy initialization to ensure settings are loaded
_composio_client = None

def get_composio_client():
    global _composio_client
    if _composio_client is None:
        if not settings.COMPOSIO_API_KEY:
            raise ValueError("COMPOSIO_API_KEY is not set in environment variables")
        _composio_client = Composio(api_key=settings.COMPOSIO_API_KEY)
    return _composio_client

async def send_email_via_composio(user_id: str, recipient: str, subject: str, body: str, attachments: list = []):
    """Execute Gmail Send Email action via Composio SDK using user_id for authentication."""
    try:
        client = get_composio_client()
        
        # Build arguments
        arguments = {
            "recipient_email": recipient,
            "subject": subject,
            "body": body,
        }
        
        # Handle attachments if present
        temp_files = [] # Keep track to clean up later (optional, or rely on OS)
        if attachments:
            from app.models import UserAsset
            import tempfile
            import os
            
            attachment_data = [] # List of dicts or paths? SDK docs say "paths to tools that need them"
            # But GMAIL_SEND_EMAIL input schema for 'attachments' expects a list of objects with 'path' or just list of paths.
            # Let's try passing list of dicts with 'path' and 'name'
            
            for att in attachments:
                asset_id = att.get('asset_id')
                if asset_id:
                    asset = await UserAsset.get(asset_id)
                    if asset:
                        # Create temp file
                        suffix = "." + asset.filename.split(".")[-1] if "." in asset.filename else ""
                        tf = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
                        tf.write(asset.file_data)
                        tf.close()
                        temp_files.append(tf.name)
                        
                        # Manual Upload using Composio Internal Helpers
                        # This guarantees we get the correct {s3key, mimetype, name} structure
                        # bypassing any auto-magic issues with lists.
                        from composio.core.models._files import FileUploadable
                        
                        # We need the tool schema to get toolkit slug
                        tool_schema = client.tools.get_raw_composio_tool_by_slug("GMAIL_SEND_EMAIL")
                        toolkit_slug = tool_schema.toolkit.slug if tool_schema.toolkit else "gmail"

                        uploaded_file = FileUploadable.from_path(
                            client=client._client, # Access the underlying HttpClient
                            file=tf.name,
                            tool="GMAIL_SEND_EMAIL",
                            toolkit=toolkit_slug,
                        ).model_dump()
                        
                        print(f"DEBUG: Uploaded file manually: {uploaded_file}")
                        attachment_data.append(uploaded_file)

            if attachment_data:
                arguments["attachments"] = attachment_data
                print(f"Including {len(attachment_data)} attachment(s) via temp files")
        
        result = client.tools.execute(
            slug="GMAIL_SEND_EMAIL",
            arguments=arguments,
            user_id=user_id,
            dangerously_skip_version_check=True,
        )
        print(f"Email sent successfully: {result}")
        return result
    except Exception as e:
        print(f"ERROR: Composio SDK execution failed: {e}")
        raise
