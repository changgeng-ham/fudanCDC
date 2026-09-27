export interface Disease {
  id: string;
  name: string;
  en: string;
  kind: string; // reported_cases | estimated_cases | reported_deaths
  unit: string;
  desc: string;
  category: string;
  whoIndicator: string;
  series: Record<string, number>;
}

export interface TopItem {
  diseaseId: string;
  name: string;
  value: number;
  kind: string;
  unit: string;
}

export interface OutbreakEvent {
  year: number;
  name: string;
  location: string;
  lng: number;
  lat: number;
  cases: number;
  disease: string;
  detail: string;
  source: string;
  sourceUrl: string;
}

export interface Dataset {
  meta: {
    source: string;
    eventsSource: string;
    generatedAt: string;
    yearRange: [number, number];
    note: string;
  };
  diseases: Disease[];
  topByYear: Record<string, TopItem[]>;
  events: OutbreakEvent[];
}

export function fmt(n: number): string {
  if (n >= 1e8) return (n / 1e8).toFixed(2) + " 亿";
  if (n >= 1e4) return (n / 1e4).toFixed(1).replace(/\.0$/, "") + " 万";
  return n.toLocaleString("zh-CN");
}
