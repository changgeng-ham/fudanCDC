import { useEffect, useRef, useState } from "react";
import type { OutbreakEvent } from "@/types";

/** 顶部滚动快讯条（悬停暂停） */
export function Ticker({ events }: { events: OutbreakEvent[] }) {
  const items = [...events].sort((a, b) => a.year - b.year);
  const text = items.map(
    (e) => `${e.year} ▲ ${e.name}｜${e.location}｜${e.cases.toLocaleString()} 例`
  );
  return (
    <div className="ticker-wrap relative h-7 overflow-hidden border-b border-[#1a2540] bg-[#070b14]">
      <div className="ticker-track flex h-7 items-center whitespace-nowrap font-mono text-[11px] text-[#fbbf24]">
        {[0, 1].map((k) => (
          <span key={k} className="px-4">
            {text.map((t, i) => (
              <span key={i} className="mx-6">
                {t}
                <span className="mx-4 text-[#1a2540]">◆</span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

interface SliderProps {
  min: number;
  max: number;
  year: number;
  onChange: (y: number) => void;
}

/** 底部年份滑块 + 自动播放 */
export function YearControl({ min, max, year, onChange }: SliderProps) {
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (playing) {
      timer.current = window.setInterval(() => {
        onChange(year >= max ? min : year + 1);
      }, 900);
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, year, min, max, onChange]);

  return (
    <div className="border-t border-[#1a2540] bg-[#0c1220] px-4 py-3">
      <div className="mx-auto flex max-w-4xl items-center gap-4">
        <button
          onClick={() => setPlaying((p) => !p)}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs transition-colors ${
            playing
              ? "border-[#f87171] text-[#f87171]"
              : "border-[#22d3ee] text-[#22d3ee] hover:bg-[#22d3ee22]"
          }`}
          title={playing ? "暂停" : "播放"}
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <input
          type="range"
          min={min}
          max={max}
          value={year}
          onChange={(e) => onChange(Number(e.target.value))}
          className="year-slider h-1 flex-1 cursor-pointer appearance-none rounded bg-[#1a2540]"
        />
        <div className="shrink-0 text-right">
          <div
            className="font-mono text-2xl font-bold leading-none text-[#22d3ee] tabular-nums"
            style={{ textShadow: "0 0 18px rgba(34,211,238,0.5)" }}
          >
            {year}
          </div>
          <div className="mt-1 font-mono text-[9px] tracking-[0.2em] text-[#5b7290]">
            YEAR {min}–{max}
          </div>
        </div>
      </div>
    </div>
  );
}

/** 重大疫情事件详情弹窗 */
export function EventModal({ event, onClose }: { event: OutbreakEvent; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-md border border-[#1a2540] bg-[#0c1220] shadow-[0_0_60px_rgba(248,113,113,0.15)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-l-[3px] border-[#f87171] px-4 py-3">
          <div className="font-mono text-[10px] tracking-[0.22em] text-[#f87171] uppercase">
            疫情事件 · {event.year}
          </div>
          <h3 className="mt-1 text-lg font-bold text-white">{event.name}</h3>
        </div>
        <div className="space-y-3 px-4 py-4">
          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            <div className="rounded border border-[#1a2540] bg-[#050810] p-2">
              <div className="text-[9px] tracking-widest text-[#5b7290]">地点</div>
              <div className="mt-1 text-[#c7d6ea]">{event.location}</div>
            </div>
            <div className="rounded border border-[#1a2540] bg-[#050810] p-2">
              <div className="text-[9px] tracking-widest text-[#5b7290]">报告病例</div>
              <div className="mt-1 font-bold text-[#fbbf24]">
                {event.cases.toLocaleString()} 例
              </div>
            </div>
          </div>
          <p className="text-[13px] leading-relaxed text-[#a9bdd6]">{event.detail}</p>
          <div className="flex items-center justify-between font-mono text-[10px] text-[#41566f]">
            <a
              href={event.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-dotted hover:text-[#22d3ee]"
            >
              来源：{event.source} ↗
            </a>
            <button
              onClick={onClose}
              className="rounded border border-[#1a2540] px-3 py-1 text-[#8fa8c8] hover:border-[#22d3ee] hover:text-[#22d3ee]"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
