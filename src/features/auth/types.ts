export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'client' | 'rider';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginDto {
  email: string;
  password?: string; // Optional if using OAuth, etc.
}

export interface RegisterDto {
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'client' | 'rider';
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}
