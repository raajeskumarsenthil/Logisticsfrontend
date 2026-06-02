import { createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from './authService';
import type { LoginDto, RegisterDto, AuthResponse } from './types';

export const loginUser = createAsyncThunk<
  AuthResponse,
  LoginDto,
  { rejectValue: string }
>('auth/login', async (credentials, thunkAPI) => {
  try {
    return await authService.login(credentials);
  } catch (error: any) {
    const message = error.response?.data?.message || 'Login failed';
    return thunkAPI.rejectWithValue(message);
  }
});

export const registerUser = createAsyncThunk<
  AuthResponse,
  RegisterDto,
  { rejectValue: string }
>('auth/register', async (userData, thunkAPI) => {
  try {
    return await authService.register(userData);
  } catch (error: any) {
    const message = error.response?.data?.message || 'Registration failed';
    return thunkAPI.rejectWithValue(message);
  }
});

export const seedDatabase = createAsyncThunk<
  { message: string },
  void,
  { rejectValue: string }
>('auth/seed', async (_, thunkAPI) => {
  try {
    return await authService.seed();
  } catch (error: any) {
    const message = error.response?.data?.message || 'Seeding failed';
    return thunkAPI.rejectWithValue(message);
  }
});
