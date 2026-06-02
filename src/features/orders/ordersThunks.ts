import { createAsyncThunk } from '@reduxjs/toolkit';
import { ordersService } from './ordersService';
import type { Order, CreateOrderDto, UpdateOrderStatusDto } from './types';

export const fetchAdminOrders = createAsyncThunk<Order[], void, { rejectValue: string }>(
  'orders/fetchAdmin',
  async (_, thunkAPI) => {
    try {
      return await ordersService.fetchAdminOrders();
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch admin orders');
    }
  }
);

export const fetchClientOrders = createAsyncThunk<Order[], void, { rejectValue: string }>(
  'orders/fetchClient',
  async (_, thunkAPI) => {
    try {
      return await ordersService.fetchClientOrders();
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch client orders');
    }
  }
);

export const fetchRiderOrders = createAsyncThunk<Order[], void, { rejectValue: string }>(
  'orders/fetchRider',
  async (_, thunkAPI) => {
    try {
      return await ordersService.fetchRiderOrders();
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch rider deliveries');
    }
  }
);

export const createOrder = createAsyncThunk<Order, CreateOrderDto, { rejectValue: string }>(
  'orders/create',
  async (orderData, thunkAPI) => {
    try {
      return await ordersService.createOrder(orderData);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to create order');
    }
  }
);

export const updateOrderStatus = createAsyncThunk<
  Order,
  { id: string; data: UpdateOrderStatusDto },
  { rejectValue: string }
>('orders/updateStatus', async ({ id, data }, thunkAPI) => {
  try {
    return await ordersService.updateOrderStatus(id, data);
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update status');
  }
});
