from __future__ import annotations

from supabase import Client, create_client

from settings import Settings


class SupabaseClients:
    def __init__(self, settings: Settings) -> None:
        self.anon: Client = create_client(settings.supabase_url, settings.supabase_anon_key)
        self.service: Client = create_client(settings.supabase_url, settings.supabase_service_role_key)
