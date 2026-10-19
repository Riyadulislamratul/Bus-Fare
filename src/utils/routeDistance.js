
const CACHE_KEY = "bus-fare-bd-stop-coordinates-v1";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

function normalizeName(name) {
  return name
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[–—-]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Storage may be unavailable or full; routing can still continue.
  }
}

let lastNominatimRequest = 0;

async function geocodeStop(name, signal) {
  const cache = readCache();
  const key = normalizeName(name);

  if (cache[key]) return cache[key];

  // Respect the public Nominatim service's request rate.
  const elapsed = Date.now() - lastNominatimRequest;
  if (elapsed < 1100) {
    await new Promise((resolve) =>
      setTimeout(resolve, 1100 - elapsed)
    );
  }

  if (signal?.aborted) {
    throw new DOMException("Request cancelled", "AbortError");
  }

  lastNominatimRequest = Date.now();

  const params = new URLSearchParams({
    q: `${name}, Bangladesh`,
    format: "jsonv2",
    limit: "1",
    countrycodes: "bd",
  });

  const response = await fetch(`${NOMINATIM_URL}?${params}`, {
    signal,
    headers: {
      "Accept-Language": "en",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Could not locate "${name}". Please try again later.`
    );
  }

  const results = await response.json();

  if (!results.length) {
    throw new Error(`No map location found for "${name}".`);
  }

  const location = {
    name,
    lat: Number(results[0].lat),
    lon: Number(results[0].lon),
  };

  cache[key] = location;
  saveCache(cache);

  return location;
}

/**
 * Calculates a road distance through an ordered sequence of stops.
 *
 * IMPORTANT:
 * This follows roads selected by OSRM between the supplied stop
 * coordinates. It is not proof that the bus follows those exact roads.
 */
export async function calculateRouteSegmentDistance(stops, signal) {
  if (!Array.isArray(stops) || stops.length < 2) {
    throw new Error("At least two stops are required.");
  }

  const locations = [];

  // Geocode sequentially to reduce pressure on the public geocoder.
  for (const stop of stops) {
    const location = await geocodeStop(stop, signal);
    locations.push(location);
  }

  if (signal?.aborted) {
    throw new DOMException("Request cancelled", "AbortError");
  }

  const coordinates = locations
    .map((location) => `${location.lon},${location.lat}`)
    .join(";");

  const response = await fetch(
    `${OSRM_URL}/${coordinates}?overview=false&steps=false`,
    { signal }
  );

  if (!response.ok) {
    throw new Error("The road-routing service is unavailable.");
  }

  const data = await response.json();

  if (data.code !== "Ok" || !data.routes?.length) {
    throw new Error("Could not calculate the route distance.");
  }

  return {
    distanceKm: data.routes[0].distance / 1000,
    durationMinutes: data.routes[0].duration / 60,
    waypointCount: locations.length,
    coordinates: locations.map(({ lat, lon }) => [lat, lon]),
  };
}
