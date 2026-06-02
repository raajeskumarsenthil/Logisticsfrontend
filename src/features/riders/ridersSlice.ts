import { createSlice } from '@reduxjs/toolkit';
import type { RidersState } from './types';
import { fetchAllRiders, updateRiderStatus } from './ridersThunks';

const initialState: RidersState = {
  items: [],
  loading: false,
  error: null,
};

const ridersSlice = createSlice({
  name: 'riders',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Fetch All
    builder.addCase(fetchAllRiders.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(fetchAllRiders.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; });
    builder.addCase(fetchAllRiders.rejected, (state, action) => { state.loading = false; state.error = action.payload || 'Error'; });

    // Update Status
    builder.addCase(updateRiderStatus.fulfilled, (state, action) => {
      const index = state.items.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    });
  },
});

export default ridersSlice.reducer;
