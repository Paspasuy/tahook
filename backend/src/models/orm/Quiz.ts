import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Question } from "./Question";
import { Result } from "./Result";

@Entity("quizzes")
export class Quiz {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "uuid" })
  ownerId: string;

  @ManyToOne(() => User, (user) => user.quizzes, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ownerId" })
  owner: User;

  @Column({ type: "boolean", default: false })
  isPublished: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Question, (question) => question.quiz)
  questions: Question[];

  @OneToMany(() => Result, (result) => result.quiz)
  results: Result[];
}
