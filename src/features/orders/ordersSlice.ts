import { createSlice } from '@reduxjs/toolkit';
import type { OrdersState } from './types';
import { fetchAdminOrders, fetchClientOrders, fetchRiderOrders, createOrder, updateOrderStatus } from './ordersThunks';

const initialState: OrdersState = {
  items: [],
  loading: false,
  error: null,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Fetch Admin
    builder.addCase(fetchAdminOrders.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(fetchAdminOrders.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; });
    builder.addCase(fetchAdminOrders.rejected, (state, action) => { state.loading = false; state.error = action.payload || 'Error'; });

    // Fetch Client
    builder.addCase(fetchClientOrders.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(fetchClientOrders.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; });
    builder.addCase(fetchClientOrders.rejected, (state, action) => { state.loading = false; state.error = action.payload || 'Error'; });

    // Fetch Rider
    builder.addCase(fetchRiderOrders.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(fetchRiderOrders.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; });
    builder.addCase(fetchRiderOrders.rejected, (state, action) => { state.loading = false; state.error = action.payload || 'Error'; });

    // Create Order
    builder.addCase(createOrder.fulfilled, () => {
      // In a real app we might append it, but we typically rely on refetching or socket updates.
      // state.items.push(action.payload);
    });

    // Update Status
    builder.addCase(updateOrderStatus.fulfilled, (state, action) => {
      const index = state.items.findIndex(o => o._id === action.payload._id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    });
  },
});

export default ordersSlice.reducer;
