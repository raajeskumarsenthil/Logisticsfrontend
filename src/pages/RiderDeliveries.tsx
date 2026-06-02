import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type AppDispatch, type RootState } from '../store/store';
import { fetchRiderOrders, updateOrderStatus } from '../features/orders';
import { fetchAllRiders, updateRiderStatus, updateRiderLocation } from '../features/riders';
import { connectSocket, disconnectSocket } from '../socket';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { MdCameraAlt, MdRefresh, MdPerson } from 'react-icons/md';

export const RiderDeliveries: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { addToast } = useToast();

  const user = useSelector((state: RootState) => state.auth.user);
  
  const deliveries = useSelector((state: RootState) => state.orders.items);
  const riders = useSelector((state: RootState) => state.riders.items);

  const [onlineStatus, setOnlineStatus] = useState<'available' | 'offline'>('offline');

  // Status update form states
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'picked_up' | 'delivered' | 'failed' | ''>('');
  const [proofPhoto, setProofPhoto] = useState<string>('');
  const [failureReason, setFailureReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Offline confirm modal
  const [confirmOfflineModal, setConfirmOfflineModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Simulated Coordinates
  const [lat, setLat] = useState(13.0827);
  const [lng, setLng] = useState(80.2707);
  const [locationSending, setLocationSending] = useState(false);

  const fetchRiderData = async () => {
    if (!user) return;
    try {
      await Promise.all([
        dispatch(fetchRiderOrders()).unwrap(),
        dispatch(fetchAllRiders()).unwrap(),
      ]);
    } catch (err) {
      addToast(typeof err === 'string' ? err : 'Failed to fetch delivery logs', 'error');
    }
  };

  useEffect(() => {
    fetchRiderData();

    const socket = connectSocket();

    socket.on('order_assigned', (data: { orderId: string; riderName: string }) => {
      fetchRiderData();
      addToast(`New order #${data.orderId.slice(-6)} assigned to you!`, 'success');
    });

    return () => {
      disconnectSocket();
    };
  }, [dispatch, user]);

  useEffect(() => {
    // Sync local state with Redux rider status
    const ownRecord = riders.find(r => r.id === user?.id);
    if (ownRecord) {
      setOnlineStatus(ownRecord.status);
    }
  }, [riders, user]);

  const handleToggleOnlineStatus = () => {
    const activeCount = deliveries.filter((d) => ['assigned', 'picked_up'].includes(d.status)).length;

    if (onlineStatus === 'available' && activeCount > 0) {
      // Show warning modal
      setConfirmOfflineModal(true);
    } else {
      executeToggleStatus();
    }
  };

  const executeToggleStatus = async () => {
    if (!user) return;
    const targetStatus = onlineStatus === 'available' ? 'offline' : 'available';

    try {
      await dispatch(updateRiderStatus({ id: user.id, data: { status: targetStatus } })).unwrap();
      addToast(`Availability updated to: ${targetStatus}`, 'success');
      setConfirmOfflineModal(false);
      fetchRiderData();
    } catch (err) {
      addToast(typeof err === 'string' ? err : 'Failed to update status', 'error');
    }
  };

  // Convert uploaded image file to Base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProofPhoto(reader.result as string);
      addToast('Proof photo uploaded successfully', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingOrderId || !selectedStatus) return;

    if (selectedStatus === 'delivered' && !proofPhoto) {
      addToast('Proof of delivery photo is required', 'warning');
      return;
    }
    if (selectedStatus === 'failed' && !failureReason) {
      addToast('Reason for failure is required', 'warning');
      return;
    }

    setActionLoading(true);
    try {
      await dispatch(updateOrderStatus({
        id: updatingOrderId,
        data: {
          status: selectedStatus,
          proofPhoto: selectedStatus === 'delivered' ? proofPhoto : undefined,
          failureReason: selectedStatus === 'failed' ? failureReason : undefined,
        }
      })).unwrap();

      addToast(`Order updated to: ${selectedStatus.replace('_', ' ')}`, 'success');

      // Clear update states
      setUpdatingOrderId(null);
      setSelectedStatus('');
      setProofPhoto('');
      setFailureReason('');

      // Refresh list
      fetchRiderData();
    } catch (err) {
      addToast(typeof err === 'string' ? err : 'Failed to update order', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendLocation = async () => {
    setLocationSending(true);
    try {
      // Simulate minor coordinate changes
      const nextLat = lat + (Math.random() - 0.5) * 0.01;
      const nextLng = lng + (Math.random() - 0.5) * 0.01;
      setLat(nextLat);
      setLng(nextLng);

      await dispatch(updateRiderLocation({ lat: nextLat, lng: nextLng })).unwrap();
      addToast('GPS location packet dispatched to Redis', 'success');
    } catch (err) {
      addToast(typeof err === 'string' ? err : 'Failed to sync location telemetry', 'error');
    } finally {
      setLocationSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-neutral-bg)] p-6">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[var(--color-neutral-bg)]/95 backdrop-blur-sm pt-4 -mx-6 px-6 flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b border-[var(--color-neutral-light)]">
        <div className="flex items-center gap-3">
          <img src="/image.png" alt="LogisticsPro" className="h-20 object-contain -my-4" />
          <div>
            <h1 className="text-2xl font-black text-[var(--color-primary)] tracking-tight">Rider Console</h1>
            <p className="text-xs text-[var(--color-secondary)] mt-0.5">Manage deliveries, update statuses, and submit photo proofs.</p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[var(--color-primary-light)]/10 px-3 py-1.5 rounded-full mr-2">
            <MdPerson className="text-[var(--color-primary)]" size={16} />
            <span className="text-sm font-semibold text-[var(--color-primary)]">{user?.name || 'Rider'}</span>
          </div>
          <Button variant="secondary" onClick={fetchRiderData} size="sm" className="gap-2">
            <MdRefresh size={18} /> Refresh
          </Button>
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${onlineStatus === 'available' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            <span className="text-xs uppercase font-bold text-slate-300">{onlineStatus}</span>
          </div>

          <Button
            variant={onlineStatus === 'available' ? 'outline' : 'primary'}
            size="sm"
            onClick={handleToggleOnlineStatus}
          >
            {onlineStatus === 'available' ? 'Go Offline' : 'Go Online'}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Telemetry Control */}
        <div className="lg:col-span-1 space-y-6">
          <Card title="GPS Simulation Panel" subtitle="Update current location. Cached in Redis memory (No DB hits).">
            <div className="space-y-4">
              <div className="bg-[var(--color-neutral-bg)] border border-[var(--color-neutral-light)] rounded-lg p-4 flex flex-col gap-2">
                <div className="flex justify-between text-xs font-mono text-[var(--color-secondary-dark)]">
                  <span>Latitude:</span>
                  <span className="text-[var(--color-neutral-text)] font-semibold">{lat.toFixed(5)}</span>
                </div>
                <div className="flex justify-between text-xs font-mono text-[var(--color-secondary-dark)]">
                  <span>Longitude:</span>
                  <span className="text-[var(--color-neutral-text)] font-semibold">{lng.toFixed(5)}</span>
                </div>
              </div>

              <Button
                variant="secondary"
                className="w-full flex items-center justify-center gap-2"
                onClick={handleSendLocation}
                isLoading={locationSending}
              >
                Sync GPS
              </Button>
            </div>
          </Card>
        </div>

        {/* Right column: Deliveries List */}
        <div className="lg:col-span-2">
          <Card title="My Consignments Logs" subtitle="Shipments assigned to you. Click status update button to update transit status.">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-neutral-light)] text-[var(--color-secondary)] text-xs uppercase font-semibold">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Pickup</th>
                    <th className="py-3 px-4">Dropoff</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-neutral-light)]">
                  {deliveries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[var(--color-secondary)] font-medium">
                        No assigned deliveries found. Set availability to online.
                      </td>
                    </tr>
                  ) : (
                    deliveries.map((order) => (
                      <tr key={order._id} className="hover:bg-[var(--color-neutral-light)]/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[var(--color-tertiary-dark)]">
                          #{order._id.slice(-6)}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[var(--color-neutral-text)]">
                          {order.clientId?.name || 'Client'}
                        </td>
                        <td className="py-3.5 px-4 text-[var(--color-secondary-dark)] font-medium truncate max-w-[120px]">
                          {order.pickupAddress}
                        </td>
                        <td className="py-3.5 px-4 text-[var(--color-secondary-dark)] font-medium truncate max-w-[120px]">
                          {order.dropAddress}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={order.priority}>{order.priority}</Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={order.status}>{order.status.replace('_', ' ')}</Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          {['assigned', 'picked_up'].includes(order.status) ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="text-xs py-1"
                              onClick={() => {
                                setUpdatingOrderId(order._id);
                                setSelectedStatus(order.status === 'assigned' ? 'picked_up' : '');
                              }}
                            >
                              Update Status
                            </Button>
                          ) : (
                            <span className="text-xs text-[var(--color-secondary)] font-bold uppercase">Locked</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Confirmation modal for going offline with active orders */}
      <Modal isOpen={confirmOfflineModal} onClose={() => setConfirmOfflineModal(false)} title="Confirm Going Offline">
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-neutral-text)] leading-relaxed">
            You have active orders currently assigned to you. Going offline will trigger{' '}
            <strong>automatic order reassignment</strong> to other available riders.
          </p>
          <p className="text-sm text-[var(--color-neutral-text)] font-semibold">Are you sure you want to go offline?</p>
          <div className="flex justify-end gap-3 mt-5">
            <Button variant="outline" onClick={() => setConfirmOfflineModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={executeToggleStatus}>
              Confirm Offline
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal for updating shipment status */}
      {updatingOrderId && (
        <Modal
          isOpen={!!updatingOrderId}
          onClose={() => {
            setUpdatingOrderId(null);
            setSelectedStatus('');
            setProofPhoto('');
            setFailureReason('');
          }}
          title="Update shipment Status"
        >
          <form onSubmit={handleStatusSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-secondary-dark)] mb-1">
                Select target status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value as 'picked_up' | 'delivered' | 'failed' | '');
                  setProofPhoto('');
                  setFailureReason('');
                }}
                className="w-full bg-[var(--color-neutral-bg)] border border-[var(--color-neutral-light)] rounded-lg px-3 py-2 text-sm text-[var(--color-neutral-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)] transition-colors"
              >
                <option value="">-- Choose Status --</option>
                {deliveries.find((d) => d._id === updatingOrderId)?.status === 'assigned' ? (
                  <option value="picked_up">Picked Up</option>
                ) : (
                  <>
                    <option value="delivered">Delivered</option>
                    <option value="failed">Failed</option>
                  </>
                )}
              </select>
            </div>

            {selectedStatus === 'delivered' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-secondary-dark)]">
                  Proof photo (Required)
                </label>
                <div className="border-2 border-dashed border-[var(--color-neutral-light)] hover:border-[var(--color-primary-light)] rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <MdCameraAlt size={24} className="text-[var(--color-secondary)] mb-2" />
                  <span className="text-xs text-[var(--color-secondary)]">Click to upload proof photo</span>
                </div>
                {proofPhoto && (
                  <div className="mt-2 text-center">
                    <span className="text-xs text-emerald-600 font-bold">Image loaded successfully</span>
                  </div>
                )}
              </div>
            )}

            {selectedStatus === 'failed' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-secondary-dark)] mb-1">
                  Reason for failure (Required)
                </label>
                <textarea
                  rows={3}
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  placeholder="e.g. Recipient was unreachable after 3 attempts"
                  className="w-full bg-[var(--color-neutral-bg)] border border-[var(--color-neutral-light)] rounded-lg px-3 py-2 text-sm text-[var(--color-neutral-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)] transition-colors"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 mt-5">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setUpdatingOrderId(null);
                  setSelectedStatus('');
                  setProofPhoto('');
                  setFailureReason('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={actionLoading} disabled={!selectedStatus}>
                Update Status
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Logout Confirmation Modal */}
      <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} title="Confirm Logout">
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-neutral-text)]">
            Are you sure you want to log out of your Rider account?
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
