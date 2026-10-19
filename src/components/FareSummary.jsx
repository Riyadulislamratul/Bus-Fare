
import { useEffect } from "react";
import {
  Bus,
  Check,
  TrendingUp,
  Info,
  MapPin,
} from "lucide-react";
import {
  fareRates,
  calculateFare,
  formatTaka,
} from "../data/fareRates";

const LONG_DISTANCE_LIMIT_KM = 45;
const LONG_DISTANCE_CATEGORY = "intercity";

export default function FareSummary({
  distanceKm,
  selectedCategory,
  onCategoryChange,
}) {
  const canCalculate =
    Number.isFinite(distanceKm) && distanceKm > 0;

  const isLongDistance =
    canCalculate && distanceKm > LONG_DISTANCE_LIMIT_KM;

  // Only show long-distance buses when the journey exceeds 45 km.
  const availableRates = isLongDistance
    ? fareRates.filter((bus) => bus.id === LONG_DISTANCE_CATEGORY)
    : fareRates;

  // Automatically select the long-distance category for longer journeys.
  useEffect(() => {
    if (isLongDistance && selectedCategory !== LONG_DISTANCE_CATEGORY) {
      onCategoryChange(LONG_DISTANCE_CATEGORY);
    }
  }, [isLongDistance, selectedCategory, onCategoryChange]);

  const effectiveCategory = isLongDistance
    ? LONG_DISTANCE_CATEGORY
    : selectedCategory;

  const selectedBus = availableRates.find(
    (bus) => bus.id === effectiveCategory
  );

  const selectedFare =
    canCalculate && selectedBus
      ? calculateFare(distanceKm, selectedBus.currentRate)
      : null;

  const previousFare =
    canCalculate && selectedBus
      ? calculateFare(distanceKm, selectedBus.previousRate)
      : null;

  const difference =
    selectedFare !== null && previousFare !== null
      ? selectedFare - previousFare
      : null;

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Bus size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">
              Bus fare comparison
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Compare estimated fares for your journey
            </p>
          </div>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
          {canCalculate
            ? `${distanceKm.toFixed(2)} km journey`
            : "Waiting for route"}
        </span>
      </div>

      <div className="p-5 sm:p-6">
        {!canCalculate ? (
          <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-8 text-center">
            <MapPin size={26} className="mx-auto text-slate-400" />
            <p className="mt-3 font-semibold text-slate-800">
              Calculate a route first
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Choose your starting point and destination to see the
              available bus categories and estimated fares.
            </p>
          </div>
        ) : (
          <>
            {isLongDistance && (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <Info size={19} className="mt-0.5 shrink-0 text-amber-700" />
                <div>
                  <p className="text-sm font-bold text-amber-900">
                    Long-distance journey
                  </p>
                  <p className="mt-1 text-sm leading-5 text-amber-800">
                    This journey is longer than 45 km. Only the
                    Inter-District / Long-Distance Bus category is
                    available under your project's rules.
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-slate-950 p-5 text-white sm:flex sm:items-center sm:justify-between sm:gap-5">
              <div>
                <div className="flex items-center gap-2 text-emerald-300">
                  <Check size={16} />
                  <p className="text-sm font-semibold">
                    {isLongDistance
                      ? "Required bus category"
                      : "Selected bus category"}
                  </p>
                </div>

                <p className="mt-2 text-base font-bold">
                  {selectedBus?.name ?? "Select a category"}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Estimated fare using the configured rate
                </p>
              </div>

              <div className="mt-4 sm:mt-0 sm:text-right">
                <p className="text-3xl font-extrabold tracking-tight">
                  {selectedFare !== null
                    ? formatTaka(selectedFare)
                    : "—"}
                </p>

                {difference !== null && (
                  <p className="mt-1 text-xs text-emerald-300">
                    +{formatTaka(difference)} vs previous-rate estimate
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {availableRates.map((bus) => {
                const isSelected = bus.id === effectiveCategory;
                const currentFare = calculateFare(
                  distanceKm,
                  bus.currentRate
                );
                const oldFare = calculateFare(
                  distanceKm,
                  bus.previousRate
                );
                const fareDifference = currentFare - oldFare;

                return (
                  <button
                    key={bus.id}
                    type="button"
                    onClick={() => onCategoryChange(bus.id)}
                    aria-pressed={isSelected}
                    className={`relative flex min-w-0 flex-col rounded-2xl border p-4 text-left transition duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-500"
                        : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                          isSelected
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Bus size={16} />
                      </span>

                      {isSelected && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-800">
                          <Check size={11} />
                          Selected
                        </span>
                      )}
                    </div>

                    <p className="mt-3 min-h-10 text-sm font-bold leading-5 text-slate-800">
                      {bus.name}
                    </p>

                    <p className="mt-3 text-xs text-slate-500">
                      Current-rate estimate
                    </p>
                    <p className="mt-1 break-words text-xl font-extrabold tracking-tight text-slate-950">
                      {formatTaka(currentFare)}
                    </p>

                    <div className="mt-3 border-t border-slate-200/80 pt-3">
                      <p className="text-xs text-slate-500">
                        Previous-rate estimate
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {formatTaka(oldFare)}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                      <TrendingUp size={13} />
                      +{formatTaka(fareDifference)}
                    </div>

                    <p className="mt-2 text-[11px] leading-4 text-slate-500">
                      {formatTaka(bus.currentRate)} per km
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <Info size={17} className="mt-0.5 shrink-0 text-slate-500" />
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  How is the fare estimated?
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Estimated fare = road distance × rate per kilometre.
                  Actual fares can differ because of official fare rules,
                  minimum fares, rounding, routes, and operator practices.
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-400">
              The 45 km threshold is a rule configured for this project.
              The rates and distance eligibility should be verified against
              official transport regulations before real-world use.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
