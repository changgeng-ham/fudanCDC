import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { Disease } from '@/types';
import { fmt } from '@/types';

interface Props {
  disease: Disease;
  year: number;
  onClose: () => void;
}

/** 病种详情面板：描述 + 历史趋势折线 */
export default function DiseasePanel({ disease, year, onClose }: Props) {
  const chartEl = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartEl.current) return;
    const chart = echarts.init(chartEl.current);
    const years = Object.keys(disease.series).map(Number).sort((a, b) => a - b);
    chart.setOption({
      grid: { left: 56, right: 16, top: 24, bottom: 24 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0c1220',
        borderColor: '#1a2540',
        textStyle: { color: '#dbe6f5', fontSize: 11, fontFamily: 'JetBrains Mono' },
        valueFormatter: (v: number) => fmt(v),
      },
      xAxis: {
        type: 'category',
        data: years,
        axisLine: { lineStyle: { color: '#1a2540' } },
        axisLabel: { color: '#5b7290', fontSize: 9, fontFamily: 'JetBrains Mono', interval: Math.ceil(years.length / 8) },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#111a2b' } },
        axisLabel: { color: '#5b7290', fontSize: 9, fontFamily: 'JetBrains Mono', formatter: (v: number) => fmt(v) },
      },
      series: [
        {
          type: 'line',
          data: years.map((y) => disease.series[String(y)]),
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#22d3ee', width: 1.6 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(34,211,238,0.28)' },
              { offset: 1, color: 'rgba(34,211,238,0)' },
            ]),
          },
          markLine: {
            symbol: 'none',
            label: { color: '#fbbf24', fontSize: 9, fontFamily: 'JetBrains Mono', formatter: `${year}` },
            lineStyle: { color: '#fbbf24', type: 'dashed', width: 1 },
            data: [{ xAxis: String(year) }],
            silent: true,
          },
        },
      ],
    });
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(chartEl.current);
    return () => { ro.disconnect(); chart.dispose(); };
  }, [disease, year]);

  const cur = disease.series[String(year)];
  const years = Object.keys(disease.series).map(Number);
  const peakYear = years.length ? years.reduce((a, b) => (disease.series[String(a)] >= disease.series[String(b)] ? a : b)) : null;

  return (
    <>
      {/* 移动端遮罩 */}
      <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[72dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-b-0 border-[#1a2540] bg-[#0c1220] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] md:absolute md:inset-y-3 md:left-auto md:right-3 md:z-30 md:h-auto md:max-h-none md:w-[400px] md:rounded-md md:border-b">
        <div className="flex items-start justify-between border-b border-[#1a2540] px-4 py-3">
          <div>
            <div className="font-mono text-[10px] tracking-[0.22em] text-[#22d3ee] uppercase">{disease.category}</div>
            <h3 className="mt-1 text-lg font-bold text-white">
              {disease.name}
              <span className="ml-2 font-mono text-xs font-normal text-[#5b7290]">{disease.en}</span>
            </h3>
          </div>
          <button onClick={onClose} className="rounded border border-[#1a2540] px-2 py-1 font-mono text-xs text-[#8fa8c8] hover:border-[#22d3ee] hover:text-[#22d3ee]">
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3 pb-8">
          <div className="grid grid-cols-3 gap-2 font-mono">
            <div className="rounded border border-[#1a2540] bg-[#050810] p-2">
              <div className="text-[9px] tracking-widest text-[#5b7290] uppercase">{year} 年</div>
              <div className="mt-1 text-base font-bold text-[#22d3ee]">{cur !== undefined ? fmt(cur) : '—'}</div>
            </div>
            <div className="rounded border border-[#1a2540] bg-[#050810] p-2">
              <div className="text-[9px] tracking-widest text-[#5b7290] uppercase">历史峰值</div>
              <div className="mt-1 text-base font-bold text-[#fbbf24]">{peakYear !== null ? fmt(disease.series[String(peakYear)]) : '—'}</div>
            </div>
            <div className="rounded border border-[#1a2540] bg-[#050810] p-2">
              <div className="text-[9px] tracking-widest text-[#5b7290] uppercase">峰值年份</div>
              <div className="mt-1 text-base font-bold text-[#f87171]">{peakYear ?? '—'}</div>
            </div>
          </div>
          <p className="text-[12.5px] leading-relaxed text-[#a9bdd6]">{disease.desc}</p>
          <div className="h-[210px] rounded border border-[#1a2540] bg-[#050810] p-1">
            <div ref={chartEl} className="h-full w-full" />
          </div>
          <p className="font-mono text-[10px] leading-relaxed text-[#41566f]">
            指标：{disease.whoIndicator} · {disease.unit} · 来源：WHO Global Health Observatory
          </p>
        </div>
      </div>
    </>
  );
}
