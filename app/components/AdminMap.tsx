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
      center={[51.0457, -114.0719]}
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
        if (!driver.latitude || !driver.longitude) {
          return null;
        }

        return (
          <Marker
            key={driver.driverId}
            icon={driverIcon}
            position={[
              Number(driver.latitude),
              Number(driver.longitude),
            ]}
          />
        );
      })}

      {requestList.map((request: any) => {
        if (!request.pickupLatitude || !request.pickupLongitude) {
          return null;
        }

        const driver = drivers[request.assignedDriverId];

        return (
          <div key={request.id}>
            <Marker
              icon={customerIcon}
              position={[
                Number(request.pickupLatitude),
                Number(request.pickupLongitude),
              ]}
            />

            {driver?.latitude && driver?.longitude && (
              <Polyline
                positions={[
                  [
                    Number(driver.latitude),
                    Number(driver.longitude),
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
