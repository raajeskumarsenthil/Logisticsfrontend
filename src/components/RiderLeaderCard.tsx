import React from 'react';
import type { Rider } from '../features/riders/types';

interface Props {
  riders: Rider[];
}

/**
 * Simple leader card – for demo purposes we treat the first rider in the list
 * as the "leader". It displays the rider's name, status and a large pin icon.
 */
const RiderLeaderCard: React.FC<Props> = ({ riders }) => {
  if (!riders || riders.length === 0) {
    return <div className="p-4 text-center text-gray-500">No riders available</div>;
  }
  const leader = riders[0];
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-md h-full flex flex-col items-center justify-center">
      <h3 className="text-xl font-semibold mb-2">Leader Rider</h3>
      <div className="text-3xl mb-1">🚴‍♂️</div>
      <div className="font-medium">{leader.name}</div>
      <div className="text-sm text-gray-600 capitalize">{leader.status}</div>
    </div>
  );
};

export default RiderLeaderCard;
