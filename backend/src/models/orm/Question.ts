import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Quiz } from "./Quiz";

export enum QuestionType {
  SINGLE_CHOICE = "singlechoice",
  MULTI_CHOICE = "multichoice",
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

@Entity("questions")
export class Question {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  quizId: string;

  @ManyToOne(() => Quiz, (quiz) => quiz.questions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "quizId" })
  quiz: Quiz;

  @Column({ type: "int" })
  index: number;

  @Column({ type: "text" })
  text: string;

  @Column({
    type: "enum",
    enum: QuestionType,
    default: QuestionType.SINGLE_CHOICE,
  })
  type: QuestionType;

  @Column({ type: "jsonb" })
  options: QuestionOption[];

  @Column({ type: "int", default: 30 })
  timeLimitSeconds: number;

  @Column({ type: "int", default: 1000 })
  points: number;
}
