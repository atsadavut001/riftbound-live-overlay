import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Relation } from "typeorm";
import { User } from "./User";
import type { User as UserType } from "./User";

@Entity("overlay_states")
export class OverlayState {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user!: Relation<UserType>;

  @Column({ type: "jsonb", nullable: true })
  players!: any;

  @Column({ type: "jsonb", nullable: true })
  points!: any;

  @Column({ type: "jsonb", nullable: true })
  event!: any;

  @Column({ type: "jsonb", nullable: true })
  cards!: any;

  @Column({ type: "varchar", nullable: true })
  format!: string;

  @Column({ type: "int", default: 8 })
  maxPoints!: number;

  @Column({ type: "float", nullable: true })
  timerEndTime!: number | null;

  @Column({ type: "int", nullable: true })
  timerMinutes!: number | null;

  @Column({ type: "float", nullable: true })
  timerPausedRemaining!: number | null;

  @Column({ type: "varchar", default: "none" })
  layout!: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;
}
