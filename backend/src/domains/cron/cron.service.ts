import { FastifyInstance } from "fastify";
import { Crontab } from "./type.js";

export class CronService {
  constructor(private fastify: FastifyInstance) {}

  async list() {
    const selectStmt = await this.fastify.db.prepare(
      "SELECT * FROM crontabs ORDER BY id"
    );
    
    const result = await selectStmt.all<Crontab[]>();
    return result;
  }

  async get(id: number) {
    const selectStmt = await this.fastify.db.prepare(
      "SELECT * FROM crontabs WHERE id = ?"
    );
    const result = await selectStmt.get<Crontab>(id);
    return result;
  }

  async create(record: Crontab) {
    const insertStmt = await this.fastify.db.prepare(
      "INSERT INTO crontabs (name, schedule, command, active) VALUES (?, ?, ?, ?)"
    );
    const result = await insertStmt.run(record.name, record.schedule, record.command, record.active);
    return result;
  }
  
  async update(id: number, record: Crontab) {
    const updateStmt = await this.fastify.db.prepare(`
      UPDATE crontabs 
      SET 
        name = COALESCE(?, name),
        schedule = COALESCE(?, schedule),
        command = COALESCE(?, command),
        active = COALESCE(?, active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = await updateStmt.run(
        record.name !== undefined ? record.name : null,
        record.schedule !== undefined ? record.schedule : null,
        record.command !== undefined ? record.command : null,
        record.active !== undefined ? record.active : null,
        id
      );
    return result;
  }
  
  async delete(id: number) {
    const deleteStmt = await this.fastify.db.prepare(
      "DELETE FROM crontabs WHERE id = ?"
    );
    const result = await deleteStmt.run(id);
    return result;
  }

}