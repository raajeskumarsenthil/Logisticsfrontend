import { createAsyncThunk } from '@reduxjs/toolkit';
import { analyticsService } from './analyticsService';
import type { AnalyticsSummary } from './types';
import { getErrorMessage } from '../../api/errorHelper';

export const fetchAnalyticsSummary = createAsyncThunk<
  AnalyticsSummary,
  void,
  { rejectValue: string }
>('analytics/fetchSummary', async (_, thunkAPI) => {
  try {
    return await analyticsService.fetchSummary();
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error, 'Failed to fetch analytics summary'));
  }
});

