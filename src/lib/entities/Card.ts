import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("card")
export class Card {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", unique: true })
  code!: string;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "varchar" })
  type!: string;

  @Column({ type: "varchar", nullable: true })
  rarity!: string;

  @Column({ type: "varchar", nullable: true })
  imageUrl!: string;

  @Column("jsonb", { default: {} })
  detail!: any;

  @Column({ type: "varchar", nullable: true })
  refTcgThId!: string;

  @Column({ type: "varchar", nullable: true })
  refTcgPlayerId!: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;
}
