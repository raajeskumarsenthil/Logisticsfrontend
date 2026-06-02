import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface TimelineEvent {
  status: string;
  timestamp: string;
  note?: string;
}

export interface Order {
  _id: string;
  clientId: {
    _id: string;
    name: string;
    email: string;
  } | string;
  riderId?: {
    _id: string;
    name: string;
    email: string;
    riderProfile?: {
      status: string;
    };
  } | string;
  pickupAddress: string;
  dropAddress: string;
  packageDetails: string;
  priority: 'normal' | 'urgent';
  status: 'pending' | 'assigned' | 'picked_up' | 'delivered' | 'failed';
  proofPhoto?: string;
  failureReason?: string;
  timeline: TimelineEvent[];
  timeTakenMinutes?: number;
  zone: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminOrdersPayload {
  items: Order[];
  total: number;
  page: number;
  totalPages: number;
}

interface OrdersState {
  myOrders: Order[];
  adminOrders: {
    items: Order[];
    total: number;
    page: number;
    totalPages: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: OrdersState = {
  myOrders: [],
  adminOrders: {
    items: [],
    total: 0,
    page: 1,
    totalPages: 0,
  },
  loading: false,
  error: null,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setMyOrders: (state, action: PayloadAction<Order[]>) => {
      state.myOrders = action.payload;
    },
    addOrderToMyOrders: (state, action: PayloadAction<Order>) => {
      state.myOrders.unshift(action.payload);
    },
    updateMyOrder: (state, action: PayloadAction<{ orderId: string; status: Order['status']; timeline: TimelineEvent[] }>) => {
      const idx = state.myOrders.findIndex((o) => o._id === action.payload.orderId);
      if (idx !== -1) {
        state.myOrders[idx].status = action.payload.status;
        state.myOrders[idx].timeline = action.payload.timeline;
      }
    },
    setAdminOrders: (state, action: PayloadAction<AdminOrdersPayload>) => {
      state.adminOrders = action.payload;
    },
    updateAdminOrder: (state, action: PayloadAction<{ orderId: string; status: Order['status']; timeline: TimelineEvent[] }>) => {
      const idx = state.adminOrders.items.findIndex((o) => o._id === action.payload.orderId);
      if (idx !== -1) {
        state.adminOrders.items[idx].status = action.payload.status;
        state.adminOrders.items[idx].timeline = action.payload.timeline;
      }
    },
    updateAdminOrderRider: (state, action: PayloadAction<{ orderId: string; riderName: string }>) => {
      const idx = state.adminOrders.items.findIndex((o) => o._id === action.payload.orderId);
      if (idx !== -1) {
        state.adminOrders.items[idx].status = 'assigned';
        state.adminOrders.items[idx].riderId = {
          _id: '',
          name: action.payload.riderName,
          email: '',
        };
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setMyOrders,
  addOrderToMyOrders,
  updateMyOrder,
  setAdminOrders,
  updateAdminOrder,
  updateAdminOrderRider,
  setLoading,
  setError,
} = ordersSlice.actions;
export default ordersSlice.reducer;
