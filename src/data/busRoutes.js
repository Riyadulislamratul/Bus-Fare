
/**
 * Bus Fare BD — Bus route database
 *
 * IMPORTANT:
 * - This is a starter dataset, not complete nationwide coverage.
 * - Route listings need current verification.
 * - Local routes below allow reverse-direction matching as a
 *   provisional assumption. Confirm that return services operate.
 * - Intercity endpoint-only records do not allow reverse matching
 *   until the return service has been verified.
 * - Source URLs must be plain URLs, not Markdown links.
 */

export const busRoutes = [
  {
    id: "dhaka-gazipur-paribahan-motijheel-shibbari",
    operator: "Gazipur Paribahan",
    routeName: "Motijheel — Shib Bari",
    serviceType: "city",
    region: "Dhaka and Gazipur",
    direction: "Motijheel to Shib Bari",
    allowReverseDirection: true,
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
    notes:
      "Published route listing. Reverse-direction matching is provisional; confirm current service and stops.",
  },

  {
    id: "dhaka-basumati-gabtoli-gazipur",
    operator: "Basumati Transport",
    routeName: "Gabtoli — Gazipur Chourasta",
    serviceType: "city",
    region: "Dhaka and Gazipur",
    direction: "Gabtoli to Gazipur Chourasta",
    allowReverseDirection: true,
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
    notes:
      "Published route listing. Reverse-direction matching is provisional; confirm current service and stops.",
  },

  {
    id: "dhaka-vip-azimpur-gazipur",
    operator: "VIP",
    routeName: "Azimpur — Gazipur Chourasta",
    serviceType: "city",
    region: "Dhaka and Gazipur",
    direction: "Azimpur to Gazipur Chourasta",
    allowReverseDirection: true,
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
    notes:
      "Third-party route dataset. Reverse-direction matching is provisional; verify with the operator.",
  },

  {
    id: "brtc-dhaka-khulna",
    operator: "Bangladesh Road Transport Corporation (BRTC)",
    routeName: "Dhaka — Khulna",
    serviceType: "intercity",
    region: "Dhaka and Khulna",
    direction: "Dhaka to Khulna",
    allowReverseDirection: false,
    stops: ["Dhaka", "Khulna"],
    sourceUrl:
      "https://brtc.gov.bd/pages/static-pages/6922e0e1933eb65569e29008",
    verificationStatus: "needs_review",
    notes:
      "Endpoint-only record. Intermediate stops and reverse service need verification.",
  },

  {
    id: "brtc-dhaka-lakshmipur",
    operator: "Bangladesh Road Transport Corporation (BRTC)",
    routeName: "Dhaka — Lakshmipur",
    serviceType: "intercity",
    region: "Dhaka and Lakshmipur",
    direction: "Dhaka to Lakshmipur",
    allowReverseDirection: false,
    stops: ["Dhaka", "Lakshmipur"],
    sourceUrl:
      "https://brtc.portal.gov.bd/pages/static-pages/যাত্রী-পরিবহন-সেবা-e84539-6922e0e1933eb65569e29008",
    verificationStatus: "needs_review",
    notes:
      "Endpoint-only record. Verify current service, intermediate stops and return journey.",
  },
];

/**
 * Normalize names so differences in capitalization, spacing,
 * and common dash characters do not prevent a match.
 */
export function normalizeStopName(value = "") {
  return String(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[–—-]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Return unique stop names for the dropdown selectors.
 */
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
 * Find direct routes in either direction.
 *
 * Forward:
 *   Board Bazar -> Gazipur Chourasta
 *
 * Reverse (only when allowReverseDirection is true):
 *   Board Bazar -> House Building
 *
 * The returned stopsBetween array always follows the user's
 * selected origin-to-destination direction.
 */
export function findDirectBuses(
  origin,
  destination,
  routes = busRoutes
) {
  const originKey = normalizeStopName(origin);
  const destinationKey = normalizeStopName(destination);

  if (
    !originKey ||
    !destinationKey ||
    originKey === destinationKey
  ) {
    return [];
  }

  return routes
    .map((route) => {
      const normalizedStops = route.stops.map(normalizeStopName);

      const originIndex = normalizedStops.indexOf(originKey);
      const destinationIndex =
        normalizedStops.indexOf(destinationKey);

      // Both stops must exist in this route.
      if (originIndex === -1 || destinationIndex === -1) {
        return null;
      }

      // Forward direction: destination occurs after origin.
      if (destinationIndex > originIndex) {
        return {
          ...route,
          boardingStop: route.stops[originIndex],
          dropoffStop: route.stops[destinationIndex],
          stopsBetween: route.stops.slice(
            originIndex,
            destinationIndex + 1
          ),
          stopCount: destinationIndex - originIndex + 1,
          matchedDirection: "forward",
        };
      }

      // Reverse direction is permitted only for explicitly enabled routes.
      if (route.allowReverseDirection === true) {
        const reverseStops = [...route.stops].reverse();
        const reverseNormalized = reverseStops.map(normalizeStopName);

        const reverseOriginIndex =
          reverseNormalized.indexOf(originKey);

        const reverseDestinationIndex =
          reverseNormalized.indexOf(destinationKey);

        if (
          reverseOriginIndex !== -1 &&
          reverseDestinationIndex > reverseOriginIndex
        ) {
          return {
            ...route,
            boardingStop: reverseStops[reverseOriginIndex],
            dropoffStop: reverseStops[reverseDestinationIndex],
            stopsBetween: reverseStops.slice(
              reverseOriginIndex,
              reverseDestinationIndex + 1
            ),
            stopCount:
              reverseDestinationIndex - reverseOriginIndex + 1,
            matchedDirection: "reverse",
            matchedDirectionNote:
              "Reverse direction is provisional and requires verification.",
          };
        }
      }

      return null;
    })
    .filter(Boolean)
    .sort((a, b) => a.stopCount - b.stopCount);
}
