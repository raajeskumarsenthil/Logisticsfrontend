import { createAsyncThunk } from '@reduxjs/toolkit';
import { ridersService } from './ridersService';
import type { Rider, UpdateRiderStatusDto, UpdateRiderLocationDto } from './types';
import { getErrorMessage } from '../../api/errorHelper';

export const fetchAllRiders = createAsyncThunk<Rider[], void, { rejectValue: string }>(
  'riders/fetchAll',
  async (_, thunkAPI) => {
    try {
      return await ridersService.fetchAllRiders();
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error, 'Failed to fetch riders'));
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
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error, 'Failed to update rider status'));
  }
});

export const updateRiderLocation = createAsyncThunk<
  { message: string },
  UpdateRiderLocationDto,
  { rejectValue: string }
>('riders/updateLocation', async (data, thunkAPI) => {
  try {
    return await ridersService.updateRiderLocation(data);
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error, 'Failed to update location'));
  }
});

