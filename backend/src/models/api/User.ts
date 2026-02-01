// Request DTOs
export interface RegisterRequest {
  name: string;
  password: string;
}

export interface LoginRequest {
  name: string;
  password: string;
}

// Response DTOs
export interface UserResponse {
  id: string;
  name: string;
  createdAt: Date;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}
