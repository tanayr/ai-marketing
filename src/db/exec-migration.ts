// Script to execute SQL migration to add "retouchr" to studio_tool enum
import { db } from "./index";
import { sql } from "drizzle-orm";
import { readFileSync } from "fs";
import path from "path";

async function runMigration() {
  try {
    console.log("Running migration to add 'retouchr' to studio_tool enum...");
    
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), "migrations", "add_retouchr_to_enum.sql");
    const sqlContent = readFileSync(sqlPath, "utf-8");
    
    // Execute the SQL
    await db.execute(sql.raw(sqlContent));
    
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

runMigration();
