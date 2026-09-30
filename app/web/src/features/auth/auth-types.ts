export interface User {
  id: string;
  emailAddress: string;
  isActive: boolean;
  phoneVerifiedAt: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RequestOtpResponse {
  message: string;
  expiresInSeconds: number;
}

export interface VerifyOtpResponse {
  user: User;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
}