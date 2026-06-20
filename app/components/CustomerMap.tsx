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
  pickupLatitude: number;
  pickupLongitude: number;
  driverLatitude?: number;
  driverLongitude?: number;
};

const driverIcon = L.divIcon({
  html: `
    <div style="
      font-size: 32px;
      transform: translate(-8px, -18px);
    ">
      🚚
    </div>
  `,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const pickupIcon = L.divIcon({
  html: `
    <div style="
      font-size: 32px;
      transform: translate(-8px, -18px);
    ">
      📍
    </div>
  `,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

export default function CustomerMap({
  pickupLatitude,
  pickupLongitude,
  driverLatitude,
  driverLongitude,
}: Props) {
  const routePositions =
    driverLatitude &&
    driverLongitude
      ? [
          [
            driverLatitude,
            driverLongitude,
          ],

          [
            pickupLatitude,
            pickupLongitude,
          ],
        ]
      : [];

  return (
    <MapContainer
      center={[
        pickupLatitude,
        pickupLongitude,
      ]}
      zoom={13}
      style={{
        height: '500px',
        width: '100%',
        borderRadius: '24px',
      }}
    >
      <TileLayer
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker
        icon={pickupIcon}
        position={[
          pickupLatitude,
          pickupLongitude,
        ]}
      />

      {driverLatitude &&
        driverLongitude && (
          <Marker
            icon={driverIcon}
            position={[
              driverLatitude,
              driverLongitude,
            ]}
          />
        )}

      {routePositions.length >
        0 && (
        <Polyline
          positions={
            routePositions as any
          }
          pathOptions={{
            color: 'blue',
            weight: 5,
          }}
        />
      )}
    </MapContainer>
  );
}
