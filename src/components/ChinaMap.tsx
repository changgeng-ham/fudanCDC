import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { OutbreakEvent } from "@/types";

interface Props {
  geoJson: unknown;
  events: OutbreakEvent[];
  year: number;
  onSelectEvent: (e: OutbreakEvent) => void;
}

/** 中国地图 + 重大疫情事件散点图层 */
export default function ChinaMap({ geoJson, events, year, onSelectEvent }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const cbRef = useRef(onSelectEvent);
  cbRef.current = onSelectEvent;

  // 初始化一次
  useEffect(() => {
    if (!ref.current || !geoJson) return;
    echarts.registerMap("china", geoJson as never);
    const chart = echarts.init(ref.current, undefined, { renderer: "canvas" });
    chartRef.current = chart;
    chart.on("click", (p: echarts.ECElementEvent) => {
      if (p.seriesType === "effectScatter" && p.data) {
        const e = (p.data as { event?: OutbreakEvent }).event;
        if (e) cbRef.current(e);
      }
    });
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      chart.dispose();
    };
  }, [geoJson]);

  // 数据随年份更新
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const shown = events.filter((e) => e.year <= year);
    chart.setOption({
      backgroundColor: "transparent",
      tooltip: {
        backgroundColor: "#0c1220",
        borderColor: "#1a2540",
        textStyle: { color: "#dbe6f5", fontSize: 12, fontFamily: "JetBrains Mono, sans-serif" },
        formatter: (p: { seriesType: string; data?: { event?: OutbreakEvent } }) => {
          const e = p.data?.event;
          if (!e) return "";
          return `<b style="color:#fbbf24">${e.year} · ${e.name}</b><br/>地点：${e.location}<br/>报告病例：${e.cases.toLocaleString()}<br/><span style="color:#5b7290">点击查看详情</span>`;
        },
      },
      geo: {
        map: "china",
        roam: true,
        zoom: 1.05,
        scaleLimit: { min: 0.8, max: 4 },
        label: { show: false },
        itemStyle: {
          areaColor: "rgba(17,26,43,0.85)",
          borderColor: "#2a3a5c",
          borderWidth: 0.8,
          shadowColor: "rgba(34,211,238,0.15)",
          shadowBlur: 12,
        },
        emphasis: {
          label: { show: true, color: "#22d3ee", fontSize: 10 },
          itemStyle: { areaColor: "rgba(34,60,100,0.9)" },
        },
        select: { disabled: true },
      },
      series: [
        {
          type: "effectScatter",
          coordinateSystem: "geo",
          zlevel: 2,
          rippleEffect: { brushType: "stroke", scale: 3.2 },
          symbolSize: (_val: unknown, params: { data?: { event?: OutbreakEvent } }) => {
            const e = params?.data?.event;
            if (!e) return 8;
            const active = e.year === year;
            const base = 8 + Math.min(18, Math.sqrt(Math.max(e.cases, 1)) / 28);
            return active ? base * 1.6 : base;
          },
          itemStyle: {
            color: (params: { data?: { event?: OutbreakEvent } }) =>
              params.data?.event?.year === year ? "#fbbf24" : "#f87171",
            shadowBlur: 10,
            shadowColor: "rgba(248,113,113,0.6)",
          },
          label: {
            show: true,
            position: "right",
            fontSize: 10,
            fontFamily: "JetBrains Mono, sans-serif",
            color: "#fbbf24",
            formatter: (p: { data?: { event?: OutbreakEvent } }) =>
              p.data?.event && p.data.event.year === year
                ? `${p.data.event.year} ${p.data.event.name}`
                : "",
          },
          data: shown.map((e) => ({ value: [e.lng, e.lat, e.cases], event: e })),
        },
      ],
    });
  }, [events, year, geoJson]);

  return <div ref={ref} className="h-full w-full" />;
}
