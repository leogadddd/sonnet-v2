import SonnetDB from "./db";
import { Entity } from "dexie";

type LogType = "Sync" | "General";

export default class Log extends Entity<SonnetDB> {
  id!: string;
  user_id!: string;
  type: LogType = "General";
  title!: string;
  call_from!: string;
  content!: object | null;

  created_at!: number;
}
