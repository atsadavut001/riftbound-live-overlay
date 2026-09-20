import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Relation } from "typeorm";
import { User } from "./User";
import type { User as UserType } from "./User";

@Entity("address")
export class Address {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user!: Relation<UserType>;

  @Column({ type: "varchar", nullable: true })
  name!: string;

  @Column({ type: "varchar", nullable: true })
  phone!: string;

  @Column({ type: "varchar", nullable: true })
  address!: string;

  @Column({ type: "varchar", nullable: true })
  province!: string;

  @Column({ type: "varchar", nullable: true })
  district!: string;

  @Column({ type: "varchar", nullable: true })
  subDistrict!: string;

  @Column({ type: "varchar", nullable: true })
  zipCode!: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;
}
