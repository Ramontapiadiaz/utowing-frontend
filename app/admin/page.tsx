'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { io } from 'socket.io-client';
import { getUser, logout } from '../lib/auth';

const BACKEND_URL = 'https://utowing-backend.onrender.com';

const AdminMap = dynamic(
  () => import('../components/AdminMap'),
  { ssr: false },
);

const serviceLabels: Record<string, string> = {
  towing: '🚚 Towing',
  mobile_tire: '🛞 Mobile Tire',
  jump_start: '🔋 Jump Start',
  lockout: '🔓 Lockout',
  ev_charging: '⚡ EV Charging',
  fleet_recovery: '🏢 Fleet Recovery',
  heavy_duty: '🚛 Heavy Duty',
  insurance_claim: '📄 Insurance Claim',
};

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [drivers, setDrivers] = useState<Record<string, any>>({});
  const [requests, setRequests] = useState<Record<string, any>>({});
  const driverNames: Record<string, string> = {
  '3802b758-168d-4f9d-8b16-c6bb0b6f87ff': 'Ramon Truck 1',
  '11aac38d-1e07-47a3-b0f5-54592f6e8fdd': 'Driver Truck 2',
};

const calculateEtaMinutes = (
  driverLat?: number,
  driverLng?: number,
  pickupLat?: number,
  pickupLng?: number,
) => {
  if (!driverLat || !driverLng || !pickupLat || !pickupLng) return null;

  const earthRadiusKm = 6371;
  const dLat = ((pickupLat - driverLat) * Math.PI) / 180;
  const dLng = ((pickupLng - driverLng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((driverLat * Math.PI) / 180) *
      Math.cos((pickupLat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = earthRadiusKm * c;

  return Math.max(1, Math.round((distanceKm / 35) * 60));
};


  useEffect(() => {
    const user = getUser();

    if (!user) {
      window.location.href = '/login';
      return;
    }

    if (user.role !== 'admin') {
      alert('Admin access only');
      window.location.href = '/login';
      return;
    }

    setAuthorized(true);
  }, []);

  useEffect(() => {
    if (!authorized) return;

    const token = localStorage.getItem('token') || '';

    const socket = io(BACKEND_URL, {
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('ADMIN CONNECTED:', socket.id);
    });

    socket.on('driverLocationUpdated', (data) => {
      setDrivers((current) => ({
        ...current,
        [data.driverId]: data,
      }));
    });

    socket.on('towRequestCreated', (request) => {
      setRequests((current) => ({
        ...current,
        [request.id]: request,
      }));
    });

    socket.on('towRequestUpdated', (request) => {
      setRequests((current) => ({
        ...current,
        [request.id]: request,
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, [authorized]);

  if (!authorized) return null;

  const requestList = Object.values(requests);
  const driverList = Object.values(drivers);

  const activeJobs = requestList.filter(
    (request: any) =>
      request.status !== 'completed' &&
      request.tripStatus !== 'completed',
  );

  const completedJobs = requestList.filter(
    (request: any) =>
      request.status === 'completed' ||
      request.tripStatus === 'completed',
  );

  const paidJobs = requestList.filter(
    (request: any) => request.paymentStatus === 'paid',
  );

  const unpaidJobs = requestList.filter(
    (request: any) =>
      request.paymentStatus !== 'paid',
  );

  const revenue = paidJobs.reduce(
    (sum: number, request: any) =>
      sum + Number(request.estimatedPrice ?? 75),
    0
  );

  console.log('REQUEST LIST:', requestList);
  console.log('PAID JOBS:', paidJobs);
  console.log('REVENUE:', revenue);

  const driverRevenue = paidJobs.reduce(
  (acc: Record<string, number>, request: any) => {
    if (!request.assignedDriverId) return acc;

    acc[request.assignedDriverId] =
      (acc[request.assignedDriverId] || 0) +
     Number(request.estimatedPrice ?? 75);

    return acc;
  },
  {}
);  

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-[460px_1fr]">
        <aside className="overflow-y-auto border-r border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                uTowing Admin
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                Pilot operations command center
              </p>
            </div>

            <button
              onClick={logout}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-sm"
            >
              Logout
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Metric label="Online Drivers" value={driverList.length} />
            <Metric label="Active Jobs" value={activeJobs.length} />
            <Metric label="Paid Jobs" value={paidJobs.length} />
            <Metric label="Unpaid Jobs" value={unpaidJobs.length} />
            <Metric label="Completed" value={completedJobs.length} />
            <Metric label="Revenue" value={`$${revenue.toFixed(2)}`} />
          </div>

          <section className="mt-8">
            <h2 className="text-xl font-bold">Live Drivers</h2>

            <div className="mt-3 space-y-3">
              {driverList.length === 0 && (
                <p className="text-sm text-zinc-500">
                  No drivers online.
                </p>
              )}

              {driverList.map((driver: any) => (
                <div
                  key={driver.driverId}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <p className="text-xs uppercase text-zinc-500">
                    Driver
                  </p>

                  <p className="mt-1 break-all font-semibold">
                    {driverNames[driver.driverId] || driver.driverId}
                  </p>

                  <div className="mt-3 inline-block rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-400">
                    ONLINE
                  </div>

                  <p className="mt-3 text-xs text-zinc-500">
                    GPS: {driver.latitude}, {driver.longitude}
                  </p>
  
		  <p className="mt-2 text-sm text-green-400">
		     Revenue: $
		     {(driverRevenue[driver.driverId] || 0).toFixed(2)}
		  </p>

              </div>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold">Live Requests</h2>

            <div className="mt-3 space-y-4">
              {requestList.length === 0 && (
                <p className="text-sm text-zinc-500">
                  No requests yet.
                </p>
              )}

              {requestList
                .slice()
                .reverse()
                .map((request: any) => {
                  const service =
                    serviceLabels[request.serviceType] ||
                    request.serviceType ||
                    '🚚 Towing';

          const assignedDriver =
  request.assignedDriverId
    ? drivers[request.assignedDriverId]
    : null;

const liveEtaMinutes = calculateEtaMinutes(
  assignedDriver?.latitude,
  assignedDriver?.longitude,
  request.pickupLatitude,
  request.pickupLongitude,
);

                  return (
                    <div
                      key={request.id}
                      className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-bold">
                            {request.customerName || 'Customer'}
                          </p>

                          <p className="mt-1 text-sm text-zinc-400">
                            {service}
                          </p>
                        </div>

                        <PaymentBadge status={request.paymentStatus} />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <StatusBadge label="Request" value={request.status || 'pending'} />
                        <StatusBadge label="Trip" value={request.tripStatus || 'waiting'} />
                      </div>

                      <div className="mt-4 space-y-1 text-sm text-zinc-400">
                        <p>
                          Phone:{' '}
                          <span className="text-white">
                            {request.phone || 'N/A'}
                          </span>
                        </p>

                        <p>
                          Driver:{' '}
                          <span className="break-all text-white">
                            {request.assignedDriverId
 			       ? driverNames[request.assignedDriverId] || request.assignedDriverId: 'Unassigned'}
                          </span>
                        </p>

                        <p>
                          Price:{' '}
                          <span className="text-white">
                            ${Number(request.estimatedPrice ?? 75). toFixed(2)}
                          </span>
                        </p>

                        <p>
                          ETA:{' '}
                          <span className="text-white">
                            {request.estimatedEta ?? 'N/A'} mins
                          </span>
                        </p>
                      </div>

                        <p>
                       Live ETA:{' '}
                         <span className="text-white">
                            {liveEtaMinutes ? `${liveEtaMinutes} mins` : 'Calculating...'}
                      </span>
                      </p>


                      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm">
                        <p className="font-semibold text-zinc-300">
                          Vehicle
                        </p>

                        <p className="mt-1 text-zinc-400">
                          {request.vehicleYear || ''}{' '}
                          {request.vehicleMake || ''}{' '}
                          {request.vehicleModel || ''}
                        </p>

                        <p className="text-zinc-500">
                          Color: {request.vehicleColor || 'N/A'} · Plate:{' '}
                          {request.vehiclePlate || 'N/A'}
                        </p>
                      </div>

                      <p className="mt-4 text-xs text-zinc-600">
                        Request ID: {request.id}
                      </p>
                    </div>
                  );
                })}
            </div>
          </section>
        </aside>

        <section className="p-6">
          <AdminMap drivers={drivers} requests={requests} />
        </section>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function PaymentBadge({ status }: { status?: string }) {
  const paid = status === 'paid';

  return (
    <div
      className={`rounded-full px-3 py-1 text-sm font-semibold ${
        paid
          ? 'bg-green-500/20 text-green-400'
          : 'bg-red-500/20 text-red-400'
      }`}
    >
      {paid ? 'PAID' : 'UNPAID'}
    </div>
  );
}

function StatusBadge({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-full bg-blue-500/20 px-3 py-1 text-sm text-blue-400">
      {label}: {value}
    </div>
  );
}
