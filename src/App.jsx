
import { useState } from "react";
import {
  MapPin,
  Navigation,
  RotateCcw,
  Bus,
  MousePointer2,
} from "lucide-react";

import MapView from "./components/MapView";
import LocationSearch from "./components/LocationSearch";

export default function App() {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [focusPoint, setFocusPoint] = useState(null);

  function handleMapClick(coordinates) {
    const selectedPoint = {
      name: "Map-selected point",
      coordinates,
    };

    if (!origin || (origin && destination)) {
      setOrigin(selectedPoint);
      setDestination(null);
    } else {
      setDestination(selectedPoint);
    }

    setFocusPoint(coordinates);
  }

  function handleSearchSelection(type, location) {
    if (type === "origin") {
      setOrigin(location);
    } else {
      setDestination(location);
    }

    setFocusPoint(location.coordinates);
  }

  function resetLocations() {
    setOrigin(null);
    setDestination(null);
    setFocusPoint(null);
  }

  function formatCoordinates(location) {
    if (!location) return "Not selected";

    const [lat, lng] = location.coordinates;
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }

  function displayName(location) {
    if (!location) return "Not selected";
    return location.name;
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <Bus size={25} />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Bus Fare <span className="text-emerald-600">BD</span>
            </h1>
            <p className="text-sm text-slate-500">
              Plan your route. Estimate your fare.
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-7 max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
            <Navigation size={15} />
            Bangladesh Bus Fare Calculator
          </span>

          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Where are you <span className="text-emerald-600">going?</span>
          </h2>

          <p className="mt-3 leading-7 text-slate-600">
            Search for a place or select locations directly on the map.
            We'll add road distance and fare calculation next.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3 px-2 pt-2">
              <div>
                <h3 className="font-semibold">Interactive map</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Click two points to select your journey.
                </p>
              </div>

              <button
                onClick={resetLocations}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50"
              >
                <RotateCcw size={15} />
                Reset
              </button>
            </div>

            <MapView
              origin={origin}
              destination={destination}
              focusPoint={focusPoint}
              onMapClick={handleMapClick}
            />

            <p className="px-2 pb-1 pt-3 text-xs leading-5 text-slate-500">
              Map data © OpenStreetMap contributors. Search results and
              map-selected points are not necessarily official bus stops.
            </p>
          </section>

          <div className="space-y-4">
            <LocationSearch onSelectLocation={handleSearchSelection} />

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <MapPin className="text-emerald-600" size={20} />
                <h3 className="font-semibold">Your journey</h3>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-sm font-medium text-emerald-800">
                    Starting point
                  </p>
                  <p className="mt-2 break-words text-sm text-slate-700">
                    {displayName(origin)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatCoordinates(origin)}
                  </p>
                </div>

                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-sm font-medium text-blue-800">
                    Destination
                  </p>
                  <p className="mt-2 break-words text-sm text-slate-700">
                    {displayName(destination)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatCoordinates(destination)}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                <MousePointer2
                  size={19}
                  className="mt-0.5 shrink-0 text-slate-500"
                />
                <p className="text-sm leading-6 text-slate-600">
                  {!origin
                    ? "Choose a starting point using search or the map."
                    : !destination
                      ? "Now choose your destination using search or the map."
                      : "Both locations are selected. Next, we'll calculate the road distance."}
                </p>
              </div>
            </section>

            <section className="rounded-2xl bg-slate-900 p-5 text-white">
              <p className="text-sm text-slate-300">
                Estimated journey fare
              </p>
              <p className="mt-2 text-3xl font-bold">৳ --</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Fare calculation will be added after road routing.
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
