'use client';

import axios from 'axios';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { getUser, logout } from '../lib/auth';

const BACKEND_URL = 'https://utowing-backend.onrender.com';

const CustomerMap = dynamic(
  () => import('../components/CustomerMap'),
  { ssr: false },
);

export default function CustomerPage() {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceType, setServiceType] = useState('towing');
  const [loading, setLoading] = useState(false);

  const [destinationAddress, setDestinationAddress] = useState('');
  const [vehicleSituation, setVehicleSituation] = useState('');
  const [recoverySituation, setRecoverySituation] = useState('');
  const [vehiclePhotos, setVehiclePhotos] = useState<File[]>([]);
const [destinationLatitude, setDestinationLatitude] = useState<number | null>(null);
const [destinationLongitude, setDestinationLongitude] = useState<number | null>(null);

  const [request, setRequest] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<any>(null);
  const driverNames: Record<string, string> ={
  '63bd3243-76b3-4c26-b9b8-8f5bf7af9028': 'Brooks Towing',
  '11aac38d-1e07-47a3-b0f5-54592f6e8fdd': 'Ramon Towing',
};

const calculateEtaMinutes = (
  driverLat?: number,
  driverLng?: number,
  pickupLat?: number,
  pickupLng?: number,
) => {
  if (!driverLat || !driverLng || !pickupLat || !pickupLng) {
    return null;
  }

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

  const averageSpeedKmh = 35;
  const etaMinutes = Math.max(
    1,
    Math.round((distanceKm / averageSpeedKmh) * 60),
  );

  return etaMinutes;
};

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');

  const geocodeDestination = async (address: string) => {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!token || !address.trim()) {
    return null;
  }

  try {
    const response = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        address
      )}.json`,
      {
        params: {
          access_token: token,
          limit: 1,
          country: 'ca',
        },
      }
    );

    const feature = response.data.features?.[0];

    if (!feature) {
      return null;
    }

    const [longitude, latitude] = feature.center;

    setDestinationLatitude(latitude);
    setDestinationLongitude(longitude);

    return { latitude, longitude };
  } catch (error) {
    console.error('DESTINATION GEOCODING ERROR:', error);
    return null;
  }
};

  const fetchVehicles = async (customerUserId: string) => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/vehicles?customerUserId=${customerUserId}`,
      );

      setVehicles(response.data);
    } catch (error) {
      console.log('VEHICLES ERROR:', error);
    }
  };

