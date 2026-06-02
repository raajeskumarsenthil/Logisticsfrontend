export interface Rider {
  id: string;
  name: string;
  status: 'available' | 'offline';
  activeOrders: number;
  totalDelivered: number;
  totalFailed: number;
  avgDeliveryTime: number;
}

export interface UpdateRiderStatusDto {
  status: 'available' | 'offline';
}

export interface UpdateRiderLocationDto {
  lat: number;
  lng: number;
}

export interface RidersState {
  items: Rider[];
  loading: boolean;
  error: string | null;
}
