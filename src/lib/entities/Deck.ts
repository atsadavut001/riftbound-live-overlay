import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("deck")
export class Deck {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "text", nullable: true })
  detail!: string;

  @Column({ type: "varchar" })
  visibility!: "Draft" | "Private" | "Public";

  @Column("jsonb", { default: {} })
  cards!: any; 

  @Column({ type: "varchar", nullable: true })
  coverImageUrl!: string;

  @Column({ type: "varchar", nullable: true })
  userId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
