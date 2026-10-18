
import {
  Bus,
  TrendingUp,
  Calculator,
  Info,
  ShieldAlert,
} from "lucide-react";

import {
  fareRates,
  calculateFare,
  formatTaka,
} from "../data/fareRates";

export default function FareSummary({
  distanceKm,
  selectedCategory,
  onCategoryChange,
}) {
  const selectedBus = fareRates.find(
    (bus) => bus.id === selectedCategory
  );

  const validDistance =
    typeof distanceKm === "number" &&
    Number.isFinite(distanceKm) &&
    distanceKm > 0;

  const previousFare =
    validDistance && selectedBus
      ? calculateFare(distanceKm, selectedBus.previousRate)
      : null;

  const currentFare =
    validDistance && selectedBus
      ? calculateFare(distanceKm, selectedBus.currentRate)
      : null;

  const fareDifference =
    previousFare !== null && currentFare !== null
      ? currentFare - previousFare
      : null;

  const canCalculate =
    validDistance &&
    selectedBus !== undefined &&
    previousFare !== null &&
    currentFare !== null;

  return (
    <section className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-lg shadow-slate-900/10">
      <div className="relative p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/15 blur-3xl" />

        <div className="relative">
          {/* Heading */}
          <div className="flex items-center gap-2 text-emerald-300">
            <Bus size={21} />
            <h3 className="text-lg font-bold tracking-tight">
              Bus Fare Calculator
            </h3>
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-300">
            Compare estimated fares using the previous and current
            rates entered for this project.
          </p>

          {/* Bus category selector */}
          <label
            htmlFor="bus-category"
            className="mt-5 block text-sm font-semibold text-slate-200"
          >
            Select bus category
          </label>

          <select
            id="bus-category"
            value={selectedCategory}
            onChange={(event) =>
              onCategoryChange(event.target.value)
            }
            className="mt-2 w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
          >
            {fareRates.map((bus) => (
              <option key={bus.id} value={bus.id}>
                {bus.name}
              </option>
            ))}
          </select>

          {/* Results */}
          {canCalculate ? (
            <>
              <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-white/[0.06] p-5">
                <div className="flex items-center gap-2 text-sm text-emerald-300">
                  <Calculator size={16} />
                  Current-rate estimate
                </div>

                <p className="mt-3 break-words text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {formatTaka(currentFare)}
                </p>

                <p className="mt-3 text-sm text-slate-300">
                  {distanceKm.toFixed(2)} km ×{" "}
                  {formatTaka(selectedBus.currentRate)}/km
                </p>

                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                  <TrendingUp size={14} />
                  Estimated fare for one journey
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/[0.06] p-4">
                  <p className="text-xs leading-5 text-slate-400">
                    Previous-rate estimate
                  </p>

                  <p className="mt-2 break-words text-xl font-bold">
                    {formatTaka(previousFare)}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {formatTaka(selectedBus.previousRate)}/km
                  </p>
                </div>

                <div className="rounded-2xl bg-emerald-500/10 p-4">
                  <p className="text-xs leading-5 text-emerald-300">
                    Estimated increase
                  </p>

                  <p className="mt-2 break-words text-xl font-bold text-emerald-300">
                    +{formatTaka(fareDifference)}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Compared with the previous rate
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-3 rounded-xl border border-white/10 p-3">
                <Info
                  size={17}
                  className="mt-0.5 shrink-0 text-emerald-300"
                />

                <p className="text-xs leading-5 text-slate-300">
                  Calculation: estimated road distance × rate per
                  kilometre. The result is a mathematical estimate,
                  not a confirmed ticket price.
                </p>
              </div>
            </>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-white/20 p-5">
              <p className="text-2xl font-extrabold">৳ --</p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Select a starting point and destination and wait for
                a successful route calculation to see your estimated
                fare.
              </p>
            </div>
          )}

          {/* Important notice */}
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-300/20 bg-amber-400/[0.06] p-3">
            <ShieldAlert
              size={17}
              className="mt-0.5 shrink-0 text-amber-300"
            />

            <p className="text-xs leading-5 text-slate-300">
              <span className="font-semibold text-amber-200">
                Prototype rates:
              </span>{" "}
              The rates currently used by this project have not been
              verified here against the applicable official fare
              schedule. Actual fares may differ because of minimum
              fares, rounding rules, route distance, and bus
              operations.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
