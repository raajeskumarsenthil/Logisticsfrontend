

/**
 * RiderLegend – shows a small legend explaining the marker colours.
 *   • Green  – Available
 *   • Orange – Busy (has an active order)
 *   • Gray   – Offline
 * It can be placed anywhere in the UI (e.g., above the map).
 */
export default function RiderLegend() {
  const legends = [
    { color: 'green', label: 'Available' },
    { color: 'orange', label: 'Busy' },
    { color: 'gray', label: 'Offline' },
  ];

  return (
    <div className="flex items-center space-x-4 mb-2">
      {legends.map(l => (
        <div key={l.label} className="flex items-center">
          <span
            className="inline-block w-4 h-4 rounded-full mr-1"
            style={{ backgroundColor: l.color, border: '2px solid white' }}
          />
          <span className="text-sm text-gray-700">{l.label}</span>
        </div>
      ))}
    </div>
  );
}
