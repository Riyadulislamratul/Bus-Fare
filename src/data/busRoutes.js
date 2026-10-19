
/**
 * Bus Fare BD — Bus route database
 *
 * IMPORTANT:
 * - Sample routes are research leads, not a complete national database.
 * - "unverified" means the route needs confirmation with the operator
 *   or another reliable, current source.
 * - Keep route stops in travel order.
 * - Add routes as separate records when the same operator serves
 *   different corridors or directions.
 */

export const busRoutes = [
  {
    id: "dhaka-gazipur-paribahan-motijheel-shibbari",
    operator: "Gazipur Paribahan",
    routeName: "Motijheel — Shib Bari",
    serviceType: "city",
    region: "Dhaka and Gazipur",
    direction: "Motijheel to Shib Bari",
    stops: [
      "Motijheel",
      "Paltan",
      "Kakrail",
      "Shantinagar",
      "Malibagh",
      "Mouchak",
      "Mogbazar",
      "Nabisco",
      "Mohakhali",
      "Chairman Bari",
      "Sainik Club",
      "Kakali",
      "Banani",
      "Staff Road",
      "MES",
      "Shewra",
      "Kuril",
      "Khilkhet",
      "Airport",
      "Jashimuddin",
      "Rajlakshmi",
      "Azampur",
      "House Building",
      "Abdullahpur",
      "Tongi",
      "Station Road",
      "Mill Gate",
      "Board Bazar",
      "Gazipur Chourasta",
      "Shib Bari",
    ],
    sourceUrl:
      "https://dhakabusservice.com/bus/gazipur-paribahan-bus-route/",
    verificationStatus: "unverified",
    notes: "Published route listing; confirm current stops and endpoints.",
  },
  {
    id: "dhaka-basumati-gabtoli-gazipur",
    operator: "Basumati Transport",
    routeName: "Gabtoli — Gazipur Chourasta",
    serviceType: "city",
    region: "Dhaka and Gazipur",
    direction: "Gabtoli to Gazipur Chourasta",
    stops: [
      "Gabtoli",
      "Mirpur 1",
      "Sony Cinema Hall",
      "Mirpur 2",
      "Mirpur 10",
      "Mirpur 11",
      "Purobi",
      "Kalshi",
      "ECB Square",
      "MES",
      "Shewra",
      "Kuril",
      "Khilkhet",
      "Airport",
      "Jashimuddin",
      "Rajlakshmi",
      "Azampur",
      "House Building",
      "Abdullahpur",
      "Tongi",
      "Station Road",
      "Mill Gate",
      "Board Bazar",
      "Gazipur Chourasta",
    ],
    sourceUrl:
      "https://dhakabusservice.com/bus/basumati-transport-bus-route/",
    verificationStatus: "unverified",
    notes: "Published route listing; confirm current stops and endpoints.",
  },
  {
    id: "dhaka-vip-azimpur-gazipur",
    operator: "VIP",
    routeName: "Azimpur — Gazipur Chourasta",
    serviceType: "city",
    region: "Dhaka and Gazipur",
    direction: "Azimpur to Gazipur Chourasta",
    stops: [
      "Azimpur",
      "Nilkhet",
      "New Market",
      "City College",
      "Kalabagan",
      "Banani",
      "Kakali",
      "MES",
      "Shewra",
      "Kuril",
      "Khilkhet",
      "Airport",
      "Jashimuddin",
      "Rajlakshmi",
      "Azampur",
      "House Building",
      "Abdullahpur",
      "Tongi",
      "Station Road",
      "Mill Gate",
      "Board Bazar",
      "Gazipur Chourasta",
    ],
    sourceUrl:
      "https://joynto1.github.io/dhaka_local_bus/bus_routes/vip.html",
    verificationStatus: "unverified",
    notes: "Third-party route dataset; confirm with current operator information.",
  },

  // BRTC examples based on the operator's published passenger-service page.
  // They are endpoint-to-endpoint records, not complete intermediate-stop lists.
  {
    id: "brtc-dhaka-khulna",
    operator: "Bangladesh Road Transport Corporation (BRTC)",
    routeName: "Dhaka — Khulna",
    serviceType: "intercity",
    region: "Dhaka and Khulna",
    direction: "Dhaka to Khulna",
    stops: ["Dhaka", "Khulna"],
    sourceUrl: "https://brtc.gov.bd/pages/static-pages/6922e0e1933eb65569e29008",
    verificationStatus: "needs_review",
    notes:
      "Published service endpoints only; intermediate stops and current schedule need verification.",
  },
  {
    id: "brtc-dhaka-lakshmipur",
    operator: "Bangladesh Road Transport Corporation (BRTC)",
    routeName: "Dhaka — Lakshmipur",
    serviceType: "intercity",
    region: "Dhaka and Lakshmipur",
    direction: "Dhaka to Lakshmipur",
    stops: ["Dhaka", "Lakshmipur"],
    sourceUrl: "https://brtc.portal.gov.bd/pages/static-pages/যাত্রী-পরিবহন-সেবা-e84539-6922e0e1933eb65569e29008",
    verificationStatus: "needs_review",
    notes:
      "Published service endpoints only; verify current service details before relying on this route.",
  },
];

/**
 * Normalize names so that capitalization and extra spaces don't prevent
 * matching. This intentionally does not assume that similar names are
 * always the same physical stop.
 */
export function normalizeStopName(value = "") {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[–—-]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function getAllStops(routes = busRoutes) {
  const uniqueStops = new Map();

  for (const route of routes) {
    for (const stop of route.stops) {
      const key = normalizeStopName(stop);

      if (key && !uniqueStops.has(key)) {
        uniqueStops.set(key, stop);
      }
    }
  }

  return [...uniqueStops.values()].sort((a, b) =>
    a.localeCompare(b, "en")
  );
}

/**
 * Finds a direct bus only when the origin and destination appear in
 * the right order on the same route.
 *
 * This first version uses exact normalized stop names. It does not
 * infer that two differently named stops are geographically identical.
 */
export function findDirectBuses(origin, destination, routes = busRoutes) {
  const originKey = normalizeStopName(origin);
  const destinationKey = normalizeStopName(destination);

  if (!originKey || !destinationKey || originKey === destinationKey) {
    return [];
  }

  return routes
    .map((route) => {
      const normalizedStops = route.stops.map(normalizeStopName);
      const originIndex = normalizedStops.indexOf(originKey);
      const destinationIndex = normalizedStops.indexOf(destinationKey);

      if (
        originIndex === -1 ||
        destinationIndex === -1 ||
        destinationIndex <= originIndex
      ) {
        return null;
      }

      return {
        ...route,
        boardingStop: route.stops[originIndex],
        dropoffStop: route.stops[destinationIndex],
        stopsBetween: route.stops.slice(
          originIndex,
          destinationIndex + 1
        ),
        stopCount: destinationIndex - originIndex + 1,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.stopCount - b.stopCount);
}
