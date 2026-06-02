import { createAsyncThunk } from '@reduxjs/toolkit';
import { analyticsService } from './analyticsService';
import type { AnalyticsSummary } from './types';

export const fetchAnalyticsSummary = createAsyncThunk<
  AnalyticsSummary,
  void,
  { rejectValue: string }
>('analytics/fetchSummary', async (_, thunkAPI) => {
  try {
    return await analyticsService.fetchSummary();
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics summary');
  }
});
