import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Relation } from "typeorm";
import { Order } from "./Order";
import type { Order as OrderType } from "./Order";
import { ShopItem } from "./ShopItem";
import type { ShopItem as ShopItemType } from "./ShopItem";

@Entity("order_items")
export class OrderItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "order_id", type: "uuid" })
  orderId!: string;

  @ManyToOne("Order", (order: any) => order.items)
  @JoinColumn({ name: "order_id" })
  order!: Relation<OrderType>;

  @Column({ name: "shop_item_id", type: "uuid" })
  shopItemId!: string;

  @ManyToOne(() => ShopItem)
  @JoinColumn({ name: "shop_item_id" })
  shopItem!: Relation<ShopItemType>;

  @Column({ type: "int", default: 1 })
  quantity!: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  priceAtTime!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
