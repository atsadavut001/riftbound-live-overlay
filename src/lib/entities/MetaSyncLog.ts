import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("meta_sync_logs")
export class MetaSyncLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /** "success" or "failed" */
  @Column({ type: "varchar" })
  status!: string;

  /** "manual" (admin session) or "cron" (Vercel Cron with CRON_SECRET) */
  @Column({ type: "varchar" })
  trigger!: string;

  @Column({ type: "varchar", default: "Constructed" })
  format!: string;

  @Column({ type: "int", default: 30 })
  last!: number;

  @Column({ type: "int", default: 0 })
  total!: number;

  @Column({ type: "int", default: 0 })
  created!: number;

  @Column({ type: "int", default: 0 })
  updated!: number;

  @Column({ type: "int", default: 0 })
  skipped!: number;

  /** Per-tournament errors or a top-level failure message */
  @Column("jsonb", { default: [] })
  errors!: string[];

  @Column({ type: "int", default: 0 })
  durationMs!: number;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;
}
