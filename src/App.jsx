
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
  ArrowUpDown,
  Sparkles,
  CheckCircle2,
  History,
  Trash2,
  ArrowUpRight,
  BookmarkCheck,
} from "lucide-react";

import MapView from "./components/MapView";
import LocationSearch from "./components/LocationSearch";
import FareSummary from "./components/FareSummary";
import { fareRates, calculateFare, formatTaka } from "./data/fareRates";

const HISTORY_KEY = "bus-fare-bd-journey-history";
const MAX_HISTORY = 10;

function loadJourneyHistory() {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

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

  const [journeyHistory, setJourneyHistory] = useState(loadJourneyHistory);
  const [historyMessage, setHistoryMessage] = useState("");

  // Calculate the road route.
  useEffect(() => {
    if (!origin || !destination) {
      setRouteCoordinates([]);
      setDistanceKm(null);
      setDurationMinutes(null);
      setRouteStatus("idle");
      setRouteError("");
      return;
    }

    const sameLocation =
      origin.coordinates[0] === destination.coordinates[0] &&
      origin.coordinates[1] === destination.coordinates[1];

    if (sameLocation) {
      setRouteCoordinates([]);
      setDistanceKm(null);
      setDurationMinutes(null);
      setRouteStatus("error");
      setRouteError("Choose two different locations to calculate a route.");
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
        const [destinationLat, destinationLng] = destination.coordinates;

        const url =
          "https://router.project-osrm.org/route/v1/driving/" +
          `${originLng},${originLat};${destinationLng},${destinationLat}` +
          "?overview=full&geometries=geojson";

        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
          throw new Error("The routing service is unavailable. Please try again.");
        }

        const data = await response.json();

        if (data.code !== "Ok" || !data.routes?.length) {
          throw new Error("No road route was found for these locations.");
        }

        const route = data.routes[0];
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
        setRouteError(error.message || "Unable to calculate the route.");
      }
    }

    fetchRoute();
    return () => controller.abort();
  }, [origin, destination]);

  // Save successfully calculated journeys.
  useEffect(() => {
    if (
      routeStatus !== "success" ||
      !origin ||
      !destination ||
      !Number.isFinite(distanceKm) ||
      distanceKm <= 0
    ) {
      return;
    }

    const bus = fareRates.find((item) => item.id === selectedCategory);
    if (!bus) return;

    const journeyId = [
      origin.coordinates.join(","),
      destination.coordinates.join(","),
    ].join("|");

    const currentJourney = {
      id: journeyId,
      origin,
      destination,
      distanceKm,
      durationMinutes,
      selectedCategory,
      fare: calculateFare(distanceKm, bus.currentRate),
      savedAt: new Date().toISOString(),
    };

    setJourneyHistory((previous) => {
      const updated = [
        currentJourney,
        ...previous.filter((journey) => journey.id !== journeyId),
      ].slice(0, MAX_HISTORY);

      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch {
        // Continue working if browser storage is unavailable.
      }

      return updated;
    });
  }, [
    routeStatus,
    origin,
    destination,
    distanceKm,
    durationMinutes,
    selectedCategory,
  ]);

  function handleMapClick(coordinates) {
    const point = {
      name: "Map-selected point",
      coordinates,
    };

    if (!origin || destination) {
      setOrigin(point);
      setDestination(null);
    } else {
      setDestination(point);
    }

    setFocusPoint(coordinates);
    setHistoryMessage("");
  }

  function handleSearchSelection(type, location) {
    if (type === "origin") setOrigin(location);
    else setDestination(location);

    setFocusPoint(location.coordinates);
    setHistoryMessage("");
  }

  function swapLocations() {
    if (!origin || !destination) return;

    setOrigin(destination);
    setDestination(origin);
    setFocusPoint(destination.coordinates);
    setHistoryMessage("");
  }

  function resetLocations() {
    setOrigin(null);
    setDestination(null);
    setFocusPoint(null);
    setHistoryMessage("");
  }

  function restoreJourney(journey) {
    setOrigin(journey.origin);
    setDestination(journey.destination);
    setFocusPoint(journey.origin.coordinates);

    if (journey.selectedCategory) {
      setSelectedCategory(journey.selectedCategory);
    }

    setHistoryMessage("Journey restored. Recalculating the latest route.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearHistory() {
    setJourneyHistory([]);

    try {
      localStorage.removeItem(HISTORY_KEY);
      setHistoryMessage("Journey history cleared.");
    } catch {
      setHistoryMessage("History cleared for this session.");
    }
  }

  function formatCoordinates(location) {
    if (!location) return "Waiting for selection";

    const [lat, lng] = location.coordinates;
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }

  function formatDate(value) {
    const date = new Date(value);

    if (!value || Number.isNaN(date.getTime())) return "Previously saved";

    return date.toLocaleString("en-BD", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const journeyReady = Boolean(origin && destination);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
              <Bus size={24} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">
                Bus Fare <span className="text-emerald-600">BD</span>
              </h1>
              <p className="text-xs text-slate-500">
                Smarter journeys across Bangladesh
              </p>
            </div>
          </div>

          <span className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 sm:inline-flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Route planner
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="mb-7">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-sm font-semibold text-emerald-700 shadow-sm">
            <Sparkles size={15} />
            Your journey, made simpler
          </div>

          <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Know your route.
            <br />
            <span className="text-emerald-600">Plan your fare.</span>
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Choose your starting point and destination to explore the road
            route, estimated distance, travel time, and bus fare.
          </p>
        </section>

        {/* Journey progress */}
        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              title: "Starting point",
              value: origin ? "Selected" : "Not selected",
              icon: MapPin,
              style: "bg-emerald-50 text-emerald-700",
            },
            {
              title: "Destination",
              value: destination ? "Selected" : "Not selected",
              icon: Navigation,
              style: "bg-blue-50 text-blue-700",
            },
            {
              title: "Road route",
              value:
                routeStatus === "success"
                  ? "Calculated"
                  : routeStatus === "loading"
                    ? "Calculating..."
                    : routeStatus === "error"
                      ? "Unavailable"
                      : "Awaiting locations",
              icon: Route,
              style: "bg-violet-50 text-violet-700",
            },
          ].map(({ title, value, icon: Icon, style }) => (
            <div
              key={title}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${style}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{value}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Search controls: full-width row */}
        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Navigation size={20} className="text-emerald-600" />
            <div>
              <h3 className="font-bold tracking-tight">Plan your journey</h3>
              <p className="text-sm text-slate-500">
                Search for your origin and destination.
              </p>
            </div>
          </div>

          <LocationSearch onSelectLocation={handleSearchSelection} />
        </section>

        {/* Full-width map */}
        <section className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <MapPinned size={20} />
              </div>
              <div>
                <h3 className="font-bold tracking-tight">Explore the map</h3>
                <p className="text-sm text-slate-500">
                  Click once for your origin, then again for your destination.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={resetLocations}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <RotateCcw size={15} />
              Reset
            </button>
          </div>

          <div className="px-3 sm:px-5">
            <MapView
              origin={origin}
              destination={destination}
              focusPoint={focusPoint}
              routeCoordinates={routeCoordinates}
              onMapClick={handleMapClick}
            />
          </div>

          <div className="flex items-start gap-2 px-5 py-4 text-xs leading-5 text-slate-500">
            <MousePointer2 size={16} className="mt-0.5 shrink-0" />
            Map data © OpenStreetMap contributors.
          </div>
        </section>

        {/* Balanced results dashboard */}
        <section className="grid items-start gap-6 lg:grid-cols-2">
          {/* Journey details */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold tracking-tight">Your journey</h3>
                <p className="mt-1 text-sm text-slate-500">Selected locations</p>
              </div>
              <Route size={21} className="text-slate-500" />
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  From
                </p>
                <p className="mt-2 break-words text-sm font-semibold leading-6">
                  {origin?.name ?? "Not selected"}
                </p>
                <p className="mt-1 break-words text-xs text-slate-500">
                  {formatCoordinates(origin)}
                </p>
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={swapLocations}
                  disabled={!journeyReady}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowUpDown size={16} />
                  Swap locations
                </button>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-800">
                  To
                </p>
                <p className="mt-2 break-words text-sm font-semibold leading-6">
                  {destination?.name ?? "Not selected"}
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
          </div>

          {/* Route overview */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <Navigation size={20} className="text-emerald-600" />
              <h3 className="text-lg font-bold tracking-tight">Route overview</h3>
            </div>

            {routeStatus === "idle" && (
              <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                Select two locations to calculate road distance and estimated
                driving time.
              </p>
            )}

            {routeStatus === "loading" && (
              <div role="status" className="mt-4 flex items-center gap-3 rounded-2xl bg-emerald-50 p-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                <p className="text-sm font-medium text-emerald-800">
                  Calculating your road route...
                </p>
              </div>
            )}

            {routeStatus === "error" && (
              <div role="alert" className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-700">
                  Could not calculate route
                </p>
                <p className="mt-1 text-sm leading-6 text-red-600">{routeError}</p>
              </div>
            )}

            {routeStatus === "success" && (
              <>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-emerald-50 p-4">
                    <p className="text-sm font-medium text-emerald-800">
                      Road distance
                    </p>
                    <p className="mt-2 text-3xl font-extrabold tracking-tight">
                      {distanceKm.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500">kilometres</p>
                  </div>

                  <div className="rounded-2xl bg-blue-50 p-4">
                    <p className="text-sm font-medium text-blue-800">
                      Driving time
                    </p>
                    <p className="mt-2 text-3xl font-extrabold tracking-tight">
                      {Math.round(durationMinutes)}
                    </p>
                    <p className="text-xs text-slate-500">minutes</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700">
                  <CheckCircle2 size={17} />
                  Route calculated successfully
                </div>
              </>
            )}

            <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-200 p-3">
              <Clock3 size={16} className="mt-0.5 shrink-0 text-slate-400" />
              <p className="text-xs leading-5 text-slate-500">
                Driving time is an estimate, not a bus timetable. Actual bus
                routes and journey times may differ.
              </p>
            </div>
          </div>

          {/* Fare calculator spans full width */}
          <div className="lg:col-span-2">
            <FareSummary
              distanceKm={routeStatus === "success" ? distanceKm : null}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </div>
        </section>

        {/* Journey history */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                <History size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight">Recent journeys</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Your last {MAX_HISTORY} calculated journeys on this device
                </p>
              </div>
            </div>

            {journeyHistory.length > 0 && (
              <button
                type="button"
                onClick={clearHistory}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 size={15} />
                Clear history
              </button>
            )}
          </div>

          <div className="p-5 sm:p-6">
            {historyMessage && (
              <p role="status" className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {historyMessage}
              </p>
            )}

            {journeyHistory.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-10 text-center">
                <BookmarkCheck size={25} className="mx-auto text-slate-400" />
                <h4 className="mt-3 font-bold text-slate-800">
                  No journeys saved yet
                </h4>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Calculate a route and it will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {journeyHistory.map((journey) => {
                  const bus = fareRates.find(
                    (item) => item.id === journey.selectedCategory
                  );

                  return (
                    <article
                      key={journey.id}
                      className="rounded-2xl border border-slate-200 p-4 transition hover:border-emerald-200 hover:shadow-sm"
                    >
                      <p className="text-xs text-slate-400">
                        {formatDate(journey.savedAt)}
                      </p>

                      <div className="mt-3 flex items-start gap-2">
                        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-600" />
                        <p className="break-words text-sm font-semibold leading-5">
                          {journey.origin?.name ?? "Origin"}
                        </p>
                      </div>

                      <div className="ml-1 mt-1.5 border-l border-dashed border-slate-300 pl-4">
                        <ArrowRight size={14} className="text-slate-400" />
                      </div>

                      <div className="mt-1 flex items-start gap-2">
                        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
                        <p className="break-words text-sm font-semibold leading-5">
                          {journey.destination?.name ?? "Destination"}
                        </p>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                        <div>
                          <p className="text-xs text-slate-500">Distance</p>
                          <p className="mt-1 text-sm font-bold">
                            {Number(journey.distanceKm).toFixed(2)} km
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Fare estimate</p>
                          <p className="mt-1 text-sm font-bold text-emerald-700">
                            {formatTaka(journey.fare)}
                          </p>
                        </div>
                      </div>

                      <p className="mt-2 text-xs text-slate-500">
                        Category: {bus?.shortName ?? "Bus"}
                      </p>

                      <button
                        type="button"
                        onClick={() => restoreJourney(journey)}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                      >
                        Use journey
                        <ArrowUpRight size={16} />
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <footer className="mt-8 border-t border-slate-200 py-5">
          <p className="text-center text-xs leading-6 text-slate-500">
            Bus Fare BD · A route and fare estimation project for Bangladesh
          </p>
        </footer>
      </div>
    </main>
  );
}
