
export const fareRates = [
  {
    id: "city",
    name: "Dhaka & Chattogram City Bus",
    shortName: "City bus",
    previousRate: 2.53,
    currentRate: 2.70,
  },
  {
    id: "minibus",
    name: "Minibus (City Areas)",
    shortName: "Minibus",
    previousRate: 2.42,
    currentRate: 2.59,
  },
  {
    id: "intercity",
    name: "Inter-District / Long-Distance Bus",
    shortName: "Inter-district",
    previousRate: 2.23,
    currentRate: 2.40,
  },
  {
    id: "dtca",
    name: "DTCA Area (Dhaka Surroundings)",
    shortName: "DTCA area",
    previousRate: 2.43,
    currentRate: 2.60,
  },
];

export function calculateFare(distanceKm, ratePerKm) {
  if (
    !Number.isFinite(distanceKm) ||
    !Number.isFinite(ratePerKm) ||
    distanceKm <= 0 ||
    ratePerKm <= 0
  ) {
    return null;
  }

  return distanceKm * ratePerKm;
}

export function formatTaka(amount) {
  if (!Number.isFinite(amount)) return "—";

  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace("BDT", "৳");
}
