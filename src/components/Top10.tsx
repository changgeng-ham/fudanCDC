import type { TopItem } from "@/types";
import { fmt } from "@/types";

interface Props {
  items: TopItem[];
  year: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const RANK_COLORS = [
  "#f87171", "#fb923c", "#fbbf24", "#facc15", "#a3e635",
  "#34d399", "#22d3ee", "#60a5fa", "#818cf8", "#a78bfa",
];

/** 年度 Top10 排行榜（横向条形，带位次与数值动画） */
export default function Top10({ items, year, selectedId, onSelect }: Props) {
  const max = items[0]?.value ?? 1;
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between border-b border-[#1a2540] px-4 py-3">
        <h2 className="font-mono text-[11px] tracking-[0.22em] text-[#22d3ee] uppercase">
          Top 10 · {year}
        </h2>
        <span className="font-mono text-[10px] text-[#5b7290]">WHO GHO</span>
      </div>
      {items.length === 0 ? (
        <div className="m-4 flex flex-1 items-center justify-center rounded border border-dashed border-[#1a2540] p-6 text-center">
          <p className="font-mono text-xs leading-relaxed text-[#5b7290]">
            {year} 年暂无数据
            <br />
            WHO GHO 中国个案报告数据自 1974 年起
          </p>
        </div>
      ) : (
        <div className="flex-1 space-y-[3px] overflow-y-auto p-3">
          {items.map((it, i) => {
            const pct = Math.max(2.5, (it.value / max) * 100);
            const active = selectedId === it.diseaseId;
            return (
              <button
                key={it.diseaseId}
                onClick={() => onSelect(it.diseaseId)}
                className={`group relative block w-full rounded-sm px-2 py-[7px] text-left transition-colors duration-150 ${
                  active ? "bg-[#16233c]" : "hover:bg-[#111a2b]"
                }`}
              >
                <span
                  className="absolute inset-y-[3px] left-1 rounded-[2px] opacity-[0.14] transition-all duration-700 ease-out"
                  style={{ width: `${pct}%`, background: RANK_COLORS[i] }}
                />
                <span className="relative flex items-center gap-2">
                  <span
                    className="w-5 shrink-0 text-right font-mono text-[11px] font-bold"
                    style={{ color: RANK_COLORS[i] }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`min-w-0 flex-1 truncate text-[13px] ${
                      active ? "text-white" : "text-[#c7d6ea]"
                    }`}
                  >
                    {it.name}
                    {it.kind !== "reported_cases" && (
                      <span className="ml-1 font-mono text-[9px] text-[#5b7290]">
                        {it.kind === "estimated_cases" ? "估" : "亡"}
                      </span>
                    )}
                  </span>
                  <span
                    className="shrink-0 font-mono text-[12px] font-semibold tabular-nums"
                    style={{ color: RANK_COLORS[i] }}
                  >
                    {fmt(it.value)}
                  </span>
                </span>
              </button>
            );
          })}
          <p className="px-2 pt-2 font-mono text-[10px] leading-relaxed text-[#41566f]">
            注：「估」为 WHO 估计病例，「亡」为报告死亡数；排序在 WHO 可获取病种内进行。点击查看病种详情。
          </p>
        </div>
      )}
    </div>
  );
}
