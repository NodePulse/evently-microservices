import { createLogger, format, transports } from "winston";

const logger = createLogger({
  level: "info",
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

// D1 API Response Interface
interface D1Response {
  success: boolean;
  errors: any[];
  messages: any[];
  result: Array<{
    results: any[];
    success: boolean;
    meta: {
      served_by: string;
      duration: number;
      changes: number;
      last_row_id: number;
      changed_db: boolean;
      size_after: number;
      rows_read: number;
      rows_written: number;
    };
  }>;
}

// Cloudflare D1 HTTP API Client
class D1HttpClient {
  private accountId: string;
  private databaseId: string;
  private apiToken: string;
  private baseUrl: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  constructor(accountId: string, databaseId: string, apiToken: string) {
    this.accountId = accountId;
    this.databaseId = databaseId;
    this.apiToken = apiToken;
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
  }

  /**
   * Execute a single SQL query with parameters
   */
  async query(sql: string, params: any[] = []): Promise<any> {
    return this.executeWithRetry(async () => {
      const payload = {
        sql,
        params: params.length > 0 ? params : undefined,
      };

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as D1Response;

      if (!response.ok || !data.success) {
        const errorMessage = data.errors?.[0]?.message || response.statusText;
        logger.error("D1 API query failed", {
          sql,
          status: response.status,
          errors: data.errors,
        });
        throw new Error(`D1 API Error: ${errorMessage}`);
      }

      // D1 API returns an array of results, we take the first one
      const result = data.result[0];

      if (!result) {
        logger.warn("D1 query returned no results", { sql });
        return { results: [], meta: null };
      }

      return result;
    });
  }

  /**
   * Execute multiple SQL statements in a batch
   */
  async batch(
    statements: Array<{ sql: string; params?: any[] }>
  ): Promise<any[]> {
    return this.executeWithRetry(async () => {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          statements.map((s) => ({
            sql: s.sql,
            params: s.params && s.params.length > 0 ? s.params : undefined,
          }))
        ),
      });

      const data = (await response.json()) as D1Response;

      if (!response.ok || !data.success) {
        const errorMessage = data.errors?.[0]?.message || response.statusText;
        logger.error("D1 API batch failed", {
          status: response.status,
          errors: data.errors,
        });
        throw new Error(`D1 Batch API Error: ${errorMessage}`);
      }

      return data.result;
    });
  }

  /**
   * Prepare a statement (for compatibility with D1 binding interface)
   */
  prepare(sql: string) {
    return {
      bind: (...params: any[]) => ({
        all: async () => {
          const result = await this.query(sql, params);
          return {
            results: result.results || [],
            success: true,
            meta: result.meta,
          };
        },
        run: async () => {
          const result = await this.query(sql, params);
          return {
            success: true,
            meta: result.meta,
          };
        },
        first: async () => {
          const result = await this.query(sql, params);
          return result.results?.[0] || null;
        },
      }),
      all: async () => {
        const result = await this.query(sql, []);
        return {
          results: result.results || [],
          success: true,
          meta: result.meta,
        };
      },
      run: async () => {
        const result = await this.query(sql, []);
        return {
          success: true,
          meta: result.meta,
        };
      },
      first: async () => {
        const result = await this.query(sql, []);
        return result.results?.[0] || null;
      },
    };
  }

  /**
   * Execute with retry logic for transient failures
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= this.maxRetries) {
        logger.error("D1 operation failed after max retries", {
          attempt,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }

      const isRetryable =
        error instanceof Error &&
        (error.message.includes("timeout") ||
          error.message.includes("ECONNRESET") ||
          error.message.includes("ETIMEDOUT") ||
          error.message.includes("524") || // Cloudflare timeout
          error.message.includes("502") || // Bad gateway
          error.message.includes("503")); // Service unavailable

      if (!isRetryable) {
        throw error;
      }

      const delay = this.retryDelay * Math.pow(2, attempt - 1);
      logger.warn("Retrying D1 operation", { attempt, delayMs: delay });

      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.executeWithRetry(operation, attempt + 1);
    }
  }
}

// Database client singleton
let d1Client: D1HttpClient | null = null;

/**
 * Initialize the D1 database client
 */
export const initializeDatabase = (): D1HttpClient => {
  try {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const databaseId = process.env.D1_DATABASE_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !databaseId || !apiToken) {
      const missing = [];
      if (!accountId) missing.push("CLOUDFLARE_ACCOUNT_ID");
      if (!databaseId) missing.push("D1_DATABASE_ID");
      if (!apiToken) missing.push("CLOUDFLARE_API_TOKEN");

      throw new Error(
        `Missing required D1 configuration: ${missing.join(
          ", "
        )}. Please check your .env file.`
      );
    }

    d1Client = new D1HttpClient(accountId, databaseId, apiToken);

    logger.info("✅ Cloudflare D1 HTTP client initialized successfully", {
      accountId: accountId.substring(0, 8) + "...",
      databaseId: databaseId.substring(0, 8) + "...",
      environment: process.env.NODE_ENV || "development",
    });

    return d1Client;
  } catch (error) {
    logger.error("❌ Failed to initialize D1 database client", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Get the D1 client instance (initializes if not already initialized)
 */
export const getD1Client = (): D1HttpClient => {
  if (!d1Client) {
    return initializeDatabase();
  }
  return d1Client;
};

/**
 * Check database health and connectivity
 */
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const client = getD1Client();
    const result = await client.query("SELECT 1 as health_check");
    return !!(result.results && result.results.length > 0);
  } catch (error) {
    logger.error("Database health check failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
};

/**
 * Test database connection and log details
 */
export const testDatabaseConnection = async (): Promise<void> => {
  try {
    logger.info("Testing D1 database connection...");
    const client = getD1Client();

    // Test basic query (D1 doesn't allow sqlite_version())
    const result = await client.query("SELECT 1 as test");
    logger.info("✅ D1 connection test successful", {
      testResult: result.results?.[0],
    });

    // Test table access
    const tables = await client.query(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    logger.info("Database tables found", {
      count: tables.results?.length || 0,
      tables: tables.results?.map((t: any) => t.name) || [],
    });
  } catch (error) {
    logger.error("❌ D1 connection test failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
