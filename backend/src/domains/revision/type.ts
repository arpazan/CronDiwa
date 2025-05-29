export enum Action {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
}

export interface Revision {
  id: number;
  table_name: string;
  record_id: number;
  action: Action;
  snapshot: Record<string, any>;
  created_at: string;
}