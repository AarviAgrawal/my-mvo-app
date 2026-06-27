from supabase import Client, create_client

from app.core.config import settings


def get_service_client() -> Client:
    """
    Returns a Supabase client authenticated with the service-role key.
    This bypasses RLS — only call from server-side code, never expose to the client.
    """
    return create_client(settings.supabase_url, settings.supabase_service_role_key)
