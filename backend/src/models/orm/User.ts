import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Quiz } from "./Quiz";
import { Result } from "./Result";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255, unique: true })
  name: string;

  @Column({ type: "varchar", length: 255 })
  passwordHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Quiz, (quiz) => quiz.owner)
  quizzes: Quiz[];

  @OneToMany(() => Result, (result) => result.user)
  results: Result[];
}
