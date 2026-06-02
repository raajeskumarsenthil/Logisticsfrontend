import { httpClient } from '../../api/httpClient';
import { ENDPOINTS } from '../../api/endpoints';
import type { Rider, UpdateRiderStatusDto, UpdateRiderLocationDto } from './types';

const fetchAllRiders = async (): Promise<Rider[]> => {
  const response = await httpClient.get(ENDPOINTS.RIDERS.BASE);
  return response.data;
};

const updateRiderStatus = async (id: string, data: UpdateRiderStatusDto): Promise<Rider> => {
  const response = await httpClient.patch(ENDPOINTS.RIDERS.STATUS(id), data);
  return response.data;
};

const updateRiderLocation = async (data: UpdateRiderLocationDto): Promise<{ message: string }> => {
  const response = await httpClient.patch(ENDPOINTS.RIDERS.LOCATION, data);
  return response.data;
};
  const fetchRiderLocations = async (includeOffline: boolean = false): Promise<Rider[]> => {
    const response = await httpClient.get(`${ENDPOINTS.RIDERS.LOCATIONS}?includeOffline=${includeOffline}`);
    return response.data;
  };

  export const ridersService = {
    fetchAllRiders,
    updateRiderStatus,
    updateRiderLocation,
    fetchRiderLocations,
  };

