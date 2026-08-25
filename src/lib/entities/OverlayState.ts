import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity("overlay_states")
export class OverlayState {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "jsonb", nullable: true })
  players!: any;

  @Column({ type: "jsonb", nullable: true })
  points!: any;

  @Column({ type: "jsonb", nullable: true })
  event!: any;

  @Column({ type: "jsonb", nullable: true })
  cards!: any;

  @Column({ nullable: true })
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

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
