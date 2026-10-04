import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Metric {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  timestamp: Date;

  @Column()
  name: string;

  @Column({ type: "jsonb", nullable: true })
  data: any;
}
