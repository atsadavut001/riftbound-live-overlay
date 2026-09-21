import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Relation } from "typeorm";
import { User } from "./User";
import type { User as UserType } from "./User";
import { OrderItem } from "./OrderItem";
import type { OrderItem as OrderItemType } from "./OrderItem";

@Entity("orders")
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user!: Relation<UserType>;

  @Column({ type: "varchar", length: 50, default: "cart" })
  status!: string; // 'cart', 'pending', 'paid', 'shipped', 'cancelled'

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  totalAmount!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 50 })
  shippingFee!: number;

  @Column({ type: "varchar", nullable: true })
  transRef!: string;

  @Column({ type: "varchar", nullable: true })
  slipUrl!: string;

  @Column({ type: "varchar", nullable: true })
  qrUrl!: string;

  @Column({ type: "varchar", nullable: true })
  trackingNumber!: string;

  @Column({ type: "varchar", nullable: true })
  courier!: string;

  @OneToMany(() => OrderItem, (item: any) => item.order)
  items!: Relation<OrderItemType[]>;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
