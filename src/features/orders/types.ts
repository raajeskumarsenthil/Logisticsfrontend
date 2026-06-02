export interface Order {
  _id: string;
  clientId: { _id: string; name: string };
  riderId?: { _id: string; name: string };
  pickupAddress: string;
  dropAddress: string;
  packageDetails: string;
  priority: 'normal' | 'urgent';
  status: 'pending' | 'assigned' | 'picked_up' | 'delivered' | 'failed';
  proofPhoto?: string;
  failureReason?: string;
  timeline: { status: string; timestamp: string; note?: string }[];
  timeTakenMinutes?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOrderDto {
  pickupAddress: string;
  dropAddress: string;
  packageDetails: string;
  priority: 'normal' | 'urgent';
}

export interface UpdateOrderStatusDto {
  status: 'picked_up' | 'delivered' | 'failed';
  proofPhoto?: string;
  failureReason?: string;
}

export interface OrdersState {
  items: Order[];
  loading: boolean;
  error: string | null;
}
