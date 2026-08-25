import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("card_type_template")
export class CardTypeTemplate {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column("jsonb", { default: {} })
  defaultJson!: any;
}
