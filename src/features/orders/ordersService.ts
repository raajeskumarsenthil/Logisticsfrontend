import { httpClient } from '../../api/httpClient';
import { ENDPOINTS } from '../../api/endpoints';
import type { Order, CreateOrderDto, UpdateOrderStatusDto } from './types';

const fetchAdminOrders = async (): Promise<Order[]> => {
  const response = await httpClient.get(ENDPOINTS.ORDERS.BASE);
  // Backend returns paginated { items, total, page, totalPages } for admin
  return response.data.items || response.data;
};

const fetchClientOrders = async (): Promise<Order[]> => {
  const response = await httpClient.get(ENDPOINTS.ORDERS.MY_ORDERS);
  return response.data;
};

const fetchRiderOrders = async (): Promise<Order[]> => {
  const response = await httpClient.get(ENDPOINTS.ORDERS.RIDER_ORDERS);
  return response.data;
};

const createOrder = async (orderData: CreateOrderDto): Promise<Order> => {
  const response = await httpClient.post(ENDPOINTS.ORDERS.BASE, orderData);
  return response.data;
};

const updateOrderStatus = async (id: string, data: UpdateOrderStatusDto): Promise<Order> => {
  const response = await httpClient.patch(ENDPOINTS.ORDERS.STATUS(id), data);
  return response.data;
};

export const ordersService = {
  fetchAdminOrders,
  fetchClientOrders,
  fetchRiderOrders,
  createOrder,
  updateOrderStatus,
};
