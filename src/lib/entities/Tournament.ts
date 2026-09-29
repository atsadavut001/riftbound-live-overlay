import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("tournaments")
export class Tournament {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /** TopDeck.gg tournament identifier (TID), used to dedupe syncs */
  @Column({ type: "varchar", unique: true })
  tid!: string;

  @Column({ type: "varchar" })
  name!: string;

  /** e.g. "Constructed", "Limited", "Sealed", "2v2" */
  @Column({ type: "varchar", default: "Constructed" })
  format!: string;

  @Column({ type: "int", default: 0 })
  swissNum!: number;

  @Column({ type: "int", default: 0 })
  topCut!: number;

  /** Number of players who submitted decks / standings entries */
  @Column({ type: "int", default: 0 })
  playerCount!: number;

  /** Unix seconds of tournament start (from TopDeck) */
  @Column({ type: "int", nullable: true })
  startDate!: number | null;

  /** City / state / country info from TopDeck eventData */
  @Column({ type: "varchar", nullable: true })
  location!: string | null;

  /** Raw decklists per player: [{ player, leader, placement, decklist }] */
  @Column("jsonb", { default: [] })
  decks!: { player: string; leader: string; placement: number | null; decklist: string | null }[];

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;
}
