import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { User } from "../models/orm/User";
import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  UserResponse,
} from "../models/api/User";

const SALT_ROUNDS = 10;

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const existingUser = await this.userRepository.findOne({
      where: { name: data.name },
    });

    if (existingUser) {
      throw new Error("User with this name already exists");
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = this.userRepository.create({
      name: data.name,
      passwordHash,
    });

    await this.userRepository.save(user);

    const token = this.generateToken(user);

    return {
      user: this.toUserResponse(user),
      token,
    };
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const user = await this.userRepository.findOne({
      where: { name: data.name },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(
      data.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    const token = this.generateToken(user);

    return {
      user: this.toUserResponse(user),
      token,
    };
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async getUserByName(name: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { name } });
  }

  verifyToken(token: string): { userId: string; name: string } {
    const secret = process.env.JWT_SECRET || "default-secret-change-me";
    const decoded = jwt.verify(token, secret) as {
      userId: string;
      name: string;
    };
    return decoded;
  }

  private generateToken(user: User): string {
    const secret = process.env.JWT_SECRET || "default-secret-change-me";
    return jwt.sign({ userId: user.id, name: user.name }, secret, {
      expiresIn: "7d",
    });
  }

  private toUserResponse(user: User): UserResponse {
    return {
      id: user.id,
      name: user.name,
      createdAt: user.createdAt,
    };
  }
}

export const authService = new AuthService();
