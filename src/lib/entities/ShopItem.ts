import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Relation } from "typeorm";
import { Card } from "./Card";
import type { Card as CardType } from "./Card";

@Entity("shop_item")
export class ShopItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Card)
  @JoinColumn({ name: "cardId" })
  card!: Relation<CardType>;

  @Column({ type: "uuid" })
  cardId!: string;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  price!: number;

  @Column("int", { default: 0 })
  quantity!: number;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;
}
