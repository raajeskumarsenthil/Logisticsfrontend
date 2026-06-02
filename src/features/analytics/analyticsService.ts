import { httpClient } from '../../api/httpClient';
import { ENDPOINTS } from '../../api/endpoints';
import type { AnalyticsSummary } from './types';

const fetchSummary = async (): Promise<AnalyticsSummary> => {
  const response = await httpClient.get(ENDPOINTS.ANALYTICS.SUMMARY);
  return response.data;
};

export const analyticsService = {
  fetchSummary,
};
