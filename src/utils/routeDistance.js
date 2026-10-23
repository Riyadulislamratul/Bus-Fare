
const CACHE_KEY = "bus-fare-bd-stop-coordinates-v2";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

function normalizeName(name) {
  return String(name)
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
    // Continue without caching if storage is unavailable.
  }
}

let lastRequestTime = 0;

async function geocodeStop(name, region, signal) {
  const cache = readCache();
  const key = `${normalizeName(name)}|${normalizeName(region)}`;

  if (cache[key]) {
    return cache[key];
  }

  const elapsed = Date.now() - lastRequestTime;

  if (elapsed < 1100) {
    await new Promise((resolve) =>
      setTimeout(resolve, 1100 - elapsed)
    );
  }

  if (signal?.aborted) {
    throw new DOMException("Request cancelled", "AbortError");
  }

  lastRequestTime = Date.now();

  const searchQuery = `${name}, ${region}, Bangladesh`;
  const params = new URLSearchParams({
    q: searchQuery,
    format: "jsonv2",
    limit: "5",
    countrycodes: "bd",
    addressdetails: "1",
  });

  const response = await fetch(`${NOMINATIM_URL}?${params}`, {
    signal,
    headers: { "Accept-Language": "en" },
  });

  if (!response.ok) {
    throw new Error(`Could not look up "${name}".`);
  }

  const results = await response.json();

  if (!results.length) {
    throw new Error(
      `No location found for "${name}" in ${region}.`
    );
  }

  // Select the first result in the requested country.
  // This is still an approximation: geocoding cannot guarantee
  // that a result represents the exact bus stop.
  const result = results.find(
    (item) => item.address?.country_code?.toLowerCase() === "bd"
  );

  if (!result) {
    throw new Error(`No Bangladesh result found for "${name}".`);
  }

  const location = {
    name,
    lat: Number(result.lat),
    lon: Number(result.lon),
    displayName: result.display_name,
  };

  if (
    !Number.isFinite(location.lat) ||
    !Number.isFinite(location.lon)
  ) {
    throw new Error(`Invalid coordinates returned for "${name}".`);
  }

  cache[key] = location;
  saveCache(cache);

  return location;
}

async function fetchRoadDistance(from, to, signal) {
  const url =
    `${OSRM_URL}/${from.lon},${from.lat};${to.lon},${to.lat}` +
    "?overview=false&steps=false";

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error("Road-routing service is unavailable.");
  }

  const data = await response.json();

  if (data.code !== "Ok" || !data.routes?.length) {
    throw new Error("Could not calculate road distance.");
  }

  return {
    distanceKm: data.routes[0].distance / 1000,
    durationMinutes: data.routes[0].duration / 60,
  };
}

/**
 * Estimate distance through the listed stops in travel order.
 *
 * region should be a useful geographic context such as
 * "Dhaka and Gazipur". Coordinates are still approximate unless
 * verified stop coordinates are provided by the dataset.
 */
export async function calculateRouteSegmentDistance(
  stops,
  signal,
  region = "Bangladesh"
) {
  if (!Array.isArray(stops) || stops.length < 2) {
    throw new Error("At least two stops are required.");
  }

  const locations = [];

  // Geocode stops sequentially to reduce requests to Nominatim.
  for (const stop of stops) {
    if (signal?.aborted) {
      throw new DOMException("Request cancelled", "AbortError");
    }

    locations.push(await geocodeStop(stop, region, signal));
  }

  let totalDistanceKm = 0;
  let totalDurationMinutes = 0;
  const segments = [];

  // Route between each adjacent pair, rather than trusting a single
  // potentially strange route across all waypoints.
  for (let i = 0; i < locations.length - 1; i++) {
    if (signal?.aborted) {
      throw new DOMException("Request cancelled", "AbortError");
    }

    const from = locations[i];
    const to = locations[i + 1];

    const segment = await fetchRoadDistance(from, to, signal);

    // A huge distance between consecutive local stops often indicates
    // a wrong geocoding result. Fail safely instead of showing a fake fare.
    if (
      !Number.isFinite(segment.distanceKm) ||
      segment.distanceKm <= 0 ||
      (segment.distanceKm > 50 && region !== "Bangladesh")
    ) {
      throw new Error(
        `Suspicious distance between "${from.name}" and "${to.name}". ` +
        "The stop coordinates need verification."
      );
    }

    totalDistanceKm += segment.distanceKm;
    totalDurationMinutes += segment.durationMinutes;

    segments.push({
      from: from.name,
      to: to.name,
      distanceKm: segment.distanceKm,
      durationMinutes: segment.durationMinutes,
      fromCoordinates: [from.lat, from.lon],
      toCoordinates: [to.lat, to.lon],
    });
  }

  return {
    distanceKm: totalDistanceKm,
    durationMinutes: totalDurationMinutes,
    waypointCount: locations.length,
    coordinates: locations.map(({ lat, lon }) => [lat, lon]),
    segments,
  };
}
