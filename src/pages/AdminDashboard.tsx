import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type AppDispatch, type RootState } from '../store/store';
import { fetchAdminOrders } from '../features/orders';
import { fetchAllRiders, updateRiderStatus as thunkUpdateRiderStatus } from '../features/riders';
import { fetchAnalyticsSummary } from '../features/analytics';
import type { Order } from '../features/orders/types';
import type { Rider } from '../features/riders/types';
import { connectSocket, disconnectSocket } from '../socket';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MdMap, MdPerson, MdWarning, MdCheckCircle, MdAccessTime, MdRefresh } from 'react-icons/md';

export const AdminDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { addToast } = useToast();

  const adminOrders = useSelector((state: RootState) => state.orders.items);
  const riders = useSelector((state: RootState) => state.riders.items);
  const summary = useSelector((state: RootState) => state.analytics.summary);
  const user = useSelector((state: RootState) => state.auth.user);

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Modal State for toggle status
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    riderId: string;
    riderName: string;
    activeCount: number;
    targetStatus: 'available' | 'offline';
  } | null>(null);

  // Fetch baseline data
  const fetchDashboardData = async () => {
    try {
      await Promise.all([
        dispatch(fetchAdminOrders()).unwrap(),
        dispatch(fetchAllRiders()).unwrap(),
        dispatch(fetchAnalyticsSummary()).unwrap(),
      ]);
    } catch (err) {
      addToast(typeof err === 'string' ? err : 'Error fetching dashboard data', 'error');
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Setup Socket
    const socket = connectSocket();

    // Listeners
    socket.on('order_assigned', (data: { orderId: string; riderName: string; estimatedTime: string }) => {
      addToast(`Order #${data.orderId.slice(-6)} assigned to ${data.riderName}`, 'info');
      fetchDashboardData();
    });

    socket.on('order_status_changed', (data: { orderId: string; status: Order['status']; timeline: Order['timeline'] }) => {
      addToast(`Order #${data.orderId.slice(-6)} status updated to ${data.status.replace('_', ' ')}`, 'info');
      fetchDashboardData();
    });

    socket.on('rider_offline', (data: { riderId: string; reassignedOrdersCount: number }) => {
      if (data.reassignedOrdersCount > 0) {
        addToast(
          `Rider went offline. ${data.reassignedOrdersCount} order(s) auto-reassigned.`,
          'warning'
        );
      }
      fetchDashboardData();
    });

    socket.on('location_update', (_data: { riderId: string; lat: number; lng: number }) => {
      // In a real app we might only update the specific rider in Redux to save API calls
      // but fetchAllRiders() handles it for this scale
      fetchDashboardData();
    });

    return () => {
      disconnectSocket();
    };
  }, [dispatch]);

  const handleToggleRider = (rider: Rider) => {
    const isCurrentlyOnline = rider.status === 'available';
    const nextStatus = isCurrentlyOnline ? 'offline' : 'available';

    if (isCurrentlyOnline && rider.activeOrders > 0) {
      setConfirmModal({
        isOpen: true,
        riderId: rider.id,
        riderName: rider.name,
        activeCount: rider.activeOrders,
        targetStatus: 'offline',
      });
    } else {
      executeToggleRider(rider.id, nextStatus);
    }
  };

  const executeToggleRider = async (riderId: string, status: 'available' | 'offline') => {
    try {
      await dispatch(thunkUpdateRiderStatus({ id: riderId, data: { status } })).unwrap();
      addToast(`Rider status set to ${status}`, 'success');
      setConfirmModal(null);
      fetchDashboardData();
    } catch (err) {
      addToast(typeof err === 'string' ? err : 'Failed to toggle rider status', 'error');
    }
  };

  // Helper to sort orders: urgent pinned to top, normal, delivered/failed
  const sortedOrders = [...(adminOrders || [])].sort((a, b) => {
    if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
    if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
    // Handle cases where createdAt might not be populated or fallback correctly
    const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bDate - aDate;
  });

  return (
    <div className="min-h-screen bg-[var(--color-neutral-bg)] p-6">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[var(--color-neutral-bg)]/95 backdrop-blur-sm pt-4 -mx-6 px-6 flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b border-[var(--color-neutral-light)]">
        <div className="flex items-center gap-3">
          <img src="/image.png" alt="LogisticsPro" className="h-20 object-contain -my-4" />
          <div>
            <h1 className="text-2xl font-black text-[var(--color-primary)] tracking-tight">Admin Control Panel</h1>
            <p className="text-xs text-[var(--color-secondary)] mt-0.5">Real-time logistics flow, order assignment rules & rider telemetry.</p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[var(--color-primary-light)]/10 px-3 py-1.5 rounded-full mr-2">
            <MdPerson className="text-[var(--color-primary)]" size={16} />
            <span className="text-sm font-semibold text-[var(--color-primary)]">{user?.name || 'Admin'}</span>
          </div>
          <Button variant="secondary" onClick={fetchDashboardData} size="sm" className="gap-2">
            <MdRefresh size={18} /> Refresh Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLogoutModal(true)}
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-light)]/20 flex items-center justify-center text-[var(--color-primary)]">
            <MdAccessTime size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--color-secondary)] uppercase tracking-wider">Total Orders</p>
            <p className="text-2xl font-black text-[var(--color-neutral-text)]">{summary?.totalOrders ?? 0}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-secondary-light)]/20 flex items-center justify-center text-[var(--color-secondary)]">
            <MdPerson size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--color-secondary)] uppercase tracking-wider">Active Riders</p>
            <p className="text-2xl font-black text-[var(--color-neutral-text)]">
              {riders.filter((r) => r.status === 'available').length}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
            <MdCheckCircle size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--color-secondary)] uppercase tracking-wider">Success Rate</p>
            <p className="text-2xl font-black text-[var(--color-neutral-text)]">{summary?.successRate ?? 100}%</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-tertiary-light)]/20 flex items-center justify-center text-[var(--color-tertiary)]">
            <MdAccessTime size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--color-secondary)] uppercase tracking-wider">Avg Delivery Time</p>
            <p className="text-2xl font-black text-[var(--color-neutral-text)]">{summary?.avgDeliveryTime ?? 0}m</p>
          </div>
        </Card>
      </div>

      {/* Main Grid: Table & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Side: Order List */}
        <div className="lg:col-span-3 space-y-6">
          <Card title="Live Order Registry" subtitle="Urgent orders are pinned to the top. Expand rows to monitor timeline details.">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-neutral-light)] text-[var(--color-secondary)] text-xs uppercase font-semibold">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Rider</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-neutral-light)]">
                  {sortedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[var(--color-secondary)] font-medium">
                        No orders recorded yet. Place orders via the client dashboard.
                      </td>
                    </tr>
                  ) : (
                    sortedOrders.map((order) => {
                      const isExpanded = expandedOrderId === order._id;

                      // Border styling rule
                      let borderClass = 'border-l-4 border-transparent';
                      if (order.priority === 'urgent') {
                        borderClass = 'border-l-4 border-rose-500 bg-rose-50';
                      } else if (order.status === 'delivered') {
                        borderClass = 'border-l-4 border-emerald-500';
                      }

                      // Strikethrough failed text
                      const isFailed = order.status === 'failed';
                      const textClass = isFailed ? 'line-through text-rose-500' : 'text-[var(--color-neutral-text)]';

                      return (
                        <React.Fragment key={order._id}>
                          <tr
                            onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                            className={`cursor-pointer hover:bg-[var(--color-neutral-light)]/30 transition-colors ${borderClass}`}
                          >
                            <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[var(--color-tertiary-dark)]">
                              #{order._id.slice(-6)}
                            </td>
                            <td className={`py-3.5 px-4 font-medium ${textClass}`}>
                              {order.clientId && typeof order.clientId === 'object' ? order.clientId.name : 'Unknown Client'}
                            </td>
                            <td className="py-3.5 px-4">
                              <Badge variant={order.priority}>{order.priority}</Badge>
                            </td>
                            <td className="py-3.5 px-4 text-[var(--color-secondary-dark)] font-medium">
                              {order.riderId && typeof order.riderId === 'object'
                                ? order.riderId.name
                                : 'Unassigned'}
                            </td>
                            <td className="py-3.5 px-4">
                              <Badge variant={order.status}>{order.status.replace('_', ' ')}</Badge>
                            </td>
                            <td className="py-3.5 px-4 text-xs text-[var(--color-primary-light)] font-bold">
                              {isExpanded ? 'Hide Timeline' : 'View Timeline'}
                            </td>
                          </tr>

                          {/* Expanded Stepper Timeline */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={6} className="py-4 px-8 bg-[var(--color-neutral-bg)] border-b border-[var(--color-neutral-light)]">
                                <div className="max-w-xl">
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-secondary-dark)] mb-4">
                                    Delivery Stepper Flow
                                  </h4>
                                  <div className="relative border-l border-[var(--color-secondary-light)] pl-4 space-y-4 text-xs">
                                    {order.timeline.map((evt, i) => (
                                      <div key={i} className="relative">
                                        <span className="absolute -left-[21px] top-0.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-[var(--color-primary)] flex items-center justify-center" />
                                        <div className="font-bold text-[var(--color-neutral-text)] capitalize">
                                          {evt.status.replace('_', ' ')}
                                        </div>
                                        <div className="text-[10px] text-[var(--color-secondary)]">
                                          {new Date(evt.timestamp).toLocaleString()}
                                        </div>
                                        {evt.note && <div className="text-[var(--color-secondary-dark)] mt-0.5">{evt.note}</div>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Analytics Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Zone Volume Distribution" subtitle="Order counts grouped by destination zones.">
              <div className="h-64 mt-2">
                {summary && summary.zoneWiseSummary?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.zoneWiseSummary}>
                      <XAxis dataKey="zone" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#1e293b',
                          color: '#f8fafc',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="totalOrders" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                    No zone data available
                  </div>
                )}
              </div>
            </Card>

            <Card title="Rider Leaderboard" subtitle="Success metrics and average durations.">
              <div className="overflow-y-auto max-h-64 mt-2">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--color-neutral-light)] text-[var(--color-secondary-dark)] uppercase pb-2">
                      <th className="pb-2">Rider</th>
                      <th className="pb-2 text-center">Delivered</th>
                      <th className="pb-2 text-center">Failed</th>
                      <th className="pb-2 text-right">Avg Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-neutral-light)]">
                    {summary?.riderPerformance?.map((riderPerformance, idx) => (
                      <tr key={idx} className="hover:bg-[var(--color-neutral-light)]/30">
                        <td className="py-2.5 font-bold text-[var(--color-neutral-text)]">{riderPerformance.riderName}</td>
                        <td className="py-2.5 text-center text-emerald-600 font-semibold">{riderPerformance.delivered}</td>
                        <td className="py-2.5 text-center text-rose-600 font-semibold">{riderPerformance.failed}</td>
                        <td className="py-2.5 text-right text-[var(--color-secondary-dark)] font-medium">{riderPerformance.avgTime}m</td>
                      </tr>
                    ))}
                    {!summary?.riderPerformance?.length && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-[var(--color-secondary)]">
                          No performance logs found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>

        {/* Right Side: Rider Status Sidebar */}
        <div className="space-y-6">
          <Card title="Rider Sidebar" subtitle="Online status and active workload.">
            <div className="space-y-4 mt-2">
              {riders.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No riders registered in DB.</p>
              ) : (
                riders.map((rider) => {
                  // available = green | busy = yellow (activeOrders > 0 and status available) | offline = grey
                  let dotColor = 'bg-slate-500';
                  let statusLabel = 'offline';

                  if (rider.status === 'available') {
                    if (rider.activeOrders > 0) {
                      dotColor = 'bg-amber-400';
                      statusLabel = 'busy';
                    } else {
                      dotColor = 'bg-emerald-400';
                      statusLabel = 'available';
                    }
                  }

                  return (
                    <div
                      key={rider.id}
                      className="p-3 bg-[var(--color-neutral-bg)] border border-[var(--color-neutral-light)] rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        {/* Status Dot */}
                        <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                        <div>
                          <p className="text-sm font-bold text-[var(--color-neutral-text)]">{rider.name}</p>
                          <p className="text-[10px] text-[var(--color-secondary-dark)]">
                            Active Orders: {rider.activeOrders} | Status:{' '}
                            <span className={`uppercase font-bold text-[9px] ${rider.status === 'available' ? 'text-emerald-600' : 'text-[var(--color-secondary)]'}`}>
                              {statusLabel}
                            </span>
                          </p>
                          {rider.location && (
                            <p className="text-[9px] text-[var(--color-secondary)] flex items-center gap-0.5 mt-0.5">
                              <MdMap size={9} /> GPS: {rider.location.lat.toFixed(3)}, {rider.location.lng.toFixed(3)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Online/Offline Toggle Button */}
                      <Button
                        size="sm"
                        variant={rider.status === 'available' ? 'outline' : 'primary'}
                        className="text-xs py-1 px-2.5"
                        onClick={() => handleToggleRider(rider)}
                      >
                        {rider.status === 'available' ? 'Go Offline' : 'Go Online'}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal for toggling rider status while busy */}
      {confirmModal && (
        <Modal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(null)}
          title="Confirm Status Change"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 text-amber-600 bg-amber-50 p-3.5 rounded-lg">
              <MdWarning size={20} className="flex-shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed text-amber-800">
                <strong>Warning:</strong> {confirmModal.riderName} has{' '}
                <strong>{confirmModal.activeCount} active orders</strong> currently in transit. Going
                offline will trigger <strong>automatic order reassignment</strong> to other available
                riders.
              </p>
            </div>
            <p className="text-sm text-[var(--color-neutral-text)]">Are you sure you want to take this rider offline?</p>
            <div className="flex justify-end gap-3 mt-5">
              <Button variant="outline" onClick={() => setConfirmModal(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => executeToggleRider(confirmModal.riderId, confirmModal.targetStatus)}
              >
                Confirm Offline
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Logout Confirmation Modal */}
      <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} title="Confirm Logout">
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-neutral-text)]">
            Are you sure you want to log out of your Admin account?
          </p>
          <div className="flex justify-end gap-3 mt-5">
            <Button variant="outline" onClick={() => setShowLogoutModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="!bg-rose-50 border-rose-200 !text-rose-800 hover:!bg-rose-100"
              onClick={() => {
                setShowLogoutModal(false);
                dispatch({ type: 'auth/clearCredentials' });
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
