
import { useEffect, useState } from "react";
import {
  Bus,
  MapPin,
  Navigation,
  RotateCcw,
  MousePointer2,
  Route,
  Clock3,
  MapPinned,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

import MapView from "./components/MapView";
import LocationSearch from "./components/LocationSearch";
import FareSummary from "./components/FareSummary";
import { fareRates } from "./data/fareRates";

export default function App() {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [focusPoint, setFocusPoint] = useState(null);

  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [distanceKm, setDistanceKm] = useState(null);
  const [durationMinutes, setDurationMinutes] = useState(null);
  const [routeStatus, setRouteStatus] = useState("idle");
  const [routeError, setRouteError] = useState("");

  const [selectedCategory, setSelectedCategory] = useState(
    fareRates[0]?.id ?? ""
  );

  // Calculate the road route whenever the selected locations change.
  useEffect(() => {
    if (!origin || !destination) {
      setRouteCoordinates([]);
      setDistanceKm(null);
      setDurationMinutes(null);
      setRouteStatus("idle");
      setRouteError("");
      return;
    }

    // Avoid requesting a route from a point to itself.
    const sameLocation =
      origin.coordinates[0] === destination.coordinates[0] &&
      origin.coordinates[1] === destination.coordinates[1];

    if (sameLocation) {
      setRouteCoordinates([]);
      setDistanceKm(null);
      setDurationMinutes(null);
      setRouteStatus("error");
      setRouteError(
        "Your starting point and destination are the same. Please choose different locations."
      );
      return;
    }

    const controller = new AbortController();

    async function fetchRoute() {
      setRouteStatus("loading");
      setRouteError("");
      setRouteCoordinates([]);
      setDistanceKm(null);
      setDurationMinutes(null);

      try {
        const [originLat, originLng] = origin.coordinates;
        const [destinationLat, destinationLng] =
          destination.coordinates;

        // OSRM expects longitude,latitude coordinate order.
        const url =
          "https://router.project-osrm.org/route/v1/driving/" +
          `${originLng},${originLat};${destinationLng},${destinationLat}` +
          "?overview=full&geometries=geojson";

        const response = await fetch(url, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            "The routing service is unavailable. Please try again."
          );
        }

        const data = await response.json();

        if (data.code !== "Ok" || !data.routes?.length) {
          throw new Error(
            "No road route was found. Try selecting different locations."
          );
        }

        const route = data.routes[0];

        // Convert GeoJSON [longitude, latitude] into Leaflet
        // [latitude, longitude] coordinates.
        const points = route.geometry.coordinates.map(
          ([longitude, latitude]) => [latitude, longitude]
        );

        setRouteCoordinates(points);
        setDistanceKm(route.distance / 1000);
        setDurationMinutes(route.duration / 60);
        setRouteStatus("success");
      } catch (error) {
        if (error.name === "AbortError") return;

        setRouteCoordinates([]);
        setDistanceKm(null);
        setDurationMinutes(null);
        setRouteStatus("error");
        setRouteError(
          error.message ||
            "Unable to calculate the route. Please try again."
        );
      }
    }

    fetchRoute();

    return () => controller.abort();
  }, [origin, destination]);

  // Handle clicks directly on the map.
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

  // Handle locations selected from search results.
  function handleSearchSelection(type, location) {
    if (type === "origin") {
      setOrigin(location);
    } else {
      setDestination(location);
    }

    setFocusPoint(location.coordinates);
  }

  // Clear the selected locations and route.
  function resetLocations() {
    setOrigin(null);
    setDestination(null);
    setFocusPoint(null);
  }

  function formatCoordinates(location) {
    if (!location) return "Waiting for selection";

    const [latitude, longitude] = location.coordinates;

    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  }

  function getLocationName(location) {
    return location?.name ?? "Not selected";
  }

  const journeyReady = Boolean(origin && destination);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
              <Bus size={24} strokeWidth={2.3} />
            </div>

            <div>
              <h1 className="text-lg font-extrabold tracking-tight sm:text-xl">
                Bus Fare <span className="text-emerald-600">BD</span>
              </h1>
              <p className="text-xs text-slate-500 sm:text-sm">
                Smarter journeys across Bangladesh
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Route planner
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Hero */}
        <section className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-sm font-semibold text-emerald-700 shadow-sm">
            <Sparkles size={15} />
            Your journey, made simpler
          </div>

          <h2 className="max-w-3xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Know your route.
            <br />
            <span className="text-emerald-600">
              Plan your fare.
            </span>
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Select your starting point and destination to explore a road
            route, check its estimated distance, and calculate an
            estimated bus fare.
          </p>
        </section>

        {/* Journey progress */}
        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <MapPin size={20} />
            </div>

            <div>
              <p className="text-sm font-semibold">Starting point</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {origin ? "Selected" : "Not selected"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Navigation size={20} />
            </div>

            <div>
              <p className="text-sm font-semibold">Destination</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {destination ? "Selected" : "Not selected"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <Route size={20} />
            </div>

            <div>
              <p className="text-sm font-semibold">Road route</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {routeStatus === "success"
                  ? "Calculated"
                  : routeStatus === "loading"
                    ? "Calculating..."
                    : routeStatus === "error"
                      ? "Unavailable"
                      : "Awaiting locations"}
              </p>
            </div>
          </div>
        </section>

        {/* Main layout */}
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.85fr)]">
          {/* Map panel */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
              <div>
                <div className="flex items-center gap-2">
                  <MapPinned
                    size={20}
                    className="text-emerald-600"
                  />
                  <h3 className="text-lg font-bold tracking-tight">
                    Explore the map
                  </h3>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Search for a place or click two points on the map.
                </p>
              </div>

              <button
                type="button"
                onClick={resetLocations}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <RotateCcw size={15} />
                Reset
              </button>
            </div>

            <div className="px-3 sm:px-4">
              <MapView
                origin={origin}
                destination={destination}
                focusPoint={focusPoint}
                routeCoordinates={routeCoordinates}
                onMapClick={handleMapClick}
              />
            </div>

            <div className="flex items-start gap-3 px-5 py-4 sm:px-6">
              <MousePointer2
                size={17}
                className="mt-0.5 shrink-0 text-slate-400"
              />

              <p className="text-xs leading-5 text-slate-500">
                Map data © OpenStreetMap contributors. Click once to
                select your starting point, then click again to select
                your destination.
              </p>
            </div>
          </section>

          {/* Right column */}
          <div className="space-y-5">
            <LocationSearch
              onSelectLocation={handleSearchSelection}
            />

            {/* Journey details */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">
                    Your journey
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Selected locations
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Route size={20} />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                      From
                    </p>
                  </div>

                  <p className="mt-2 break-words text-sm font-semibold leading-6 text-slate-800">
                    {getLocationName(origin)}
                  </p>

                  <p className="mt-1 break-words text-xs text-slate-500">
                    {formatCoordinates(origin)}
                  </p>
                </div>

                <div className="flex justify-center">
                  <ArrowRight
                    size={18}
                    className="rotate-90 text-slate-400"
                  />
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-800">
                      To
                    </p>
                  </div>

                  <p className="mt-2 break-words text-sm font-semibold leading-6 text-slate-800">
                    {getLocationName(destination)}
                  </p>

                  <p className="mt-1 break-words text-xs text-slate-500">
                    {formatCoordinates(destination)}
                  </p>
                </div>
              </div>

              {journeyReady && (
                <button
                  type="button"
                  onClick={resetLocations}
                  className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Clear journey
                </button>
              )}
            </section>

            {/* Route overview */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2">
                <Navigation
                  size={19}
                  className="text-emerald-600"
                />
                <h3 className="text-lg font-bold tracking-tight">
                  Route overview
                </h3>
              </div>

              {routeStatus === "idle" && (
                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm leading-6 text-slate-600">
                    Select both locations to see the estimated road
                    distance and driving time.
                  </p>
                </div>
              )}

              {routeStatus === "loading" && (
                <div
                  role="status"
                  className="mt-4 rounded-2xl bg-emerald-50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                    <p className="text-sm font-medium text-emerald-800">
                      Calculating your road route...
                    </p>
                  </div>
                </div>
              )}

              {routeStatus === "error" && (
                <div
                  role="alert"
                  className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4"
                >
                  <p className="text-sm font-semibold text-red-700">
                    Could not calculate route
                  </p>

                  <p className="mt-1 text-sm leading-6 text-red-600">
                    {routeError}
                  </p>
                </div>
              )}

              {routeStatus === "success" && (
                <>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-emerald-50 p-4">
                      <p className="text-xs font-semibold text-emerald-800 sm:text-sm">
                        Road distance
                      </p>

                      <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                        {distanceKm.toFixed(2)}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">km</p>
                    </div>

                    <div className="rounded-2xl bg-blue-50 p-4">
                      <p className="text-xs font-semibold text-blue-800 sm:text-sm">
                        Driving time
                      </p>

                      <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                        {Math.round(durationMinutes)}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        minutes
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700">
                    <CheckCircle2 size={17} />
                    Route calculated successfully
                  </div>
                </>
              )}

              <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-200 p-3">
                <Clock3
                  size={16}
                  className="mt-0.5 shrink-0 text-slate-400"
                />

                <p className="text-xs leading-5 text-slate-500">
                  Driving time is an estimate, not a bus timetable.
                  Actual bus routes, stops, traffic, and travel times
                  may differ.
                </p>
              </div>
            </section>

            {/* Bus fare calculator */}
            <FareSummary
              distanceKm={
                routeStatus === "success" ? distanceKm : null
              }
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-10 border-t border-slate-200 py-5">
          <p className="text-center text-xs leading-6 text-slate-500">
            Bus Fare BD · A route and fare estimation project for
            Bangladesh
          </p>
        </footer>
      </div>
    </main>
  );
}
