
import { useEffect } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(event) {
      onMapClick([
        event.latlng.lat,
        event.latlng.lng,
      ]);
    },
  });

  return null;
}

function MapFocus({ focusPoint }) {
  const map = useMap();

  useEffect(() => {
    if (focusPoint) {
      map.flyTo(focusPoint, 15, { duration: 1 });
    }
  }, [focusPoint, map]);

  return null;
}

export default function MapView({
  origin,
  destination,
  focusPoint,
  onMapClick,
}) {
  return (
    <div className="h-[420px] w-full overflow-hidden rounded-2xl">
      <MapContainer
        center={[23.8103, 90.4125]}
        zoom={12}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onMapClick={onMapClick} />
        <MapFocus focusPoint={focusPoint} />

        {origin && (
          <Marker position={origin.coordinates}>
            <Popup>Starting point: {origin.name}</Popup>
          </Marker>
        )}

        {destination && (
          <Marker position={destination.coordinates}>
            <Popup>Destination: {destination.name}</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
