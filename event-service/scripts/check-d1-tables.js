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

async function main() {
  console.log("🔍 Checking D1 Database Tables");
  console.log(`   Account ID: ${ACCOUNT_ID}`);
  console.log(`   Database ID: ${DATABASE_ID}\n`);

  // Query to list all tables
  const result = await executeSql(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  );

  console.log("📊 Tables in database:");
  if (result.result && result.result.length > 0 && result.result[0].results) {
    const tables = result.result[0].results;
    if (tables.length === 0) {
      console.log("   (no tables found)");
    } else {
      tables.forEach((table) => {
        console.log(`   ✓ ${table.name}`);
      });
    }
    console.log(`\n   Total: ${tables.length} table(s)`);
  } else {
    console.log("   (no tables found)");
  }

  // If events table exists, show its structure
  try {
    const schemaResult = await executeSql("PRAGMA table_info(events)");
    if (
      schemaResult.result &&
      schemaResult.result[0].results &&
      schemaResult.result[0].results.length > 0
    ) {
      console.log("\n📋 Events table schema:");
      schemaResult.result[0].results.forEach((col) => {
        console.log(`   - ${col.name} (${col.type})`);
      });
    }
  } catch (error) {
    console.log("\n⚠️  Events table not found or error reading schema");
  }

  // If tickets table exists, show its structure
  try {
    const schemaResult = await executeSql("PRAGMA table_info(tickets)");
    if (
      schemaResult.result &&
      schemaResult.result[0].results &&
      schemaResult.result[0].results.length > 0
    ) {
      console.log("\n📋 Tickets table schema:");
      schemaResult.result[0].results.forEach((col) => {
        console.log(`   - ${col.name} (${col.type})`);
      });
    }
  } catch (error) {
    console.log("\n⚠️  Tickets table not found or error reading schema");
  }
}

main().catch((error) => {
  console.error("\n❌ Error:", error.message);
  process.exit(1);
});
