
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  ArrowRight,
  Bus,
  CircleAlert,
  Clock,
  MapPin,
  Route,
  Search,
  Wallet,
} from "lucide-react";

import {
  findDirectBuses,
  getAllStops,
} from "../data/busRoutes";

import {
  calculateRouteSegmentDistance,
} from "../utils/routeDistance";

// Prototype estimates only. Verify applicable government fare rules
// and operator-specific ticket prices before presenting them as official.
const FARE_RULES = {
  city: {
    label: "City bus",
    rate: 2.7,
    minimumFare: 10,
  },
  minibus: {
    label: "Minibus / DTCA",
    rate: 2.6,
    minimumFare: 8,
  },
  intercity: {
    label: "Inter-district / long-distance",
    rate: 2.4,
    minimumFare: 0,
  },
};

const STATUS_LABELS = {
  verified: "Verified route",
  unverified: "Needs verification",
  needs_review: "Needs review",
};

function formatTaka(amount) {
  if (!Number.isFinite(amount)) return "Unavailable";

  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace("BDT", "৳");
}

function estimateFare(distanceKm, serviceType) {
  const rule = FARE_RULES[serviceType];

  if (
    !rule ||
    !Number.isFinite(distanceKm) ||
    distanceKm <= 0
  ) {
    return null;
  }

  return Math.max(
    distanceKm * rule.rate,
    rule.minimumFare
  );
}

function getFareRule(serviceType) {
  return FARE_RULES[serviceType] ?? null;
}

function formatDuration(minutes) {
  if (!Number.isFinite(minutes) || minutes < 0) {
    return "Unavailable";
  }

  const totalMinutes = Math.round(minutes);
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (hours === 0) return `${remainingMinutes} min`;

  return remainingMinutes
    ? `${hours} hr ${remainingMinutes} min`
    : `${hours} hr`;
}

function ResultMetric({ icon: Icon, label, value, note }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <Icon size={20} className="mb-3 text-emerald-600" />

      <p className="text-xs text-slate-500">{label}</p>

      <p className="mt-1 break-words text-xl font-bold text-slate-900">
        {value}
      </p>

      {note && (
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {note}
        </p>
      )}
    </div>
  );
}

