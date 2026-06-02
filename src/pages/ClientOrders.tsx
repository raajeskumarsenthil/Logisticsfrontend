import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type AppDispatch, type RootState } from '../store/store';
import { fetchClientOrders, createOrder } from '../features/orders';
import type { Order } from '../features/orders/types';

import { connectSocket, disconnectSocket } from '../socket';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { MdRefresh, MdPerson } from 'react-icons/md';

export const ClientOrders: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { addToast } = useToast();

  const myOrders = useSelector((state: RootState) => state.orders.items); // Using modular slice state
  const user = useSelector((state: RootState) => state.auth.user);

  // Form State
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [packageDetails, setPackageDetails] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [submitting, setSubmitting] = useState(false);

  // 503 Retry State
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  // Modal State
  const [selectedOrderForTimeline, setSelectedOrderForTimeline] = useState<Order | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const fetchMyOrders = async () => {
    try {
      await dispatch(fetchClientOrders()).unwrap();
    } catch (err) {
      addToast(typeof err === 'string' ? err : 'Failed to load your orders', 'error');
    }
  };

  useEffect(() => {
    fetchMyOrders();

    const socket = connectSocket();

    socket.on('order_assigned', (data: { orderId: string; riderName: string }) => {
      // Refresh list to pull updated assigned rider fields
      fetchMyOrders();
      addToast(`Your order has been assigned to ${data.riderName}`, 'info');
    });

    socket.on('order_status_changed', (data: { orderId: string; status: Order['status']; timeline: Order['timeline'] }) => {
      if (data.status === 'delivered') {
        addToast('Your order has been delivered! 🎉', 'success');
      } else {
        addToast(`Order status updated to ${data.status.replace('_', ' ')}`, 'info');
      }
      fetchMyOrders();
    });

    return () => {
      disconnectSocket();
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const handleSubmitOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!pickupAddress || !dropAddress || !packageDetails) {
      addToast('Please fill in all address and package details fields', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await dispatch(createOrder({
        pickupAddress,
        dropAddress,
        packageDetails,
        priority,
      })).unwrap();

      addToast('Order placed successfully!', 'success');

      // Clear Form
      setPickupAddress('');
      setDropAddress('');
      setPackageDetails('');
      setPriority('normal');
      setCountdown(null);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      // Refresh list
      fetchMyOrders();
    } catch (err) {
      const errMsg = typeof err === 'string' ? err : 'Failed to place order';
      if (errMsg.includes && errMsg.includes('No riders available')) {
        addToast('No riders available. Starting countdown timer.', 'error');
        startRetryCountdown(60);
      } else {
        addToast(errMsg, 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const startRetryCountdown = (seconds: number) => {
    setCountdown(seconds);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    countdownIntervalRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          // Auto retry
          addToast('Retrying order placement...', 'info');
          handleSubmitOrder();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[var(--color-neutral-bg)] p-6">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[var(--color-neutral-bg)]/95 backdrop-blur-sm pt-4 -mx-6 px-6 flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b border-[var(--color-neutral-light)]">
        <div className="flex items-center gap-3">
          <img src="/image.png" alt="LogisticsPro" className="h-20 object-contain -my-4" />
          <div>
            <h1 className="text-2xl font-black text-[var(--color-primary)] tracking-tight">Client Terminal</h1>
            <p className="text-xs text-[var(--color-secondary)] mt-0.5">Book and track your logistics requests in real-time.</p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[var(--color-primary-light)]/10 px-3 py-1.5 rounded-full mr-2">
            <MdPerson className="text-[var(--color-primary)]" size={16} />
            <span className="text-sm font-semibold text-[var(--color-primary)]">{user?.name || 'Client'}</span>
          </div>
          <Button variant="secondary" onClick={fetchMyOrders} className="gap-2">
            <MdRefresh size={18} />
            Refresh
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
        {/* Placement Form Card */}
        <div className="lg:col-span-1">
          <Card title="Book a Delivery" subtitle="Submit courier details. Assignments are automated based on priority rules.">
            {countdown !== null ? (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-lg text-center mb-4">
                <span className="animate-ping inline-flex h-3 w-3 rounded-full bg-rose-500 mr-2" />
                <p className="text-xs text-rose-300 font-semibold uppercase tracking-wider">
                  No riders available. Retrying in {countdown}s...
                </p>
                <p className="text-[10px] text-[var(--color-secondary)] mt-1">
                  The system will automatically resend the booking request.
                </p>
              </div>
            ) : null}

            <form onSubmit={handleSubmitOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-secondary-dark)] mb-1">
                  Pickup Address
                </label>
                <input
                  type="text"
                  disabled={countdown !== null}
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="e.g. 123 Main St, Zone A"
                  className="w-full bg-[var(--color-neutral-bg)] border border-[var(--color-neutral-light)] rounded-lg px-3 py-2 text-sm text-[var(--color-neutral-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)] transition-colors disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-secondary-dark)] mb-1">
                  Drop-off Address
                </label>
                <input
                  type="text"
                  disabled={countdown !== null}
                  value={dropAddress}
                  onChange={(e) => setDropAddress(e.target.value)}
                  placeholder="e.g. 456 Merchant Ave, Zone B"
                  className="w-full bg-[var(--color-neutral-bg)] border border-[var(--color-neutral-light)] rounded-lg px-3 py-2 text-sm text-[var(--color-neutral-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)] transition-colors disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-secondary-dark)] mb-1">
                  Package Details
                </label>
                <textarea
                  rows={3}
                  disabled={countdown !== null}
                  value={packageDetails}
                  onChange={(e) => setPackageDetails(e.target.value)}
                  placeholder="e.g. Document envelope, urgent files"
                  className="w-full bg-[var(--color-neutral-bg)] border border-[var(--color-neutral-light)] rounded-lg px-3 py-2 text-sm text-[var(--color-neutral-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)] transition-colors disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-secondary-dark)] mb-1">
                  Priority Rules
                </label>
                <select
                  disabled={countdown !== null}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'normal' | 'urgent')}
                  className="w-full bg-[var(--color-neutral-bg)] border border-[var(--color-neutral-light)] rounded-lg px-3 py-2 text-sm text-[var(--color-neutral-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)] transition-colors disabled:opacity-50"
                >
                  <option value="normal">Normal Priority (Available Riders)</option>
                  <option value="urgent">Urgent Priority (Least Busy Rider)</option>
                </select>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                disabled={countdown !== null}
                isLoading={submitting}
              >
                Submit Booking
              </Button>
            </form>
          </Card>
        </div>

        {/* My Orders List Card */}
        <div className="lg:col-span-2">
          <Card title="Your Bookings Log" subtitle="Real-time order tracking records. Click any row to view its horizontal stepper modal.">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-neutral-light)] text-[var(--color-secondary)] text-xs uppercase font-semibold">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Package</th>
                    <th className="py-3 px-4">Drop Address</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-neutral-light)]">
                  {myOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[var(--color-secondary)] font-medium">
                        No orders placed yet. Enter pickup and drop addresses above.
                      </td>
                    </tr>
                  ) : (
                    myOrders.map((order) => (
                      <tr
                        key={order._id}
                        onClick={() => setSelectedOrderForTimeline(order)}
                        className="cursor-pointer hover:bg-[var(--color-neutral-light)]/30 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[var(--color-tertiary-dark)]">
                          #{order._id.slice(-6)}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[var(--color-neutral-text)] truncate max-w-[150px]">
                          {order.packageDetails}
                        </td>
                        <td className="py-3.5 px-4 text-[var(--color-neutral-text)] truncate max-w-[150px]">
                          {order.dropAddress}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={order.priority}>{order.priority}</Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={order.status}>{order.status.replace('_', ' ')}</Badge>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[var(--color-primary-light)] font-bold hover:underline">
                          View Timeline
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

      {/* Stepper Timeline Modal */}
      {selectedOrderForTimeline && (
        <Modal
          isOpen={!!selectedOrderForTimeline}
          onClose={() => setSelectedOrderForTimeline(null)}
          title={`Order Tracking - #${selectedOrderForTimeline._id.slice(-6)}`}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 bg-[var(--color-neutral-bg)] p-4 border border-[var(--color-neutral-light)] rounded-lg text-xs">
              <div>
                <p className="text-[var(--color-secondary)] uppercase font-bold tracking-wide">Pickup</p>
                <p className="font-semibold text-[var(--color-neutral-text)] mt-0.5">
                  {selectedOrderForTimeline.pickupAddress}
                </p>
              </div>
              <div>
                <p className="text-[var(--color-secondary)] uppercase font-bold tracking-wide">Dropoff</p>
                <p className="font-semibold text-[var(--color-neutral-text)] mt-0.5">
                  {selectedOrderForTimeline.dropAddress}
                </p>
              </div>
              <div className="col-span-2 border-t border-[var(--color-neutral-light)] pt-2 mt-2">
                <p className="text-[var(--color-secondary)] uppercase font-bold tracking-wide">Package</p>
                <p className="font-semibold text-[var(--color-neutral-text)] mt-0.5">
                  {selectedOrderForTimeline.packageDetails}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-secondary-dark)] mb-4">
                Tracking Timeline Steps
              </h4>
              <div className="relative border-l border-[var(--color-secondary-light)] pl-4 space-y-4 text-xs">
                {selectedOrderForTimeline.timeline?.map((evt, i) => (
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

            {selectedOrderForTimeline.status === 'failed' && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg text-xs text-rose-300">
                <strong>Failure Reason:</strong> {selectedOrderForTimeline.failureReason}
              </div>
            )}

            {selectedOrderForTimeline.status === 'delivered' && selectedOrderForTimeline.timeTakenMinutes && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg text-xs text-emerald-300">
                <strong>Delivered in:</strong> {selectedOrderForTimeline.timeTakenMinutes} minutes
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Logout Confirmation Modal */}
      <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} title="Confirm Logout">
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-neutral-text)]">
            Are you sure you want to log out of your account?
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
