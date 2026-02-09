import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL);

export default sql;

// test connection
(async () => {
  try {
    const res = await sql`SELECT NOW()`;
    console.log("✅ Database connected:", res[0]);
  } catch (err) {
    console.log("❌ Database connection failed:", err);
  }
})();
