import { writeFileSync } from "node:fs";
import { generateSql } from "../src/lib/db/tables.ts";

writeFileSync("supabase/migrations/0001_init.sql", generateSql());
console.log("wrote supabase/migrations/0001_init.sql");
