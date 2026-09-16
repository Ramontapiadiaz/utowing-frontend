'use client';

import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
} from 'react-leaflet';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type Props = {
  drivers: Record<string, any>;
  requests: Record<string, any>;
};

const driverIcon = L.divIcon({
  html: `<div style="font-size:30px; transform:translate(-8px,-18px);">🚚</div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const customerIcon = L.divIcon({
  html: `<div style="font-size:30px; transform:translate(-8px,-18px);">📍</div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

export default function AdminMap({
  drivers,
  requests,
}: Props) {
  const driverList = Object.values(drivers);
  const requestList = Object.values(requests);

  return (
    <MapContainer
      center={[50.5897, -111.9233]}
      zoom={11}
      style={{
        height: '92vh',
        width: '100%',
        borderRadius: '24px',
      }}
    >
      <TileLayer
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {driverList.map((driver: any) => {
  const markerLatitude =
    driver.hasFreshLiveLocation &&
    driver.latitude != null
      ? driver.latitude
      : driver.baseLatitude;

  const markerLongitude =
    driver.hasFreshLiveLocation &&
    driver.longitude != null
      ? driver.longitude
      : driver.baseLongitude;

  if (
    markerLatitude == null ||
    markerLongitude == null
  ) {
    return null;
  }

  return (
    <Marker
      key={driver.driverId}
      icon={driverIcon}
      position={[
        Number(markerLatitude),
        Number(markerLongitude),
      ]}
    />
  );
})}

      {requestList.map((request: any) => {
        if (!request.pickupLatitude || !request.pickupLongitude) {
          return null;
        }

        const driver = drivers[request.assignedDriverId];

        const driverLatitude =
  driver?.hasFreshLiveLocation &&
  driver?.latitude != null
    ? driver.latitude
    : driver?.baseLatitude;

const driverLongitude =
  driver?.hasFreshLiveLocation &&
  driver?.longitude != null
    ? driver.longitude
    : driver?.baseLongitude;

        return (
          <div key={request.id}>
            <Marker
              icon={customerIcon}
              position={[
                Number(request.pickupLatitude),
                Number(request.pickupLongitude),
              ]}
            />

            {driverLatitude != null &&
  driverLongitude != null && (
    <Polyline
      positions={[
        [
          Number(driverLatitude),
          Number(driverLongitude),
        ],
        [
          Number(request.pickupLatitude),
          Number(request.pickupLongitude),
        ],
      ]}
      pathOptions={{
        color: 'blue',
        weight: 5,
      }}
    />
  )}
          </div>
        );
      })}
    </MapContainer>
  );
}
