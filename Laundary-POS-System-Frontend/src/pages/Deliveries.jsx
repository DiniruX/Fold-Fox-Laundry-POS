import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TruckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhoneIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import {
  useDeliverySchedule,
  toDateKey,
  addDays,
  describeDay,
} from '../services/deliveryService';
import {
  useUpdateOrderStatus,
  formatOrderAmount,
  getOrderStatusLabel,
  getOrderStatusColor,
} from '../services/orderService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Monday-first calendar grid (6 weeks) for the month that contains `anchor`
const buildMonthGrid = (anchor) => {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7; // 0 = Monday
  const start = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
};

const DeliveryCard = ({ order, onView, onMarkDelivered, marking }) => {
  const delivered = order.status === 'complete';
  const ready = order.status === 'deliver';
  const address = [order.deliveryAddress?.street, order.deliveryAddress?.city].filter(Boolean).join(', ');
  const itemsSummary = (order.items || [])
    .map((i) => `${i.serviceName}${i.weight > 0 ? ` ${i.weight}kg` : ` ×${i.quantity}`}`)
    .join(', ');

  return (
    <div className={`rounded-xl border-2 p-4 transition-colors ${delivered ? 'border-green-200 bg-green-50/50' : ready ? 'border-teal-300 bg-white' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => onView(order)} className="text-sm font-bold text-gray-900 font-mono hover:text-[#fe7f2d]">
              {order.orderNumber}
            </button>
            <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${getOrderStatusColor(order.status)}`}>
              {getOrderStatusLabel(order.status)}
            </span>
            {order.balanceAmount > 0 && (
              <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-semibold bg-red-100 text-red-700">
                Collect {formatOrderAmount(order.balanceAmount)}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-800 mt-1">{order.customerInfo?.name}</p>
          <div className="text-xs text-gray-600 mt-1 space-y-0.5">
            {order.customerInfo?.phone && (
              <p className="flex items-center gap-1"><PhoneIcon className="h-3.5 w-3.5" /> <a href={`tel:${order.customerInfo.phone}`} className="hover:underline">{order.customerInfo.phone}</a></p>
            )}
            <p className="flex items-start gap-1"><MapPinIcon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" /> <span>{address || 'No address'}</span></p>
            {order.deliveryAddress?.notes && <p className="italic text-gray-500">📝 {order.deliveryAddress.notes}</p>}
          </div>
          {itemsSummary && <p className="text-xs text-gray-500 mt-2 truncate">{itemsSummary}</p>}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-gray-900">{formatOrderAmount(order.totalAmount)}</p>
          <p className={`text-xs ${order.balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {order.balanceAmount > 0 ? 'Unpaid' : 'Paid'}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
        <Button variant="outline" size="sm" onClick={() => onView(order)}>Open order</Button>
        {ready && (
          <Button variant="success" size="sm" loading={marking === order._id} onClick={() => onMarkDelivered(order)}>
            <CheckCircleIcon className="h-4 w-4" />
            Mark delivered
          </Button>
        )}
        {delivered && (
          <span className="text-xs font-semibold text-green-700 flex items-center gap-1">
            <CheckCircleIcon className="h-4 w-4" /> Delivered
          </span>
        )}
      </div>
    </div>
  );
};

const Deliveries = () => {
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(toDateKey(today));

  const grid = useMemo(() => buildMonthGrid(month), [month]);
  const { data, isLoading, error, isFetching } = useDeliverySchedule(grid[0], grid[grid.length - 1]);
  const byDay = data?.byDay || {};
  const unscheduled = data?.unscheduled || [];

  const updateStatus = useUpdateOrderStatus();
  const [marking, setMarking] = useState(null);

  const todayKey = toDateKey(today);
  const tomorrowKey = toDateKey(addDays(today, 1));
  const selectedOrders = byDay[selectedDay] || [];
  const selectedDate = new Date(`${selectedDay}T00:00:00`);

  const pendingCount = (orders) => orders.filter((o) => o.status !== 'complete').length;

  // Overdue: scheduled before today and still not delivered
  const overdue = useMemo(
    () => Object.entries(byDay)
      .filter(([key]) => key < todayKey)
      .flatMap(([, orders]) => orders.filter((o) => o.status !== 'complete')),
    [byDay, todayKey]
  );

  const jumpTo = (date) => {
    const key = toDateKey(date);
    setSelectedDay(key);
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  };

  const handleMarkDelivered = async (order) => {
    setMarking(order._id);
    try {
      await updateStatus.mutateAsync({ id: order._id, data: { status: 'complete' } });
    } finally {
      setMarking(null);
    }
  };

  const handleView = (order) => navigate(`/orders/${order._id}`);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl shadow-lg overflow-hidden" style={{ background: 'linear-gradient(135deg, #233d4d 0%, #2a4a5c 100%)' }}>
        <div className="px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="h-14 w-14 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#fe7f2d' }}>
                <TruckIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Deliveries</h1>
                <p className="text-white/70 mt-1">What goes out today, tomorrow, and the rest of the month</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: 'Today', date: today, count: pendingCount(byDay[todayKey] || []) },
                { label: 'Tomorrow', date: addDays(today, 1), count: pendingCount(byDay[tomorrowKey] || []) },
              ].map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => jumpTo(chip.date)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border ${
                    selectedDay === toDateKey(chip.date) ? 'bg-white text-[#233d4d] border-white' : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                  }`}
                >
                  {chip.label}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${selectedDay === toDateKey(chip.date) ? 'bg-[#fe7f2d] text-white' : 'bg-white/20'}`}>{chip.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Overdue warning */}
      {overdue.length > 0 && (
        <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-800">{overdue.length} overdue deliver{overdue.length === 1 ? 'y' : 'ies'} this month</p>
            <p className="text-xs text-red-700 mt-0.5">Scheduled before today and not yet marked delivered.</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {overdue.slice(0, 8).map((o) => (
                <button key={o._id} onClick={() => jumpTo(new Date(o.expectedDeliveryDate))} className="px-2.5 py-1 rounded-lg bg-white border border-red-200 text-xs font-semibold text-red-800 hover:bg-red-100">
                  {o.orderNumber} · {describeDay(o.expectedDeliveryDate)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Calendar */}
        <div className="xl:col-span-3 bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"><ChevronLeftIcon className="h-5 w-5" /></button>
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-900">{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
              <button onClick={() => jumpTo(today)} className="text-xs font-semibold text-[#fe7f2d] hover:underline">Back to today</button>
            </div>
            <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"><ChevronRightIcon className="h-5 w-5" /></button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-72"><LoadingSpinner size="lg" /></div>
          ) : error ? (
            <p className="text-center text-red-600 py-12">Failed to load deliveries</p>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEKDAYS.map((d) => <div key={d} className="text-center text-xs font-semibold text-gray-500 py-1">{d}</div>)}
              </div>
              <div className={`grid grid-cols-7 gap-1 ${isFetching ? 'opacity-70' : ''}`}>
                {grid.map((date) => {
                  const key = toDateKey(date);
                  const orders = byDay[key] || [];
                  const pending = pendingCount(orders);
                  const done = orders.length - pending;
                  const inMonth = date.getMonth() === month.getMonth();
                  const isToday = key === todayKey;
                  const isSelected = key === selectedDay;
                  const isPast = key < todayKey;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedDay(key)}
                      className={`relative h-20 rounded-xl border-2 p-1.5 text-left transition-all ${
                        isSelected ? 'border-[#fe7f2d] bg-orange-50 shadow-sm' : 'border-gray-100 hover:border-gray-300'
                      } ${inMonth ? 'bg-white' : 'bg-gray-50/60'}`}
                    >
                      <span className={`text-xs font-semibold ${isToday ? 'inline-flex h-6 w-6 items-center justify-center rounded-full text-white' : inMonth ? 'text-gray-800' : 'text-gray-400'}`} style={isToday ? { backgroundColor: '#fe7f2d' } : {}}>
                        {date.getDate()}
                      </span>
                      {orders.length > 0 && (
                        <div className="absolute bottom-1.5 left-1.5 right-1.5 space-y-0.5">
                          {pending > 0 && (
                            <div className={`text-[11px] font-bold rounded-md px-1.5 py-0.5 truncate ${isPast ? 'bg-red-100 text-red-800' : 'bg-teal-100 text-teal-800'}`}>
                              🚚 {pending} to deliver
                            </div>
                          )}
                          {done > 0 && (
                            <div className="text-[11px] font-semibold rounded-md px-1.5 py-0.5 bg-green-100 text-green-800 truncate">✓ {done} done</div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Day list */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{describeDay(selectedDate)}</h3>
                <p className="text-xs text-gray-500">{selectedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <span className="px-3 py-1 rounded-full text-sm font-bold bg-teal-100 text-teal-800">
                {pendingCount(selectedOrders)} pending
              </span>
            </div>
            {selectedOrders.length === 0 ? (
              <div className="text-center py-10">
                <CalendarDaysIcon className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-2 text-sm font-medium text-gray-700">No deliveries scheduled</p>
                <p className="text-xs text-gray-500">Delivery orders appear here on their delivery date.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
                {selectedOrders.map((order) => (
                  <DeliveryCard key={order._id} order={order} onView={handleView} onMarkDelivered={handleMarkDelivered} marking={marking} />
                ))}
              </div>
            )}
          </div>

          {unscheduled.length > 0 && (
            <div className="bg-white rounded-xl shadow-md border-2 border-amber-200 p-6">
              <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                <ExclamationTriangleIcon className="h-5 w-5" />
                {unscheduled.length} delivery order{unscheduled.length === 1 ? '' : 's'} without a date
              </h3>
              <p className="text-xs text-amber-700 mt-1 mb-3">Open the order and edit it to set a delivery date.</p>
              <div className="space-y-2">
                {unscheduled.map((o) => (
                  <button key={o._id} onClick={() => handleView(o)} className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg border border-amber-100 hover:bg-amber-50">
                    <span className="text-sm font-semibold text-gray-800 font-mono">{o.orderNumber}</span>
                    <span className="text-xs text-gray-600 truncate ml-2">{o.customerInfo?.name}</span>
                    <span className={`ml-2 inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${getOrderStatusColor(o.status)}`}>{getOrderStatusLabel(o.status)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Deliveries;
