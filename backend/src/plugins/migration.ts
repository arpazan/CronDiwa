import { FastifyInstance, FastifyPluginCallback } from "fastify";
import fp from "fastify-plugin";
import fs from "fs";
import path from "path";
import crypto from "crypto"

interface MigrationPluginOptions {
  /**
   * Path to migration files directory
   * @default "./migrations"
   */
  migrationsPath?: string;

  /**
   * Whether to automatically run migrations on server start
   * @default true
   */
  autoMigrate?: boolean;

  /**
   * Migration file extension to look for
   * @default ".sql"
   */
  migrationExtension?: string;

  /**
   * Table name to use for tracking migrations
   * @default "migrations"
   */
  migrationsTable?: string;
}

const migrationPlugin: FastifyPluginCallback<MigrationPluginOptions> = (
  fastify,
  opts,
  done
) => {
  const {
    migrationsPath = process.env.MIGRATIONS_PATH || path.join(process.cwd(), "src/migrations"),
    autoMigrate = true,
    migrationExtension = ".sql",
    migrationsTable = "migrations",
  } = opts;

  fastify.decorate(
    "migrate",
    async function (this: FastifyInstance): Promise<number> {
      if (!this.db) {
        throw new Error(
          "Database not initialized - make sure to register the database plugin before the migration plugin"
        );
      }

      // Create migrations table if it doesn't exist
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS ${migrationsTable} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          checksum TEXT,
          duration_ms INTEGER
        );
      `);

      // Get applied migrations
      const stmt = await this.db.prepare(
        `SELECT name, checksum FROM ${migrationsTable} ORDER BY id`
      );
      const appliedMigrations = (await stmt.all()) as {
        name: string;
        checksum: string;
      }[];
      const appliedMap = new Map(
        appliedMigrations.map((m) => [m.name, m.checksum])
      );

      // Read migration files
      if (!fs.existsSync(migrationsPath)) {
        fastify.log.warn(`Migrations directory not found: ${migrationsPath}`);
        return 0;
      }

      const migrationFiles = fs
        .readdirSync(migrationsPath)
        .filter((file) => file.endsWith(migrationExtension))
        .sort(); 

      let appliedCount = 0;
      for (const file of migrationFiles) {
        const migrationPath = path.join(migrationsPath, file);

        // Calculate checksum for the migration file
        const migrationSql = fs.readFileSync(migrationPath, "utf8");
        const checksum = calculateChecksum(migrationSql);

        // Check if migration has already been applied
        if (appliedMap.has(file)) {
          const existingChecksum = appliedMap.get(file);

          // Verify checksum to detect modified migrations
          if (existingChecksum !== checksum) {
            fastify.log.warn(
              `Migration ${file} has been modified after being applied! ` +
                `This could lead to inconsistent database state. ` +
                `Expected: ${existingChecksum}, Found: ${checksum}`
            );
          }

          continue; // Skip already applied migration
        }

        // Apply new migration
        fastify.log.info(`Applying migration: ${file}`);
        const startTime = Date.now();

        // Start transaction for each migration
        await this.db.exec("BEGIN TRANSACTION;");

        try {
          // Apply migration
          await this.db.exec(migrationSql);

          // Record migration with checksum and duration
          const duration = Date.now() - startTime;
          const insertStmt = await this.db.prepare(
            `INSERT INTO ${migrationsTable} (name, checksum, duration_ms) VALUES (?, ?, ?)`
          );
          await insertStmt.run(file, checksum, duration);

          await this.db.exec("COMMIT;");
          appliedCount++;
          fastify.log.info(`Migration applied: ${file} (${duration}ms)`);
        } catch (error: unknown) {
          await this.db.exec("ROLLBACK;");
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          fastify.log.error(`Migration failed: ${file} - ${errorMessage}`);
          throw new Error(`Migration ${file} failed: ${errorMessage}`);
        }
      }

      if (appliedCount > 0) {
        fastify.log.info(`Applied ${appliedCount} migrations`);
      } else {
        fastify.log.info("No new migrations to apply");
      }

      return appliedCount;
    }
  );

  // Auto-migrate if enabled
  if (autoMigrate) {
    fastify.addHook("onReady", async () => {
      try {
        const count = await fastify.migrate();
        if (count > 0) {
          fastify.log.info(
            `Auto-migration complete, applied ${count} migrations`
          );
        }
      } catch (err) {
        fastify.log.error("Auto-migration failed:", err);
        throw err;
      }
    });
  }

  done();
};

// Helper function to calculate checksum
function calculateChecksum(content: string): string {
  return crypto.createHash("md5").update(content, "utf8").digest("hex");
}

declare module "fastify" {
  interface FastifyInstance {
    migrate: () => Promise<number>;
  }
}
export default fp(migrationPlugin, {
  name: "fastify-migrations",
});