const refreshRequest = async (requestId: string) => {
  try {
  
  const token = localStorage.getItem('token') || '';

const response = await axios.get(
  `${BACKEND_URL}/tow-requests/my`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
);

    const latest = response.data.find(
      (item: any) => item.id === requestId,
    );

    if (latest) {
      setRequest(latest);

      if (latest.assignedDriverId) {
        const driverResponse = await axios.get(`${BACKEND_URL}/drivers`);

        console.log('LATEST REQUEST:', latest);
        console.log('DRIVERS:', driverResponse.data);

        const driver = driverResponse.data.find(
          (item: any) => item.id === latest.assignedDriverId,
        );

    const liveGpsTripStatuses = [
  'en_route',
  'arrived',
  'in_service',
];

const shouldUseLiveGps =
  liveGpsTripStatuses.includes(latest.tripStatus);

const locationLatitude = shouldUseLiveGps
  ? driver?.latitude ?? null
  : driver?.baseLatitude ?? null;

const locationLongitude = shouldUseLiveGps
  ? driver?.longitude ?? null
  : driver?.baseLongitude ?? null;

if (
  driver &&
  locationLatitude != null &&
  locationLongitude != null
) {
  setDriverLocation({
    driverId: driver.id,
    latitude: locationLatitude,
    longitude: locationLongitude,
  });
}
      }
      if (
  latest.status === 'completed' ||
  latest.tripStatus === 'completed'
) {
  localStorage.removeItem('activeRequestId');
  setRequest(null);
  setDriverLocation(null);
  return;
}
    }
  } catch (error) {
    console.log('REFRESH REQUEST ERROR:', error);
  }
};
    useEffect(() => {
    const user = getUser();

    if (!user) {
      window.location.href = '/login';
      return;
    }

    setCustomerName(user.name || '');
    setPhone(user.phone || '');
    fetchVehicles(user.id);

    const activeRequestId =
      localStorage.getItem('activeRequestId');

    if (activeRequestId) {
      refreshRequest(activeRequestId);
    }

    const token = localStorage.getItem('token') || '';

    const socket = io(BACKEND_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

   socket.on('towRequestUpdated', (updatedRequest) => {
  const activeRequestId =
    localStorage.getItem('activeRequestId');

  if (
    activeRequestId &&
    updatedRequest.id === activeRequestId
  ) {
    refreshRequest(activeRequestId);
  }
});

   
    socket.on('driverLocationUpdated', (location) => {
  console.log('CUSTOMER DRIVER LOCATION:', location);

  setRequest((current: any) => {
    if (!current?.assignedDriverId) {
      return current;
    }

   const liveGpsTripStatuses = [
  'en_route',
  'arrived',
  'in_service',
];

if (
  location.driverId === current.assignedDriverId &&
  liveGpsTripStatuses.includes(current.tripStatus)
) {
  setDriverLocation(location);
}

    return current;
  });
});
   

    return () => {
      socket.disconnect();
    };
  }, []);

 
  useEffect(() => {
  const activeRequestId =
    request?.id || localStorage.getItem('activeRequestId');

  if (!activeRequestId) return;

  const interval = setInterval(() => {
    refreshRequest(activeRequestId);
  }, 3000);

  return () => clearInterval(interval);
}, [request?.id]);


  const createRequest = async () => {
    setLoading(true);

    const user = getUser();

    const selectedVehicle = vehicles.find(
      (vehicle) => vehicle.id === selectedVehicleId,
    );

try {
  let destinationCoords = null;

  let photoUrls: string[] = [];

  if (vehiclePhotos.length > 0) {
    const formData = new FormData();

    vehiclePhotos.forEach((photo) => {
      formData.append('photos', photo);
    });

    const uploadResponse = await axios.post(
      `${BACKEND_URL}/tow-requests/upload-photos`,
      formData,
    );

    photoUrls = uploadResponse.data.photoUrls;
  }

if (serviceType === 'towing') {
  destinationCoords = await geocodeDestination(destinationAddress);

  if (!destinationCoords) {
    alert('Please enter a valid towing destination.');
    return;
  }
} 
const customerLocation = await new Promise<{
  latitude: number;
  longitude: number;
}>((resolve, reject) => {
  if (!navigator.geolocation) {
    reject(new Error('Geolocation is not supported on this device.'));
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    (error) => {
      reject(error);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    },
  );
});
    
      const response = await axios.post(
        `${BACKEND_URL}/tow-requests`,
        {
          customerName,
          phone,
          latitude: customerLocation.latitude,
          longitude: customerLocation.longitude,
          serviceType,
          customerUserId: user?.id || undefined,
          vehicleMake: selectedVehicle?.make,
          vehicleModel: selectedVehicle?.model,
          vehicleYear: selectedVehicle?.year,
          vehicleColor: selectedVehicle?.color,
          vehiclePlate: selectedVehicle?.plate,
          vehicleSituation:
  serviceType === 'towing' ? vehicleSituation : undefined,
          recoverySituation: recoverySituation,
          photoUrls: photoUrls,
          destinationAddress: destinationAddress,
          destinationLatitude: destinationCoords?.latitude,
          destinationLongitude: destinationCoords?.longitude,
        },
      );

      const createdRequest = response.data;

      if (!createdRequest?.id) {
        alert('Request created, but no request ID was returned.');
        setLoading(false);
        return;
      }

      setRequest(createdRequest);

      localStorage.setItem(
        'activeRequestId',
        createdRequest.id,
      );

      window.location.href =
        `/checkout?requestId=${createdRequest.id}`;
    } catch (error: any) {
      alert(JSON.stringify(error.response?.data || error.message));
    } finally {
      setLoading(false);
    }
  };

const liveEtaMinutes = calculateEtaMinutes(
  driverLocation?.latitude,
  driverLocation?.longitude,
  request?.pickupLatitude,
  request?.pickupLongitude,
);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold">Request Roadside</h1>
            <p className="mt-3 text-zinc-400">
              Fast realtime roadside assistance.
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-xl border border-zinc-700 px-5 py-3"
          >
            Logout
          </button>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
            <div className="grid gap-4">
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Full Name"
                className="rounded-xl border border-zinc-700 bg-zinc-950 p-4"
              />

              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Phone Number"
                className="rounded-xl border border-zinc-700 bg-zinc-950 p-4"
              />

              <select
                value={serviceType}
                onChange={(event) => setServiceType(event.target.value)}
                className="rounded-xl border border-zinc-700 bg-zinc-950 p-4"
              >
                <option value="towing">🚚 Towing</option>
                <option value="mobile_tire">🛞 Mobile Tire</option>
                <option value="jump_start">🔋 Jump Start</option>
                <option value="lockout">🔓 Lockout</option>
                <option value="ev_charging">⚡ EV Charging</option>
                <option value="fleet_recovery">🏢 Fleet Recovery</option>
                <option value="heavy_duty">🚛 Heavy Duty</option>
                <option value="insurance_claim">📄 Insurance Claim</option>
              </select>

              {serviceType === 'towing' && (
  <>
    <select
      value={vehicleSituation}
      onChange={(event) => setVehicleSituation(event.target.value)}
      className="rounded-xl border border-zinc-700 bg-zinc-950 p-4"
    >
      <option value="">Where is your vehicle?</option>
      <option value="roadside">Roadside / shoulder</option>
      <option value="parking">Parking lot / driveway</option>
      <option value="ditch">In a ditch</option>
      <option value="snow_mud">Stuck in snow or mud</option>
      <option value="off_road">Off-road / field</option>
      <option value="collision">Collision / damaged vehicle</option>
      <option value="other">Other / not sure</option>
    </select>

    <select
  value={recoverySituation}
  onChange={(event) => setRecoverySituation(event.target.value)}
  className="rounded-xl border border-zinc-700 bg-zinc-950 p-4"
>
  <option value="">Does the vehicle need recovery/winching?</option>
  <option value="normal_tow">Normal tow / no recovery</option>
  <option value="may_need_winching">Stuck — may require winching</option>
  <option value="difficult_recovery">Deep ditch / difficult recovery</option>
  <option value="major_recovery">Rolled over / major recovery</option>
  <option value="not_sure">Not sure</option>
</select>

<div style={{ marginTop: 12 }}>
  <label>
    <strong>Add photos of the vehicle and surrounding area</strong>
  </label>

  <p style={{ margin: '4px 0 8px' }}>
    Photos help the towing company determine what equipment may be required.
  </p>

<label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-zinc-600 bg-zinc-800 px-5 py-3 font-semibold text-white hover:bg-zinc-700">
  📷 Take Photo
  <input
    type="file"
    accept="image/*"
    capture="environment"
    style={{ display: 'none' }}
    onChange={(e) => {
      const photo = e.target.files?.[0];

      if (photo) {
        setVehiclePhotos((current) =>
          [...current, photo].slice(0, 3)
        );
      }

      e.target.value = '';
    }}
  />
</label>
  <input
    type="file"
    accept="image/*"
    multiple
    onChange={(e) => {
      const files = Array.from(e.target.files || []).slice(0, 3);
      setVehiclePhotos(files);
    }}
  />

  {vehiclePhotos.length > 0 && (
    <p>{vehiclePhotos.length} photo(s) selected — maximum 3</p>
  )}
</div>

    <input
      type="text"
      value={destinationAddress}
      onChange={(event) => setDestinationAddress(event.target.value)}
      placeholder="Where are we towing your vehicle?"
      className="rounded-xl border border-zinc-700 bg-zinc-950 p-4"
    />
  </>
)}
              <select
                value={selectedVehicleId}
                onChange={(event) => setSelectedVehicleId(event.target.value)}
                className="rounded-xl border border-zinc-700 bg-zinc-950 p-4"
              >
                <option value="">Select Vehicle</option>

                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </option>
                ))}
              </select>

              <button
                onClick={createRequest}
                disabled={loading}
                className="rounded-xl bg-white p-4 font-semibold text-black"
              >
                {loading ? 'Creating Request...' : 'Create Request'}
              </button>
            </div>

            {request && (
              <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                <p className="text-xl font-bold">Request Active</p>

                <p className="mt-3 text-zinc-400">
                  Status: {request.status || 'pending'}
                </p>
		
		<p className="text-zinc-400">
 		 Amount: $
 		 {request.estimatedPrice ?? '75.00'}
		</p>

		<p className="text-zinc-400">
   		   Service: {request.serviceType || 'towing'}
		</p>

                <p className="text-zinc-400">
                  Trip: {request.tripStatus || 'waiting'}
                </p>

                <p className="text-zinc-400">
                  Payment: {request.paymentStatus || 'unpaid'}
                </p>

		<p className="text-zinc-400">
  		Driver:{' '}
 		 {request.assignedDriverId
   		 ? driverNames[request.assignedDriverId] ||
     		 request.assignedDriverId
   		 : 'Waiting'}
		</p>

                <p className="text-zinc-400">
                 Live ETA:{' '}
                 {liveEtaMinutes ? `${liveEtaMinutes} mins` : 'Calculating...'}
                </p>

                <p className="text-zinc-400">
                  Vehicle:{' '}
                  {request.vehicleYear || ''} {request.vehicleMake || ''}{' '}
                  {request.vehicleModel || ''}
                </p>
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-3xl border border-zinc-800">
            {request ? (
              <CustomerMap
                pickupLatitude={request.pickupLatitude}
                pickupLongitude={request.pickupLongitude}
                driverLatitude={driverLocation?.latitude}
                driverLongitude={driverLocation?.longitude}
              />
            ) : (
              <div className="flex h-[500px] items-center justify-center bg-zinc-900 text-zinc-500">
                Waiting for request...
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
