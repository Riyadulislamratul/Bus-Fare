
import { useRef, useState } from "react";
import { Search, MapPin, LoaderCircle } from "lucide-react";

let lastSearchTime = 0;

export default function LocationSearch({ onSelectLocation }) {
  const [query, setQuery] = useState("");
  const [locationType, setLocationType] = useState("origin");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const cache = useRef(new Map());

  async function handleSearch(event) {
    event.preventDefault();

    const searchText = query.trim();

    if (!searchText) {
      setError("Please enter a place name.");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const cacheKey = searchText.toLowerCase();

      let places = cache.current.get(cacheKey);

      if (!places) {
        // Respect the public Nominatim service's 1 request/second limit.
        const waitTime = Math.max(
          0,
          1100 - (Date.now() - lastSearchTime)
        );

        if (waitTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }

        lastSearchTime = Date.now();

        const params = new URLSearchParams({
          q: `${searchText}, Bangladesh`,
          format: "jsonv2",
          limit: "5",
          countrycodes: "bd",
        });

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params}`
        );

        if (!response.ok) {
          throw new Error(
            "Location search is temporarily unavailable. Please try again."
          );
        }

        places = await response.json();
        cache.current.set(cacheKey, places);
      }

      if (places.length === 0) {
        setError("No matching places found. Try a more specific name.");
      } else {
        setResults(places);
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function choosePlace(place) {
    onSelectLocation(locationType, {
      name: place.display_name,
      coordinates: [Number(place.lat), Number(place.lon)],
    });

    setQuery(place.display_name);
    setResults([]);
    setError("");
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Search size={20} className="text-emerald-600" />
        <h3 className="font-semibold">Search for a location</h3>
      </div>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        Search a place in Bangladesh, then select the matching result.
      </p>

      <form onSubmit={handleSearch} className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Use this location as
          </span>

          <select
            value={locationType}
            onChange={(event) => {
              setLocationType(event.target.value);
              setResults([]);
              setError("");
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-500"
          >
            <option value="origin">Starting point</option>
            <option value="destination">Destination</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Place name
          </span>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. Uttara, Dhaka"
            className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <LoaderCircle size={18} className="animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search size={18} />
              Search locations
            </>
          )}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-slate-700">
            Choose a result
          </p>

          {results.map((place) => (
            <button
              key={`${place.osm_type}-${place.osm_id}`}
              type="button"
              onClick={() => choosePlace(place)}
              className="flex w-full items-start gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <MapPin
                size={18}
                className="mt-0.5 shrink-0 text-emerald-600"
              />
              <span className="text-sm leading-5 text-slate-700">
                {place.display_name}
              </span>
            </button>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Search powered by OpenStreetMap Nominatim. Results may not represent
        official bus stops.
      </p>
    </section>
  );
}
