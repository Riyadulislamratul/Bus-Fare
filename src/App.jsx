
import { useState } from "react";
import {
  MapPin,
  Navigation,
  RotateCcw,
  Bus,
  MousePointer2,
} from "lucide-react";

import MapView from "./components/MapView";

export default function App() {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);

  function handleMapClick(coordinates) {
    if (!origin || (origin && destination)) {
      setOrigin(coordinates);
      setDestination(null);
    } else {
      setDestination(coordinates);
    }
  }

  function resetLocations() {
    setOrigin(null);
    setDestination(null);
  }

  function formatCoordinates(coordinates) {
    if (!coordinates) return "Not selected";

    return `${coordinates[0].toFixed(5)}, ${coordinates[1].toFixed(5)}`;
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
            Select your starting point and destination on the map.
            We'll add route distance and estimated bus fare next.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3 px-2 pt-2">
              <div>
                <h3 className="font-semibold">Choose your locations</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Click two points on the map.
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
              onMapClick={handleMapClick}
            />

            <p className="px-2 pb-1 pt-3 text-xs leading-5 text-slate-500">
              Map data © OpenStreetMap contributors. Location selection
              is a prototype and does not yet calculate a road route.
            </p>
          </section>

          <section className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
                    {formatCoordinates(origin)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {origin ? "Location selected" : "Click the map to select"}
                  </p>
                </div>

                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-sm font-medium text-blue-800">
                    Destination
                  </p>
                  <p className="mt-2 break-words text-sm text-slate-700">
                    {formatCoordinates(destination)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {destination
                      ? "Location selected"
                      : "Click the map a second time"}
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
                    ? "Step 1: Select your starting point."
                    : !destination
                      ? "Step 2: Select your destination."
                      : "Both locations are selected. You're ready for the next step!"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900 p-5 text-white">
              <p className="text-sm text-slate-300">Estimated journey fare</p>
              <p className="mt-2 text-3xl font-bold">৳ --</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Your fare will appear here after we implement road routing
                and the fare calculation rules.
              </p>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
