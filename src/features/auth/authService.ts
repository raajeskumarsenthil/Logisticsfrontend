import { httpClient } from '../../api/httpClient';
import { ENDPOINTS } from '../../api/endpoints';
import type { LoginDto, RegisterDto, AuthResponse } from './types';

const login = async (credentials: LoginDto): Promise<AuthResponse> => {
  const response = await httpClient.post(ENDPOINTS.AUTH.LOGIN, credentials);
  return response.data;
};

const register = async (userData: RegisterDto): Promise<AuthResponse> => {
  const response = await httpClient.post(ENDPOINTS.AUTH.REGISTER, userData);
  return response.data;
};

const seed = async (): Promise<{ message: string }> => {
  const response = await httpClient.post(ENDPOINTS.AUTH.SEED);
  return response.data;
};

export const authService = {
  login,
  register,
  seed,
};
