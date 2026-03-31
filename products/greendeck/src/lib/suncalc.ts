import SunCalc from "suncalc";

export function getSunTimes(date: Date, lat: number, lon: number) {
  return SunCalc.getTimes(date, lat, lon);
}

export function getSunPosition(date: Date, lat: number, lon: number) {
  return SunCalc.getPosition(date, lat, lon);
}
