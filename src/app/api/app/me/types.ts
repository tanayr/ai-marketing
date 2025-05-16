import { users } from "@/db/schema/user";

export interface MeResponse {
  user: typeof users.$inferSelect;
}
