export interface WeatherData {
  temperatureC: number;
  humidityPct: number;
  locationLabel: string;
}

export interface WeatherError {
  type: "permission_denied" | "position_unavailable" | "fetch_failed";
  message: string;
}

export async function getCurrentWeather(): Promise<WeatherData | WeatherError> {
  // Step 1: Get GPS coords
  let coords: GeolocationCoordinates;
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 300000, // Cache position for 5 min
      });
    });
    coords = position.coords;
  } catch (err: unknown) {
    const error = err as GeolocationPositionError;
    if (error.code === 1) {
      return { type: "permission_denied", message: "Location permission denied. Enter weather manually." };
    }
    return { type: "position_unavailable", message: "Could not get location. Enter weather manually." };
  }

  // Step 2: Fetch from Open-Meteo (free, no API key)
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude.toFixed(4)}&longitude=${coords.longitude.toFixed(4)}&current=temperature_2m,relative_humidity_2m&forecast_days=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });

    if (!res.ok) throw new Error(`Open-Meteo returned ${res.status}`);

    const data = await res.json();
    const temp = data.current?.temperature_2m;
    const humidity = data.current?.relative_humidity_2m;

    if (typeof temp !== "number" || typeof humidity !== "number") {
      throw new Error("Unexpected response format from Open-Meteo");
    }

    return {
      temperatureC: Math.round(temp * 10) / 10,
      humidityPct: Math.round(humidity),
      locationLabel: `${coords.latitude.toFixed(2)}°, ${coords.longitude.toFixed(2)}°`,
    };
  } catch {
    return { type: "fetch_failed", message: "Could not fetch weather. Check connection or enter manually." };
  }
}

export function isWeatherError(result: WeatherData | WeatherError): result is WeatherError {
  return "type" in result;
}
