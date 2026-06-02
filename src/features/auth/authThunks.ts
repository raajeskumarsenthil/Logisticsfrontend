import { createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from './authService';
import type { LoginDto, RegisterDto, AuthResponse } from './types';
import { getErrorMessage } from '../../api/errorHelper';

export const loginUser = createAsyncThunk<
  AuthResponse,
  LoginDto,
  { rejectValue: string }
>('auth/login', async (credentials, thunkAPI) => {
  try {
    return await authService.login(credentials);
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error, 'Login failed'));
  }
});

export const registerUser = createAsyncThunk<
  AuthResponse,
  RegisterDto,
  { rejectValue: string }
>('auth/register', async (userData, thunkAPI) => {
  try {
    return await authService.register(userData);
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error, 'Registration failed'));
  }
});

export const seedDatabase = createAsyncThunk<
  { message: string },
  void,
  { rejectValue: string }
>('auth/seed', async (_, thunkAPI) => {
  try {
    return await authService.seed();
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error, 'Seeding failed'));
  }
});

