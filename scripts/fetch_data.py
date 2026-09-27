#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据管线：从 WHO 全球卫生观测站 (GHO) OData API 拉取中国法定报告传染病历史数据，
结合文献记载的重大疫情事件（来源：WHO / 中国 CDC 周报），生成前端使用的 data.json。

用法:  python3 scripts/fetch_data.py
输出:  public/data.json
"""
import json
import os
import sys
import datetime
import requests

GHO = "https://ghoapi.azureedge.net/api"

DISEASES = [
    {"code": "WHS3_62", "id": "measles", "name": "麻疹", "en": "Measles",
     "kind": "reported_cases", "unit": "报告病例（例）",
     "desc": "由麻疹病毒引起的急性呼吸道传染病，传染性极强，曾是导致儿童死亡的主要传染病之一。随着计划免疫推广，中国报告病例数已大幅下降。",
     "category": "疫苗可预防疾病"},
    {"code": "WHS3_43", "id": "pertussis", "name": "百日咳", "en": "Pertussis",
     "kind": "reported_cases", "unit": "报告病例（例）",
     "desc": "由百日咳鲍特菌引起的急性呼吸道传染病，以阵发性痉挛性咳嗽为特征，婴幼儿重症风险高。",
     "category": "疫苗可预防疾病"},
    {"code": "WHS3_41", "id": "diphtheria", "name": "白喉", "en": "Diphtheria",
     "kind": "reported_cases", "unit": "报告病例（例）",
     "desc": "由白喉棒状杆菌引起的急性呼吸道传染病，可致呼吸道伪膜和心肌炎。中国在普及百白破疫苗后已接近消除。",
     "category": "疫苗可预防疾病"},
    {"code": "WHS3_46", "id": "tetanus", "name": "破伤风（合计）", "en": "Tetanus (total)",
     "kind": "reported_cases", "unit": "报告病例（例）",
     "desc": "由破伤风梭菌毒素引起的急性感染性疾病，以肌肉强直和痉挛为特征，病死率高。",
     "category": "疫苗可预防疾病"},
    {"code": "WHS3_56", "id": "ntetanus", "name": "新生儿破伤风", "en": "Neonatal tetanus",
     "kind": "reported_cases", "unit": "报告病例（例）",
     "desc": "新生儿经脐带感染破伤风梭菌所致。中国于 2012 年经 WHO 认证消除新生儿破伤风。",
     "category": "疫苗可预防疾病"},
    {"code": "WHS3_49", "id": "polio", "name": "脊髓灰质炎", "en": "Poliomyelitis",
     "kind": "reported_cases", "unit": "报告病例（例）",
     "desc": "由脊髓灰质炎病毒引起的急性传染病，可致弛缓性麻痹。中国 2000 年经 WHO 认证为无脊灰状态。",
     "category": "疫苗可预防疾病"},
    {"code": "WHS3_53", "id": "mumps", "name": "流行性腮腺炎", "en": "Mumps",
     "kind": "reported_cases", "unit": "报告病例（例）",
     "desc": "由腮腺炎病毒引起的急性呼吸道传染病，好发于儿童和青少年，可并发脑膜炎、睾丸炎。",
     "category": "疫苗可预防疾病"},
    {"code": "WHS3_57", "id": "rubella", "name": "风疹", "en": "Rubella",
     "kind": "reported_cases", "unit": "报告病例（例）",
     "desc": "由风疹病毒引起的急性呼吸道传染病，孕妇早期感染可致胎儿先天性风疹综合征。",
     "category": "疫苗可预防疾病"},
    {"code": "WHS3_55", "id": "crs", "name": "先天性风疹综合征", "en": "Congenital Rubella Syndrome",
     "kind": "reported_cases", "unit": "报告病例（例）",
     "desc": "孕妇妊娠早期感染风疹病毒导致胎儿出现先天性心脏病、白内障、耳聋等畸形。",
     "category": "疫苗可预防疾病"},
    {"code": "WHS3_42", "id": "je", "name": "流行性乙型脑炎", "en": "Japanese encephalitis",
     "kind": "reported_cases", "unit": "报告病例（例）",
     "desc": "由乙脑病毒经蚊虫传播的中枢神经系统急性传染病，病死率高、后遗症重，中国为历史高发区。",
     "category": "虫媒传染病"},
    {"code": "MALARIA_EST_CASES", "id": "malaria", "name": "疟疾（估计病例）", "en": "Malaria (estimated)",
     "kind": "estimated_cases", "unit": "估计病例（例）",
     "desc": "由疟原虫经按蚊传播的寄生虫病。中国从 20 世纪年发病数千万例降至 2021 年获 WHO 消除疟疾认证。该指标为 WHO 估计值。",
     "category": "虫媒传染病"},
    {"code": "NTD_RAB2", "id": "rabies", "name": "狂犬病（报告死亡）", "en": "Rabies (reported deaths)",
     "kind": "reported_deaths", "unit": "报告死亡（人）",
     "desc": "由狂犬病毒引起的人兽共患传染病，发病后病死率几乎 100%。中国长期为全球狂犬病死亡人数较多的国家之一。",
     "category": "人兽共患病"},
]

EVENTS = [
    {"year": 1988, "name": "上海甲型肝炎大流行", "location": "上海市", "lng": 121.47, "lat": 31.23,
     "cases": 310746, "disease": "甲型肝炎",
     "detail": "因食用受污染的毛蚶引发，1988 年 1–3 月报告约 31 万例，是甲肝史上最大规模暴发之一。",
     "source": "中国 CDC / 流行病学文献", "sourceUrl": "https://www.chinacdc.cn/"},
    {"year": 2003, "name": "SARS（传染性非典型肺炎）", "location": "广东省（首发）→ 北京市等", "lng": 113.26, "lat": 23.13,
     "cases": 5327, "disease": "SARS",
     "detail": "2002 年 11 月首发于广东，2003 年扩散至全国。中国大陆报告 5327 例、死亡 349 例（WHO 统计）。",
     "source": "WHO", "sourceUrl": "https://www.who.int/emergencies/disease-outbreak-news"},
    {"year": 2005, "name": "四川人感染猪链球菌病", "location": "四川省资阳市等地", "lng": 104.65, "lat": 30.12,
     "cases": 204, "disease": "猪链球菌病",
     "detail": "2005 年 6–8 月四川报告人感染猪链球菌病 204 例、死亡 38 例，为全球最大规模暴发。",
     "source": "WHO", "sourceUrl": "https://www.who.int/emergencies/disease-outbreak-news"},
    {"year": 2009, "name": "甲型 H1N1 流感大流行", "location": "全国（输入性病例扩散）", "lng": 116.40, "lat": 39.90,
     "cases": 121843, "disease": "甲型H1N1流感",
     "detail": "2009 年全球大流行，中国内地累计报告确诊病例超过 12 万例。",
     "source": "中国 CDC / WHO", "sourceUrl": "https://www.chinacdc.cn/"},
    {"year": 2013, "name": "人感染 H7N9 禽流感", "location": "上海、浙江、江苏（长三角）", "lng": 120.15, "lat": 30.27,
     "cases": 134, "disease": "H7N9禽流感",
     "detail": "2013 年 3 月全球首次报告人感染 H7N9，当年报告 134 例、死亡 45 例，病死率高。",
     "source": "WHO", "sourceUrl": "https://www.who.int/emergencies/disease-outbreak-news"},
    {"year": 2014, "name": "广东登革热大流行", "location": "广东省广州市等", "lng": 113.26, "lat": 23.13,
     "cases": 45236, "disease": "登革热",
     "detail": "2014 年广东报告登革热病例超 4.5 万例，为 1990 年以来最大规模本地流行。",
     "source": "中国 CDC 周报", "sourceUrl": "https://weekly.chinacdc.cn/"},
    {"year": 2019, "name": "内蒙古鼠疫散发病例", "location": "内蒙古自治区锡林郭勒盟", "lng": 116.08, "lat": 43.94,
     "cases": 5, "disease": "鼠疫",
     "detail": "2019 年内蒙古报告腺鼠疫及肺鼠疫散发病例，引发全国鼠疫防控关注。",
     "source": "中国 CDC", "sourceUrl": "https://www.chinacdc.cn/"},
    {"year": 2020, "name": "COVID-19 疫情", "location": "湖北省武汉市（首发报告地）", "lng": 114.30, "lat": 30.59,
     "cases": 86971, "disease": "COVID-19",
     "detail": "2019 年 12 月武汉报告不明原因肺炎。2020 年中国大陆报告确诊病例 86971 例、死亡 4634 例（WHO）。",
     "source": "WHO", "sourceUrl": "https://www.who.int/emergencies/disease-outbreak-news"},
]


def fetch_indicator(code: str) -> dict:
    url = f"{GHO}/{code}?$filter=SpatialDim eq 'CHN'&$select=TimeDim,NumericValue&$top=500"
    r = requests.get(url, timeout=90)
    r.raise_for_status()
    out = {}
    for row in r.json().get("value", []):
        if row.get("NumericValue") is not None:
            out[int(row["TimeDim"])] = int(round(row["NumericValue"]))
    return out


def main():
    diseases_out = []
    for d in DISEASES:
        print(f"fetching {d['id']} ({d['code']}) ...", flush=True)
        try:
            series = fetch_indicator(d["code"])
        except Exception as e:
            print(f"  FAILED: {e}", file=sys.stderr)
            series = {}
        years = sorted(series)
        print(f"  -> {len(years)} years", (f"{years[0]}-{years[-1]}" if years else ""))
        diseases_out.append({
            **{k: d[k] for k in ("id", "name", "en", "kind", "unit", "desc", "category")},
            "whoIndicator": d["code"],
            "series": {str(y): v for y, v in series.items()},
        })

    top_by_year = {}
    all_years = sorted({y for d in diseases_out for y in map(int, d["series"])})
    for y in all_years:
        items = []
        for d in diseases_out:
            v = d["series"].get(str(y))
            if v is not None:
                items.append({"diseaseId": d["id"], "name": d["name"], "value": v,
                              "kind": d["kind"], "unit": d["unit"]})
        items.sort(key=lambda x: -x["value"])
        top_by_year[str(y)] = items[:10]

    payload = {
        "meta": {
            "source": "WHO Global Health Observatory (GHO), https://www.who.int/data/gho",
            "eventsSource": "WHO / 中国疾病预防控制中心 公开通报",
            "generatedAt": datetime.datetime.now(datetime.UTC).isoformat(),
            "yearRange": [1970, max(all_years) if all_years else 2025],
            "note": ("1970–1973 年 WHO GHO 无中国疾病个案报告数据；1974 年起为 WHO 会员国官方报告数据。"
                     "疟疾为 WHO 估计值；狂犬病为报告死亡数。各年 Top10 在 WHO 可获取的 12 个病种内排序。"),
        },
        "diseases": diseases_out,
        "topByYear": top_by_year,
        "events": EVENTS,
    }
    out_path = os.path.join(os.path.dirname(__file__), "..", "public", "data.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=1)
    print(f"\nwrote {out_path}")


if __name__ == "__main__":
    main()
