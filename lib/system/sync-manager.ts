import { useSupabase as UseSupabase } from "../supabase/supabase-client";
import dbClient, { SonnetDBClient } from "./localdb/client";
import { SupabaseClient } from "@supabase/supabase-js";

export class SyncManager {
  db: SonnetDBClient;
  supabase: SupabaseClient;

  constructor() {
    this.db = dbClient;
    this.supabase = UseSupabase();
  }
}
