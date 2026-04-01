import SunCalc from 'suncalc';

export interface SunPosition {
  altitude: number;   // radians, negative = below horizon
  azimuth: number;    // radians, south=0, west=pi/2, east=-pi/2
  altitudeDegrees: number;
  azimuthDegrees: number; // 0=North, 90=East, 180=South, 270=West
}

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
  solarNoon: Date;
  dawn: Date;
  dusk: Date;
}

export function getSunPosition(lat: number, lon: number, date: Date = new Date()): SunPosition {
  const pos = SunCalc.getPosition(date, lat, lon);
  return {
    altitude: pos.altitude,
    azimuth: pos.azimuth,
    altitudeDegrees: (pos.altitude * 180) / Math.PI,
    // SunCalc azimuth: south=0, west=+pi. Convert to compass: N=0, E=90, S=180, W=270
    azimuthDegrees: ((pos.azimuth * 180) / Math.PI + 180 + 360) % 360,
  };
}

export function getSunTimes(lat: number, lon: number, date: Date = new Date()): SunTimes {
  const times = SunCalc.getTimes(date, lat, lon);
  return {
    sunrise: times.sunrise,
    sunset: times.sunset,
    solarNoon: times.solarNoon,
    dawn: times.dawn,
    dusk: times.dusk,
  };
}

// Returns hourly sun positions for today
export function getDaySunPath(lat: number, lon: number): Array<{ hour: number; altitude: number; azimuth: number }> {
  const today = new Date();
  return Array.from({ length: 24 }, (_, hour) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, 0, 0);
    const pos = SunCalc.getPosition(d, lat, lon);
    return {
      hour,
      altitude: (pos.altitude * 180) / Math.PI,
      azimuth: ((pos.azimuth * 180) / Math.PI + 180 + 360) % 360,
    };
  });
}
