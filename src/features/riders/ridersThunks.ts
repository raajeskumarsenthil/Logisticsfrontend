import { createAsyncThunk } from '@reduxjs/toolkit';
import { ridersService } from './ridersService';
import type { Rider, UpdateRiderStatusDto, UpdateRiderLocationDto } from './types';

export const fetchAllRiders = createAsyncThunk<Rider[], void, { rejectValue: string }>(
  'riders/fetchAll',
  async (_, thunkAPI) => {
    try {
      return await ridersService.fetchAllRiders();
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch riders');
    }
  }
);

export const updateRiderStatus = createAsyncThunk<
  Rider,
  { id: string; data: UpdateRiderStatusDto },
  { rejectValue: string }
>('riders/updateStatus', async ({ id, data }, thunkAPI) => {
  try {
    return await ridersService.updateRiderStatus(id, data);
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update rider status');
  }
});

export const updateRiderLocation = createAsyncThunk<
  { message: string },
  UpdateRiderLocationDto,
  { rejectValue: string }
>('riders/updateLocation', async (data, thunkAPI) => {
  try {
    return await ridersService.updateRiderLocation(data);
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update location');
  }
});
