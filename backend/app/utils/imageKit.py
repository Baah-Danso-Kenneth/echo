from imagekitio import ImageKit
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize ImageKit
imagekit = ImageKit(
    private_key=settings.IMAGEKIT_PRIVATE_KEY,
    public_key=settings.IMAGEKIT_PUBLIC_KEY,
    url_endpoint=settings.IMAGEKIT_URL
)


import tempfile
import os

from imagekitio.models.UploadFileRequestOptions import UploadFileRequestOptions

async def upload_image_to_imagekit(file_data: bytes, file_name: str) -> str:
    """
    Upload image to ImageKit and return the full URL.

    Args:
        file_data: Image file bytes
        file_name: Original filename

    Returns:
        str: Full URL of uploaded image

    Raises:
        Exception: If upload fails
    """
    temp_file_path = None
    try:
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file_name)[1]) as temp_file:
            temp_file.write(file_data)
            temp_file_path = temp_file.name

        # Upload using the file path
        with open(temp_file_path, "rb") as f:
            upload_result = imagekit.upload_file(
                file=f,
                file_name=file_name,
                options=UploadFileRequestOptions(
                    folder="/posts",  # Organize in posts folder
                    use_unique_file_name=True,  # Prevent naming conflicts
                    is_private_file=False,  # Make publicly accessible
                )
            )

        logger.info(f"Image uploaded successfully: {upload_result.url}")
        return upload_result.url

    except Exception as e:
        logger.error(f"Failed to upload image to ImageKit: {str(e)}")
        raise Exception(f"Image upload failed: {str(e)}")
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)


def delete_image_from_imagekit(file_id: str) -> bool:
    """
    Delete image from ImageKit (optional cleanup).

    Args:
        file_id: ImageKit file ID

    Returns:
        bool: True if successful
    """
    try:
        imagekit.delete_file(file_id)
        logger.info(f"Image deleted successfully: {file_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to delete image from ImageKit: {str(e)}")
        return False