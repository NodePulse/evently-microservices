const fs = require("fs");
const path = require("path");
const https = require("https");
require("dotenv").config();

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const DATABASE_ID =
  process.env.D1_DATABASE_ID || "250ef241-844d-4733-827f-b451a601a8c8";
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!ACCOUNT_ID || !API_TOKEN) {
  console.error(
    "Error: CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN must be set in .env file"
  );
  process.exit(1);
}

async function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ sql });

    const options = {
      hostname: "api.cloudflare.com",
      path: `/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
        "Content-Length": data.length,
      },
    };

    const req = https.request(options, (res) => {
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        try {
          const response = JSON.parse(body);
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(`API Error: ${JSON.stringify(response.errors)}`));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function applyMigration(migrationFile) {
  console.log(`\n📄 Applying migration: ${path.basename(migrationFile)}`);

  const sql = fs.readFileSync(migrationFile, "utf8");

  // Split SQL into individual statements
  // Split SQL into individual statements
  let statements;
  if (sql.includes("--> statement-breakpoint")) {
    statements = sql.split("--> statement-breakpoint");
  } else {
    statements = sql.split(";");
  }

  statements = statements
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`  Executing statement ${i + 1}/${statements.length}...`);

    try {
      await executeSql(statement);
      console.log(`  ✅ Success`);
    } catch (error) {
      // Check if error is "already exists" - we can skip these
      if (
        error.message.includes("already exists") ||
        error.message.includes("duplicate")
      ) {
        console.log(`  ⚠️  Skipped (already exists)`);
        continue;
      }
      console.error(`  ❌ Failed: ${error.message}`);
      throw error;
    }
  }
}

async function main() {
  console.log("🚀 Starting D1 Database Migration (Smart Mode)");
  console.log(`   Account ID: ${ACCOUNT_ID}`);
  console.log(`   Database ID: ${DATABASE_ID}\n`);

  const migrationsDir = path.join(__dirname, "..", "migrations");
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort() // Ensure correct order
    .map((file) => path.join(migrationsDir, file));

  if (migrationFiles.length === 0) {
    console.log("⚠️  No migration files found");
    return;
  }

  for (const file of migrationFiles) {
    await applyMigration(file);
  }

  console.log("\n✅ All migrations processed successfully!");
  console.log(
    "\n💡 Tip: Run 'npm run d1:check' to verify your database schema"
  );
}

main().catch((error) => {
  console.error("\n❌ Migration failed:", error.message);
  process.exit(1);
});
