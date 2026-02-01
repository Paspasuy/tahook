import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  CreateDateColumn,
} from "typeorm";
import { User } from "./User";
import { Quiz } from "./Quiz";

@Entity("results")
export class Result {
  @PrimaryColumn({ type: "uuid" })
  userId: string;

  @PrimaryColumn({ type: "uuid" })
  quizId: string;

  @ManyToOne(() => User, (user) => user.results, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => Quiz, (quiz) => quiz.results, { onDelete: "CASCADE" })
  @JoinColumn({ name: "quizId" })
  quiz: Quiz;

  @Column({ type: "int", default: 0 })
  score: number;

  @Column({ type: "int", nullable: true })
  place: number;

  @CreateDateColumn()
  createdAt: Date;
}
