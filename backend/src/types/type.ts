export interface Crontab {
  id: number;
  name: string;
  schedule: string;
  command: string;
  active: number;
  created_at: string;
  updated_at: string;
}