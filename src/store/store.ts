import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import { ordersReducer } from '../features/orders';
import { ridersReducer } from '../features/riders';
import { analyticsReducer } from '../features/analytics';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    orders: ordersReducer,
    riders: ridersReducer,
    analytics: analyticsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
