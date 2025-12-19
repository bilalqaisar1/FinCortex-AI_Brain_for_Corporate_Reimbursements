from __future__ import annotations

import io
from typing import Tuple

from PIL import Image


def compress_image(
    file_bytes: bytes,
    *,
    max_size: Tuple[int, int] = (1600, 1600),
    quality: int = 85,
) -> bytes:
    """
    Compress an image in-memory.

    Args:
        file_bytes: Raw image bytes.
        max_size: Max (width, height) to resize while preserving aspect ratio.
        quality: JPEG/WebP quality.

    Returns:
        Compressed image bytes.
    """
    with Image.open(io.BytesIO(file_bytes)) as img:
        img = img.convert("RGB")
        img.thumbnail(max_size, Image.LANCZOS)
        output = io.BytesIO()
        img.save(output, format="JPEG", quality=quality, optimize=True)
        return output.getvalue()


