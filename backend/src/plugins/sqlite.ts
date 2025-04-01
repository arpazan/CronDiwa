import fp from "fastify-plugin";
import { SQLiteOptions, fpSqlitePlugin } from "fastify-sqlite-typed";

export default fp<SQLiteOptions>(async (fastify, options) => {
  
  const { ...sqliteOptions } = options;

  const dbFilename = process.env.DATABASE_PATH || sqliteOptions.dbFilename || "./crontab.db";

  fastify.register(fpSqlitePlugin, {
    ...sqliteOptions,
    dbFilename,
  });

  fastify.addHook("onClose", (instance, done) => {
    try {
      if (instance.db) {
        instance.db.close();
        fastify.log.info("Database connection closed");
      }
      done();
    } catch (err) {
      done(err as Error);
    }
  });
});
