'use client';

import {
  useEffect,
  useState,
} from 'react';

import axios from 'axios';

import {
  getUser,
  logout,
} from '../lib/auth';

const BACKEND_URL =
  'https://utowing-backend.onrender.com';

export default function DashboardPage() {
  const [user, setUser] =
    useState<any>(null);

  const [trips, setTrips] =
    useState<any[]>([]);

  const [vehicles, setVehicles] =
    useState<any[]>([]);

  const [make, setMake] =
    useState('');

  const [model, setModel] =
    useState('');

  const [year, setYear] =
    useState('');

  const [color, setColor] =
    useState('');

  const [plate, setPlate] =
    useState('');

  useEffect(() => {
    const storedUser = getUser();

    if (!storedUser) {
      window.location.href = '/login';
      return;
    }

    setUser(storedUser);
    fetchTrips(storedUser.id);
    fetchVehicles(storedUser.id);
  }, []);

  const fetchTrips = async (
    customerUserId: string,
  ) => {
    const token =
      localStorage.getItem('token');

    try {
      const response =
        await axios.get(
          `${BACKEND_URL}/tow-requests?customerUserId=${customerUserId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

      setTrips(response.data);
    } catch (error) {
      console.log('TRIPS ERROR:', error);
    }
  };

  const fetchVehicles = async (
    customerUserId: string,
  ) => {
    try {
      const response =
        await axios.get(
          `${BACKEND_URL}/vehicles?customerUserId=${customerUserId}`,
        );

      setVehicles(response.data);
    } catch (error) {
      console.log('VEHICLES ERROR:', error);
    }
  };

  const addVehicle = async () => {
    if (!user) return;

    try {
      await axios.post(
        `${BACKEND_URL}/vehicles`,
        {
          customerUserId: user.id,
          make,
          model,
          year,
          color,
          plate,
        },
      );

      setMake('');
      setModel('');
      setYear('');
      setColor('');
      setPlate('');

      fetchVehicles(user.id);
    } catch (error: any) {
      alert(
        JSON.stringify(
          error.response?.data ||
            error.message,
        ),
      );
    }
  };

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold">
              Welcome back
            </h1>

            <p className="mt-3 text-zinc-400">
              Manage your roadside services and account.
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-xl border border-zinc-700 px-5 py-3"
          >
            Logout
          </button>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Card
            title="Name"
            value={user.name || 'N/A'}
          />

          <Card
            title="Email"
            value={user.email || 'N/A'}
          />

          <Card
            title="Phone"
            value={user.phone || 'N/A'}
          />
        </div>

        <section className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
          <h2 className="text-3xl font-bold">
            Roadside Assistance
          </h2>

          <p className="mt-3 text-zinc-400">
            Create and manage roadside service requests.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="/customer"
              className="rounded-xl bg-white px-6 py-4 font-semibold text-black"
            >
              Create Request
            </a>
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
          <h2 className="text-3xl font-bold">
            Saved Vehicles
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-5">
            <input
              value={make}
              onChange={(event) =>
                setMake(event.target.value)
              }
              placeholder="Make"
              className="rounded-xl border border-zinc-700 bg-zinc-950 p-4"
            />

            <input
              value={model}
              onChange={(event) =>
                setModel(event.target.value)
              }
              placeholder="Model"
              className="rounded-xl border border-zinc-700 bg-zinc-950 p-4"
            />

            <input
              value={year}
              onChange={(event) =>
                setYear(event.target.value)
              }
              placeholder="Year"
              className="rounded-xl border border-zinc-700 bg-zinc-950 p-4"
            />

            <input
              value={color}
              onChange={(event) =>
                setColor(event.target.value)
              }
              placeholder="Color"
              className="rounded-xl border border-zinc-700 bg-zinc-950 p-4"
            />

            <input
              value={plate}
              onChange={(event) =>
                setPlate(event.target.value)
              }
              placeholder="Plate"
              className="rounded-xl border border-zinc-700 bg-zinc-950 p-4"
            />
          </div>

          <button
            onClick={addVehicle}
            className="mt-4 rounded-xl bg-white px-6 py-4 font-semibold text-black"
          >
            Add Vehicle
          </button>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {vehicles.length === 0 && (
              <p className="text-zinc-500">
                No saved vehicles yet.
              </p>
            )}

            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
              >
                <p className="text-xl font-bold">
                  {vehicle.year} {vehicle.make}{' '}
                  {vehicle.model}
                </p>

                <p className="mt-2 text-sm text-zinc-400">
                  Color: {vehicle.color || 'N/A'}
                </p>

                <p className="text-sm text-zinc-400">
                  Plate: {vehicle.plate || 'N/A'}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
          <h2 className="text-3xl font-bold">
            Trip History
          </h2>

          <div className="mt-6 space-y-4">
            {trips.length === 0 && (
              <p className="text-zinc-500">
                No trips yet.
              </p>
            )}

            {trips.map((trip) => (
              <div
                key={trip.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
              >
                <p className="font-semibold">
                  {trip.serviceType || 'towing'}
                </p>

                <p className="mt-2 text-sm text-zinc-400">
                  Status: {trip.status}
                </p>

                <p className="text-sm text-zinc-400">
                  Trip:{' '}
                  {trip.tripStatus || 'waiting'}
                </p>

                <p className="text-sm text-zinc-400">
                  Price: $
                  {trip.estimatedPrice ?? 'N/A'}
                </p>

                <p className="text-sm text-zinc-400">
                  Driver:{' '}
                  {trip.assignedDriverId ||
                    'Unassigned'}
                </p>

                <p className="mt-2 text-xs text-zinc-500">
                  {trip.createdAt
                    ? new Date(
                        trip.createdAt,
                      ).toLocaleString()
                    : 'No date'}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
      <p className="text-sm text-zinc-500">
        {title}
      </p>

      <p className="mt-3 text-xl font-semibold">
        {value}
      </p>
    </div>
  );
}
