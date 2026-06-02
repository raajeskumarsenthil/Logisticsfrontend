export interface Rider {
  id: string;
  name: string;
  email?: string;
  status: 'available' | 'offline';
  activeOrders: number;
  totalDelivered: number;
  totalFailed: number;
  avgDeliveryTime: number;
  location?: { lat: number; lng: number } | null;
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
