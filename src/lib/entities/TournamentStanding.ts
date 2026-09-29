import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn, Relation } from "typeorm";
import { Tournament } from "./Tournament";

@Entity("tournament_standings")
@Index(["tournamentId", "leaderName"])
export class TournamentStanding {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  @Index()
  tournamentId!: string;

  @ManyToOne(() => Tournament, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tournamentId" })
  tournament!: Relation<Tournament>;

  /** Player name from TopDeck standings */
  @Column({ type: "varchar" })
  playerName!: string;

  /** Leader card name(s) as reported by TopDeck, e.g. "Lee Sin" or "Lee Sin, Stunning Tempo" */
  @Column({ type: "varchar", nullable: true })
  leaderName!: string | null;

  /** Final placement (1 = winner) */
  @Column({ type: "int", nullable: true })
  placement!: number | null;

  @Column({ type: "int", default: 0 })
  wins!: number;

  @Column({ type: "int", default: 0 })
  losses!: number;

  @Column({ type: "int", default: 0 })
  draws!: number;

  /** TopDeck decklist text (raw). Optional per tournament visibility. */
  @Column({ type: "text", nullable: true })
  decklist!: string | null;

  /** Parsed deck cards: [{ code, name, qty, cat }] resolved against the Card table when possible */
  @Column("jsonb", { default: [] })
  deckCards!: { code?: string | null; name: string; qty: number; cat?: string }[];

  /** Cached Card.id for the leader, resolved during sync */
  @Column({ type: "uuid", nullable: true })
  leaderCardId!: string | null;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;
}
