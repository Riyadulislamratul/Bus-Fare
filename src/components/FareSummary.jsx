
import { Bus, TrendingUp, Calculator } from "lucide-react";
import { fareRates, calculateFare, formatTaka } from "../data/fareRates";

export default function FareSummary({
  distanceKm,
  selectedCategory,
  onCategoryChange,
}) {
  const selectedBus = fareRates.find(
    (bus) => bus.id === selectedCategory
  );

  const previousFare = selectedBus
    ? calculateFare(distanceKm, selectedBus.previousRate)
    : null;

  const currentFare = selectedBus
    ? calculateFare(distanceKm, selectedBus.currentRate)
    : null;

  const fareDifference =
    previousFare !== null && currentFare !== null
      ? currentFare - previousFare
      : null;

  const canCalculate =
    Number.isFinite(distanceKm) &&
    distanceKm > 0 &&
    selectedBus !== undefined;

  return (
    <section className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-lg shadow-slate-900/10">
      <div className="relative p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/15 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2 text-emerald-300">
            <Bus size={20} />
            <h3 className="font-semibold">Bus Fare Calculator</h3>
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-300">
            Select your bus category to estimate the journey fare.
          </p>

          <label
            htmlFor="bus-category"
            className="mt-5 block text-sm font-medium text-slate-200"
          >
            Bus category
          </label>

          <select
            id="bus-category"
            value={selectedCategory}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
          >
            {fareRates.map((bus) => (
              <option key={bus.id} value={bus.id}>
                {bus.name}
              </option>
            ))}
          </select>

          {canCalculate ? (
            <>
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-300">
                  Estimated fare at the current input rate
                </p>

                <p className="mt-2 text-4xl font-extrabold tracking-tight">
                  {formatTaka(currentFare)}
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  {distanceKm.toFixed(2)} km ×{" "}
                  {formatTaka(selectedBus.currentRate)}/km
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs leading-5 text-slate-400">
                    Previous-rate estimate
                  </p>
                  <p className="mt-2 text-lg font-bold">
                    {formatTaka(previousFare)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatTaka(selectedBus.previousRate)}/km
                  </p>
                </div>

                <div className="rounded-2xl bg-emerald-500/10 p-4">
                  <p className="flex items-center gap-1 text-xs leading-5 text-emerald-300">
                    <TrendingUp size={14} />
                    Estimated difference
                  </p>
                  <p className="mt-2 text-lg font-bold text-emerald-300">
                    +{formatTaka(fareDifference)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Per journey
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/10 p-3">
                <Calculator
                  size={16}
                  className="mt-0.5 shrink-0 text-slate-400"
                />
                <p className="text-xs leading-5 text-slate-400">
                  Calculation: road distance × rate per kilometre.
                  Actual fares may differ due to official rounding,
                  minimum fares, route rules, and bus operations.
                </p>
              </div>
            </>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-white/20 p-5">
              <p className="text-lg font-semibold">৳ --</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Select a starting point and destination to calculate
                your estimated fare.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
