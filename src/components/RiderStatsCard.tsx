import React from 'react';
import type { Rider } from '../features/riders/types';

interface RiderStatsCardProps {
  riders: Rider[];
}

const RiderStatsCard: React.FC<RiderStatsCardProps> = ({ riders }) => {
  const total = riders.length;
  const online = riders.filter(r => r.status !== 'offline').length;
  const offline = riders.filter(r => r.status === 'offline').length;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-md p-4 shadow-md">
      <h3 className="text-lg font-semibold mb-2">Rider Stats</h3>
      <ul className="space-y-1">
        <li>Total Riders: <span className="font-medium">{total}</span></li>
        <li>Online: <span className="font-medium text-green-600">{online}</span></li>
        <li>Offline: <span className="font-medium text-gray-600">{offline}</span></li>
      </ul>
    </div>
  );
};

export default RiderStatsCard;
