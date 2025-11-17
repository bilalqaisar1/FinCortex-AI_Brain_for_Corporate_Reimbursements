from typing import Optional

from supabase import create_client, Client

from app.config.settings import settings


_client: Optional[Client] = None


def get_supabase_client() -> Client:
    global _client
    if _client is None:
        if not settings.supabase_url or not (
            settings.supabase_service_role_key or settings.supabase_anon_key
        ):
            raise RuntimeError(
                "Supabase is not configured. Set SUPABASE_URL and one of SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY in .env"
            )
        key = settings.supabase_service_role_key or settings.supabase_anon_key  # prefer service role on backend
        _client = create_client(settings.supabase_url, key)  # type: ignore[arg-type]
    return _client

