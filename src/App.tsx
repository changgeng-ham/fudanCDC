import { useEffect, useMemo, useState } from "react";
import type { Dataset, OutbreakEvent } from "@/types";
import ChinaMap from "@/components/ChinaMap";
import Top10 from "@/components/Top10";
import DiseasePanel from "@/components/DiseasePanel";
import { Ticker, YearControl, EventModal } from "@/components/Chrome";
import { fmt } from "@/types";

export default function App() {
  const [data, setData] = useState<Dataset | null>(null);
  const [geo, setGeo] = useState<unknown>(null);
  const [year, setYear] = useState(2024);
  const [diseaseId, setDiseaseId] = useState<string | null>(null);
  const [event, setEvent] = useState<OutbreakEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("data.json").then((r) => {
        if (!r.ok) throw new Error("data.json");
        return r.json();
      }),
      fetch("china.json").then((r) => {
        if (!r.ok) throw new Error("china.json");
        return r.json();
      }),
    ])
      .then(([d, g]) => {
        setData(d);
        setGeo(g);
      })
      .catch((e) => setError(String(e)));
  }, []);

  const top = useMemo(() => data?.topByYear[String(year)] ?? [], [data, year]);
  const disease = useMemo(
    () => data?.diseases.find((d) => d.id === diseaseId) ?? null,
    [data, diseaseId]
  );
  const totalYear = top.reduce((s, t) => s + t.value, 0);

  if (error)
    return (
      <div className="flex h-screen items-center justify-center bg-[#050810] font-mono text-sm text-[#f87171]">
        数据加载失败：{error}
      </div>
    );
  if (!data || !geo)
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-[#050810]">
        <div className="h-3 w-3 animate-ping rounded-full bg-[#22d3ee]" />
        <p className="font-mono text-xs tracking-[0.3em] text-[#5b7290]">
          正在接入 WHO GHO 数据…
        </p>
      </div>
    );

  const [yMin, yMax] = data.meta.yearRange;

  return (
    <div className="scanlines flex h-screen flex-col bg-[#050810] text-[#dbe6f5]">
      {/* 头部 */}
      <header className="flex items-center justify-between border-b border-[#1a2540] bg-[#0c1220] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[#22d3ee]">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[#22d3ee]" />
            <div className="absolute inset-0 animate-[spin_4.2s_linear_infinite] rounded-full border-t border-[#22d3ee66]" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-white md:text-base">
              中国流行病监测台{" "}
              <span className="font-mono text-[10px] font-normal text-[#5b7290]">
                CHINA EPIDEMIC SURVEILLANCE
              </span>
            </h1>
            <p className="font-mono text-[9px] tracking-[0.28em] text-[#5b7290] uppercase">
              1970–{yMax} · WHO Global Health Observatory
            </p>
          </div>
        </div>
        <div className="hidden items-center gap-2 font-mono text-[10px] text-[#34d399] md:flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#34d399]" />
          DATA LINKED · {data.meta.generatedAt.slice(0, 10)}
        </div>
      </header>

      <Ticker events={data.events} />

      {/* 主体三栏 */}
      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* 左：病种目录 */}
        <aside className="order-2 flex max-h-56 w-full flex-col border-t border-[#1a2540] bg-[#0c1220] lg:order-1 lg:max-h-none lg:w-[260px] lg:border-r lg:border-t-0">
          <div className="border-b border-[#1a2540] px-4 py-3">
            <h2 className="font-mono text-[11px] tracking-[0.22em] text-[#22d3ee] uppercase">
              监测病种目录
            </h2>
            <p className="mt-1 font-mono text-[10px] text-[#5b7290]">
              {data.diseases.length} 个 WHO 指标
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {data.diseases.map((d) => {
              const ys = Object.keys(d.series).map(Number).sort((a, b) => a - b);
              const active = diseaseId === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setDiseaseId(active ? null : d.id)}
                  className={`group mb-[2px] flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left transition-colors ${
                    active ? "bg-[#16233c]" : "hover:bg-[#111a2b]"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      active
                        ? "bg-[#22d3ee] shadow-[0_0_6px_#22d3ee]"
                        : "bg-[#1a2540] group-hover:bg-[#5b7290]"
                    }`}
                  />
                  <span
                    className={`min-w-0 flex-1 truncate text-[12.5px] ${
                      active ? "text-white" : "text-[#c7d6ea]"
                    }`}
                  >
                    {d.name}
                  </span>
                  <span className="shrink-0 font-mono text-[9px] text-[#41566f]">
                    {ys.length ? `${ys[0]}–${ys[ys.length - 1]}` : "—"}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="border-t border-[#1a2540] px-4 py-2 font-mono text-[10px] leading-relaxed text-[#41566f]">
            {year} 年合计（目录内病种）
            <div className="text-base font-bold text-[#fbbf24]">
              {top.length ? fmt(totalYear) : "—"}
            </div>
          </div>
        </aside>

        {/* 中：地图 */}
        <section className="relative order-1 min-h-[42vh] flex-1 lg:order-2 lg:min-h-0">
          <ChinaMap geoJson={geo} events={data.events} year={year} onSelectEvent={setEvent} />
          <div className="pointer-events-none absolute left-3 top-3 rounded border border-[#1a2540] bg-[#050810cc] px-3 py-2 backdrop-blur">
            <div className="font-mono text-[9px] tracking-[0.22em] text-[#5b7290] uppercase">
              重大疫情事件分布
            </div>
            <div className="mt-1 flex items-center gap-3 font-mono text-[10px]">
              <span className="flex items-center gap-1 text-[#f87171]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#f87171]" />
                历史事件
              </span>
              <span className="flex items-center gap-1 text-[#fbbf24]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#fbbf24]" />
                {year} 当年
              </span>
            </div>
          </div>
          {disease && (
            <DiseasePanel disease={disease} year={year} onClose={() => setDiseaseId(null)} />
          )}
        </section>

        {/* 右：Top10 */}
        <aside className="order-3 flex max-h-[38vh] w-full flex-col border-t border-[#1a2540] bg-[#0c1220] lg:max-h-none lg:w-[340px] lg:border-l lg:border-t-0">
          <Top10
            items={top}
            year={year}
            selectedId={diseaseId}
            onSelect={(id) => setDiseaseId(id === diseaseId ? null : id)}
          />
        </aside>
      </main>

      <YearControl min={yMin} max={yMax} year={year} onChange={setYear} />

      <footer className="border-t border-[#1a2540] bg-[#070b14] px-4 py-2 text-center font-mono text-[9.5px] leading-relaxed text-[#41566f]">
        {data.meta.note} 数据来源：
        <a
          className="underline decoration-dotted hover:text-[#22d3ee]"
          href="https://www.who.int/data/gho"
          target="_blank"
          rel="noreferrer"
        >
          WHO GHO
        </a>{" "}
        ·{" "}
        <a
          className="underline decoration-dotted hover:text-[#22d3ee]"
          href="https://www.chinacdc.cn/"
          target="_blank"
          rel="noreferrer"
        >
          中国 CDC
        </a>{" "}
        ｜仅供科研与教学参考
      </footer>

      {event && <EventModal event={event} onClose={() => setEvent(null)} />}
    </div>
  );
}