export default function BusRouteFinder() {
  const stops = useMemo(() => getAllStops(), []);

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [searched, setSearched] = useState(false);

  const [routeDistances, setRouteDistances] = useState({});
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [distanceError, setDistanceError] = useState("");

  const results = useMemo(() => {
    if (!searched) return [];

    return findDirectBuses(origin, destination);
  }, [origin, destination, searched]);

  // Calculate the road distance along each matching route's listed
  // intermediate stops, rather than using one generic journey distance.
  useEffect(() => {
    if (!searched || results.length === 0) {
      setLoadingRoutes(false);
      setRouteDistances({});
      setDistanceError("");
      return undefined;
    }

    const controller = new AbortController();

    async function calculateDistances() {
      setLoadingRoutes(true);
      setRouteDistances({});
      setDistanceError("");

      const distances = {};
      const errors = [];

      // Sequential requests reduce load on public geocoding services.
      for (const busRoute of results) {
        if (controller.signal.aborted) return;

        try {
          const result = await calculateRouteSegmentDistance(
            busRoute.stopsBetween,
            controller.signal
          );

          distances[busRoute.id] = {
            distanceKm: result.distanceKm,
            durationMinutes: result.durationMinutes,
            waypointCount: result.waypointCount,
            coordinates: result.coordinates,
          };

          setRouteDistances({ ...distances });
        } catch (error) {
          if (error.name === "AbortError") return;

          distances[busRoute.id] = {
            error:
              error.message ||
              "Could not calculate this bus route's road distance.",
          };

          setRouteDistances({ ...distances });

          errors.push(busRoute.operator);
        }
      }

      if (!controller.signal.aborted && errors.length > 0) {
        setDistanceError(
          "Some route distances could not be calculated. " +
            "Check the affected cards below or try again later."
        );
      }

      if (!controller.signal.aborted) {
        setLoadingRoutes(false);
      }
    }

    calculateDistances();

    return () => controller.abort();
  }, [searched, origin, destination, results]);

  function handleSearch(event) {
    event.preventDefault();

    if (
      !origin ||
      !destination ||
      origin === destination
    ) {
      return;
    }

    setSearched(true);
  }

  function changeStop(setter, value) {
    setter(value);
    setSearched(false);
    setRouteDistances({});
    setDistanceError("");
  }

  function swapStops() {
    setOrigin(destination);
    setDestination(origin);
    setSearched(false);
    setRouteDistances({});
    setDistanceError("");
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      {/* Header */}
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <Bus size={23} />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Bus route finder
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Find direct buses, route distance and estimated fares.
          </p>
        </div>
      </div>

      {/* Stop selection */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-end">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <MapPin size={16} className="text-emerald-600" />
              Starting stop
            </span>

            <select
              required
              value={origin}
              onChange={(event) =>
                changeStop(setOrigin, event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="">Select starting stop</option>

              {stops.map((stop) => (
                <option key={stop} value={stop}>
                  {stop}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={swapStops}
            aria-label="Swap starting stop and destination"
            title="Swap stops"
            className="flex h-11 w-11 items-center justify-center justify-self-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100"
          >
            <ArrowDownUp size={18} />
          </button>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <MapPin size={16} className="text-rose-500" />
              Destination
            </span>

            <select
              required
              value={destination}
              onChange={(event) =>
                changeStop(setDestination, event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="">Select destination</option>

              {stops.map((stop) => (
                <option key={stop} value={stop}>
                  {stop}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="submit"
          disabled={
            !origin ||
            !destination ||
            origin === destination ||
            loadingRoutes
          }
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Search size={18} />
          Find buses and fares
        </button>
      </form>

      {/* Data disclaimer */}
      <div className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm leading-5 text-amber-900">
        <CircleAlert size={18} className="mt-0.5 shrink-0" />

        <p>
          The route dataset is still being expanded and verified.
          Road distances and fares are estimates, not confirmed ticket
          prices. Geocoded stop names may resolve to approximate locations.
        </p>
      </div>

      {/* Search results */}
      {searched && (
        <div className="mt-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-slate-900">
              Search results
            </h3>

            <span className="text-sm text-slate-500">
              {results.length} matching route
              {results.length === 1 ? "" : "s"}
            </span>
          </div>

          {loadingRoutes && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />

              Calculating distance along each matching route...
            </div>
          )}

          {distanceError && (
            <div className="mb-5 flex items-start gap-2 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">
              <CircleAlert size={18} className="mt-0.5 shrink-0" />
              <p>{distanceError}</p>
            </div>
          )}

          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-8 text-center">
              <Bus
                className="mx-auto mb-3 text-slate-400"
                size={30}
              />

              <p className="font-semibold text-slate-800">
                No matching direct bus in the current dataset
              </p>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                This doesn't mean no bus operates between these stops.
                More routes, stop aliases and transfer options need to be
                added to the dataset.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((busRoute) => {
                const distance = routeDistances[busRoute.id];
                const rule = getFareRule(busRoute.serviceType);

                const fare =
                  distance &&
                  !distance.error &&
                  rule
                    ? estimateFare(
                        distance.distanceKm,
                        busRoute.serviceType
                      )
                    : null;

                return (
                  <article
                    key={busRoute.id}
                    className="rounded-2xl border border-slate-200 p-4 sm:p-5"
                  >
                    {/* Operator details */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-slate-900">
                          {busRoute.operator}
                        </h4>

                        <p className="mt-1 text-sm text-slate-500">
                          {busRoute.routeName}
                        </p>

                        {busRoute.region && (
                          <p className="mt-1 text-xs text-slate-400">
                            {busRoute.region}
                          </p>
                        )}
                      </div>

                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                        {STATUS_LABELS[
                          busRoute.verificationStatus
                        ] ?? "Needs review"}
                      </span>
                    </div>

                    {/* Boarding and drop-off */}
                    <div className="my-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <div>
                        <p className="text-xs text-slate-500">
                          Board at
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                          {busRoute.boardingStop}
                        </p>
                      </div>

                      <ArrowRight
                        className="text-emerald-600"
                        size={20}
                      />

                      <div className="text-right">
                        <p className="text-xs text-slate-500">
                          Get off at
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                          {busRoute.dropoffStop}
                        </p>
                      </div>
                    </div>

                    {/* Distance and fare */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <ResultMetric
                        icon={Route}
                        label="Estimated road distance"
                        value={
                          distance?.error
                            ? "Unavailable"
                            : distance
                              ? `${distance.distanceKm.toFixed(1)} km`
                              : "Calculating..."
                        }
                        note={
                          distance?.waypointCount
                            ? `Calculated through ${distance.waypointCount} listed stops`
                            : "Based on the route's listed stops"
                        }
                      />

                      <ResultMetric
                        icon={Clock}
                        label="Estimated driving time"
                        value={
                          distance?.error
                            ? "Unavailable"
                            : distance
                              ? formatDuration(distance.durationMinutes)
                              : "Calculating..."
                        }
                        note="Road-routing estimate, not a bus timetable"
                      />

                      <div className="rounded-xl bg-emerald-50 p-4 sm:col-span-2">
                        <div className="flex items-start gap-3">
                          <Wallet
                            size={21}
                            className="mt-0.5 shrink-0 text-emerald-700"
                          />

                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-emerald-800">
                              Estimated fare per passenger
                            </p>

                            <p className="mt-1 text-2xl font-bold text-emerald-900">
                              {fare === null
                                ? "Unavailable"
                                : formatTaka(fare)}
                            </p>

                            <p className="mt-1 text-xs leading-5 text-emerald-800">
                              {distance?.error
                                ? "Distance calculation failed. No fare estimate is shown."
                                : !distance
                                  ? "Waiting for route distance."
                                  : !rule
                                    ? "No fare rate is configured for this service type."
                                    : `${distance.distanceKm.toFixed(1)} km × ৳${rule.rate.toFixed(2)}/km (${rule.label} prototype rate).`}
                            </p>

                            {fare !== null && rule && (
                              <p className="mt-1 text-xs leading-5 text-emerald-800">
                                Minimum fare rule used:{" "}
                                {formatTaka(rule.minimumFare)}.
                                This estimate is not an official ticket quote.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ordered stops */}
                    <details className="mt-4 rounded-xl bg-slate-50 p-3">
                      <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                        Show {busRoute.stopsBetween.length} stops on this
                        segment
                      </summary>

                      <ol className="mt-3 space-y-2 pl-5 text-sm text-slate-600">
                        {busRoute.stopsBetween.map((stop, index) => (
                          <li key={`${busRoute.id}-${stop}-${index}`}>
                            {stop}
                          </li>
                        ))}
                      </ol>
                    </details>

                    {busRoute.notes && (
                      <p className="mt-3 text-xs leading-5 text-slate-500">
                        {busRoute.notes}
                      </p>
                    )}

                    {busRoute.sourceUrl && (
                      <a
                        href={busRoute.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-block text-sm font-semibold text-emerald-700 underline underline-offset-4"
                      >
                        View route source
                      </a>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      <p className="mt-6 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-400">
        Distances follow roads selected by OSRM through geocoded stop names;
        they may differ from the actual bus route. Public routing and
        geocoding services have usage limits. Fare rates are configurable
        prototype assumptions and must be checked against current official
        rules and operator prices.
      </p>
    </section>
  );
}
