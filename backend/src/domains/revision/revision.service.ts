import { FastifyInstance } from "fastify";
import { Action, Revision } from "./type.js";

export class RevisionService {
  constructor(private fastify: FastifyInstance) {}

  async create(
    table_name: string,
    action: Action,
    record: Record<string, any>
  ) {
    const insertStmt = await this.fastify.db.prepare(
      "INSERT INTO revisions ( table_name, record_id, action, snapshot) VALUES (?, ?, ?, ?)"
    );
    
    const result = await insertStmt.run(table_name, record.id, action, JSON.stringify(record));
    return result;
  }

  async list(table_name: string, record_id: string) {
    const selectStmt = await this.fastify.db.prepare(
      "SELECT r.id, r.table_name, r.record_id, r.action, r.snapshot as snapshot, r.changed_at FROM revisions r WHERE r.table_name = ? and r.record_id = ? order by r.changed_at desc"
    );
    const result = await selectStmt.all<Revision[]>(table_name, record_id);
    result.forEach(r => {
      r.snapshot = JSON.parse(r.snapshot as unknown as string);
    });
    return result;
  }

  async count(table_name: string, record_id: string) {
    const selectStmt = await this.fastify.db.prepare(
      "SELECT count(*) as count FROM revisions WHERE table_name = ? and record_id = ?"
    );
    const result = await selectStmt.get<{ count: number }>(table_name, record_id);
    return result?.count ?? 0;
  }
}
