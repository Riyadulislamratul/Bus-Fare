
import { useMemo, useState } from "react";
import {
  ArrowDownUp,
  ArrowRight,
  Bus,
  CircleAlert,
  MapPin,
  Search,
} from "lucide-react";

import {
  busRoutes,
  findDirectBuses,
  getAllStops,
} from "../data/busRoutes";

const statusLabels = {
  verified: "Verified",
  unverified: "Needs verification",
  needs_review: "Needs review",
};

export default function BusRouteFinder() {
  const stops = useMemo(() => getAllStops(), []);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [searched, setSearched] = useState(false);

  const results = useMemo(() => {
    if (!searched) return [];

    return findDirectBuses(origin, destination);
  }, [origin, destination, searched]);

  function swapStops() {
    setOrigin(destination);
    setDestination(origin);
    setSearched(false);
  }

  function handleSearch(event) {
    event.preventDefault();
    setSearched(true);
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <Bus size={23} />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Bus route finder
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Find buses that serve both stops in the correct travel order.
          </p>
        </div>
      </div>

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
              onChange={(event) => {
                setOrigin(event.target.value);
                setSearched(false);
              }}
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
              onChange={(event) => {
                setDestination(event.target.value);
                setSearched(false);
              }}
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
          disabled={!origin || !destination || origin === destination}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Search size={18} />
          Find buses
        </button>
      </form>

      <div className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm leading-5 text-amber-900">
        <CircleAlert size={18} className="mt-0.5 shrink-0" />
        <p>
          The current dataset is a starter sample, not nationwide coverage.
          Route records still require verification. No result does not
          necessarily mean no bus operates between these locations.
        </p>
      </div>

      {searched && (
        <div className="mt-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-slate-900">
              Search results
            </h3>
            <span className="text-sm text-slate-500">
              {results.length} direct route{results.length === 1 ? "" : "s"} found
            </span>
          </div>

          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-8 text-center">
              <Bus className="mx-auto mb-3 text-slate-400" size={30} />
              <p className="font-semibold text-slate-800">
                No matching direct route in this dataset
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                More routes need to be added. Try another stop, or check
                whether a connecting journey is available.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((route) => (
                <article
                  key={route.id}
                  className="rounded-2xl border border-slate-200 p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-slate-900">
                        {route.operator}
                      </h4>
                      <p className="mt-1 text-sm text-slate-500">
                        {route.routeName}
                      </p>
                    </div>

                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                      {statusLabels[route.verificationStatus] ??
                        "Needs review"}
                    </span>
                  </div>

                  <div className="my-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Board at</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {route.boardingStop}
                      </p>
                    </div>

                    <ArrowRight className="text-emerald-600" size={20} />

                    <div className="text-right">
                      <p className="text-xs text-slate-500">Get off at</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {route.dropoffStop}
                      </p>
                    </div>
                  </div>

                  <details className="rounded-xl bg-slate-50 p-3">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                      Show {route.stopsBetween.length} stops on this segment
                    </summary>

                    <ol className="mt-3 space-y-2 pl-5 text-sm text-slate-600">
                      {route.stopsBetween.map((stop, index) => (
                        <li key={`${route.id}-${stop}-${index}`}>
                          {stop}
                        </li>
                      ))}
                    </ol>
                  </details>

                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    {route.notes}
                  </p>

                  <a
                    href={route.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-sm font-semibold text-emerald-700 underline underline-offset-4"
                  >
                    View route source
                  </a>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="mt-6 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-400">
        Route matching currently uses exact stop names and direct routes
        only. Fare, schedule, live availability, and transfer support are
        not confirmed by this component.
      </p>
    </section>
  );
}
