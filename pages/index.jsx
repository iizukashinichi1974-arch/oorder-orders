import { useState, useEffect, useRef } from "react";
import { Plus, Minus, X, Package, AlertTriangle, Loader2, ChevronDown, Pencil, Check, Mail } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const STORES = ["VAN", "ガモウ", "ダリア", "YAY", "ハーツ"];

const CATEGORIES = [
  { key: "color", label: "カラー材", accent: "#9D3B4A", light: "#F7E9EB" },
  { key: "developer", label: "2液（酸化剤）", accent: "#3B6B8C", light: "#E9F0F5" },
  { key: "perm", label: "パーマ液", accent: "#7A5C99", light: "#F0EAF5" },
  { key: "straight", label: "縮毛矯正剤", accent: "#4A7259", light: "#E8F1EE" },
  { key: "manicure", label: "ヘアマニキュア", accent: "#B5763D", light: "#F7EDE0" },
  { key: "shampoo", label: "シャンプー", accent: "#C97AA0", light: "#F9EEF3" },
  { key: "treatment", label: "トリートメント", accent: "#A88B3D", light: "#F5F0E0" },
  { key: "other", label: "その他消耗品", accent: "#7D7D7D", light: "#EEEEEE" },
  { key: "conditioner", label: "コンディショナー", accent: "#D68CAE", light: "#FBF0F5" },
  { key: "haircare", label: "ヘアケア", accent: "#B5678F", light: "#F7EAF0" },
  { key: "digitalperm", label: "デジタルパーマ", accent: "#6B5CA5", light: "#EFEDF8" },
  { key: "processing", label: "処理剤", accent: "#3F7A6E", light: "#E7F2EF" },
];

const SUPPLIERS = ["VAN", "ガモウ", "ダリア", "YAY", "ハーツ"];

const SUPPLIER_CATEGORY_KEYS = {
  YAY: ["shampoo", "conditioner", "haircare"],
  ハーツ: ["straight", "digitalperm", "processing"],
};

function categoriesForSupplier(sup) {
  const allowed = SUPPLIER_CATEGORY_KEYS[sup];
  if (!allowed) return CATEGORIES;
  return CATEGORIES.filter((c) => allowed.includes(c.key));
}

const SUPPLIER_MAP = {
  hoyu: "VAN",
  LEBEL: "VAN",
  ソマルカ: "VAN",
  資生堂: "VAN",
  華凛: "VAN",
  "Dr.HEAT": "VAN",
  サンコール: "VAN",
  消耗品: "VAN",
  クロス: "VAN",
  ナプラ: "VAN",
  MILBON: "VAN",
  WELLA: "ガモウ",
  オラプレックス: "ガモウ",
  ARIMINO: "ダリア",
  YAY: "YAY",
  ナインヤーズ: "YAY",
  ハーツ: "ハーツ",
};

function supplierForMaker(maker) {
  return SUPPLIER_MAP[maker] || "VAN";
}

const SERIES_DISPLAY_LABELS = {
  ジーニアス: "ジーニアス1剤",
  アイスタイル: "アイスタイル1剤",
};

function cat(makers, items) {
  return { makers, items };
}
function mk(name, types) {
  return { name, types: types || [] };
}
function it(id, maker, type, name, stock, par, unit, color, price, used, usage) {
  return {
    id,
    maker,
    type: type || "",
    name,
    stock,
    par,
    unit,
    color: color || "",
    price: price || 0,
    used: used || 0,
    usage: usage || "業務",
  };
}
function emptyCategory() {
  return { makers: [], items: [] };
}
function emptyStore() {
  const s = { orderHistory: [], colorHistory: [] };
  for (const c of CATEGORIES) s[c.key] = emptyCategory();
  return s;
}

function makeSeriesItems(maker, seriesMap, prefix) {
  const items = [];
  let n = 0;
  for (const [series, codes] of Object.entries(seriesMap)) {
    for (const code of codes) {
      n++;
      items.push(it(`${prefix}${n}`, maker, series, code, 0, 0, "本"));
    }
  }
  return items;
}

const HOYU_COLOR_SERIES = {
  プロマスター: [
    "N-10/12", "N-10/10", "N-9/8", "N-8/7", "N-7/6", "N-6/5", "N-5/4", "N-4/3", "N-3/2", "N-2/1",
    "MT-10/12", "MT-10/10", "MT-9/8", "MT-8/7", "MT-7/6", "MT-6/5", "MT-5/4",
    "M-9/9", "M-8/7", "M-7/6", "M-6/5",
    "R-9/8", "R-8/7", "R-7/6", "R-6/5", "R-10/12",
    "C-10/12", "C-10/10", "C-9/9", "C-8/8", "C-7/7", "C-6/5",
    "A-9/8", "A-8/7", "A-7/6", "A-6/5",
    "V-8/7", "V-7/6", "V-6/5",
    "E BR6", "E BR-4", "E MV-8", "E CP-9", "E CR-7", "E CW-10", "E NA-3",
    "B BL-6", "B GB-6", "B OR-7", "B RD-6",
    "AO-8", "RR-7", "EG-6", "CB-5", "SV6",
    "LT", "LT/SH",
  ],
  ピグメント: [
    "N-8P", "N-7P", "N-6P", "N-4P",
    "MT-9P", "MT-8P", "MT-7P", "MT-6P", "MT-5P",
    "M-8P", "M-7P", "M-6P",
    "A-9P", "A-8P", "A-7P", "A-6P",
    "V-9P", "V-8P", "V-7P", "V-6P",
    "E BR6P", "E BR-4P", "E CP-9P", "E CR-7P", "E NA-3P",
    "CB-5P", "SV6P", "CL",
  ],
  プロマスタートナーオン: ["MT-T9", "A-T7"],
  アプリエ: [
    "PA-11", "PA-13", "PA-15",
    "BA-11", "BA-13", "BA-15",
    "OG-11", "OG-13", "OG-15",
    "LA-11", "LA-13", "LA-15",
    "MB-11", "MB-13", "MB-15",
    "SG-11", "SG-13", "SG-15",
    "BP-11", "BP-13", "BP-15",
    "BLUE", "GREEN", "VIOLET", "ORANGE", "L/T",
    "ACケアージュ", "PCパウダー",
  ],
  PMアプリエミドル: ["BA9", "BA7", "BA6", "LA9", "LA7", "LA6", "MC9", "MC7", "MC6", "BE9", "BE7", "BE5", "MA9", "MA7", "MA6"],
  PMアプリエグロー: [
    "CO G8", "CO G9", "CO G10", "CO G11",
    "SM A8", "SM A9", "SM A10", "SM A11", "SM G9", "SM G11",
    "NA G10", "SO L9", "SO L11",
  ],
};

const ORDEVE_SERIES = {
  "オルディーブ シーディル": [
    "s8-HG", "s7-HG", "s6-HG", "s5-HG",
    "s8-OK", "s7-OK", "s6-OK", "s5-OK",
    "s8-PA", "s7-PA", "s6-PA", "s5-PA",
  ],
  "オルディーブ クリスタル": [
    "C3-NB", "C5-NB", "C6-NB", "C8-NB",
    "C7-GgB", "C8-GgB", "C9-GgB", "C11-GgB",
    "C6-CB",
    "C7-15", "C8-15", "C9-15", "C11-15",
    "C7-20", "C8-20", "C9-20", "C11-20",
    "C7-35", "C8-35", "C9-35", "C11-35",
    "C7-55", "C8-55", "C9-55", "C11-55",
  ],
};

const HAIRIN_SERIES = {
  ジーニアス: ["CA1", "TG3", "TG5", "TG7", "TG0EX", "CA6", "CY4", "CA0", "AC"],
  アイスタイル: ["CA-0", "CA-70", "C10"],
};

const NAPLA_ACID_SERIES = {
  "N.アシッドカラー": [
    "RD04", "OR02", "NB11", "WR06", "LB13", "DB12", "WB17",
    "RB16", "AB20", "BB19", "PT24", "BK23", "CL26", "DL25",
  ],
};

const EDOL_SERIES = {
  エドル: ["FP-7", "FP-9", "LT-EX", "P-7", "P-9", "MA(マゼンタ)"],
};

const DEFAULT_DATA = {
  VAN: {
    orderHistory: [],
    colorHistory: [],
    color: cat(
      [
        mk("MILBON", Object.keys(ORDEVE_SERIES)),
        mk("LEBEL", Object.keys(EDOL_SERIES)),
        mk("hoyu", [...Object.keys(HOYU_COLOR_SERIES), "ブリーチ"]),
        mk("ソマルカ", []),
        mk("資生堂", []),
      ],
      [
        ...makeSeriesItems("MILBON", ORDEVE_SERIES, "ml").map((i) => ({ ...i, price: 488 })),
        it("mlnoguE", "MILBON", "", "エノグ オフブラック", 0, 0, "本", "", 525),
        ...makeSeriesItems("LEBEL", EDOL_SERIES, "mb").map((i) => ({ ...i, price: 700 })),
        ...makeSeriesItems("hoyu", HOYU_COLOR_SERIES, "hy").map((i) => ({
          ...i,
          price: i.name === "PCパウダー" ? 3150 : 525,
        })),
        it("so5", "ソマルカ", "", "スウィートミルクティー", 0, 0, "本", "", 1200),
        it("so7", "ソマルカ", "", "シアン", 0, 0, "本", "", 1600),
        it("so8", "ソマルカ", "", "ロイヤルブルー", 0, 0, "本", "", 1600),
        it("so9", "ソマルカ", "", "ブリリアントイエロー", 0, 0, "本", "", 1600),
        it("so10", "ソマルカ", "", "マンダリンオレンジ", 0, 0, "本", "", 1600),
        it("so11", "ソマルカ", "", "ミントグリーン", 0, 0, "本", "", 1600),
        it("so12", "ソマルカ", "", "アネモネパープル", 0, 0, "本", "", 1600),
        it("so13", "ソマルカ", "", "シュガーピンク", 0, 0, "本", "", 1600),
        it("so14", "ソマルカ", "", "キャンディーピンク", 0, 0, "本", "", 1600),
        it("so15", "ソマルカ", "", "ネオンライム", 0, 0, "本", "", 1600),
        it("so16", "ソマルカ", "", "ピュアレッド", 0, 0, "本", "", 1600),
        it("so6", "ソマルカ", "", "ジェリーメディウム", 0, 0, "本", "", 1875),
        it("hy_ngray", "hoyu", "", "白髪ぼかし ナチュラルグレー", 0, 0, "本", "", 700),
        it("hy_bleach", "hoyu", "ブリーチ", "プロマスターパワーブリーチ", 0, 0, "本", "", 2625),
        it("hy_bleach2", "hoyu", "ブリーチ", "クオルシアブリーチ", 0, 0, "本", "", 2800),
        it("sd1", "資生堂", "", "カラーミューズ カラークリーム ブルー 240g", 0, 0, "本", "", 2200),
        it("sd2", "資生堂", "", "カラーミューズ カラークリーム イエロー 240g", 0, 0, "本", "", 2200),
        it("sd3", "資生堂", "", "カラーミューズ カラークリーム レッド 240g", 0, 0, "本", "", 2200),
        it("sd4", "資生堂", "", "カラーミューズ カラークリーム ピンク 240g", 0, 0, "本", "", 2200),
        it("sd5", "資生堂", "", "カラーミューズ カラークリーム ヴァイオレット 240g", 0, 0, "本", "", 2200),
      ]
    ),
    developer: cat(
      [mk("MILBON", []), mk("hoyu", [])],
      [
        it("d2", "MILBON", "", "2液クリスタル6%", 1, 4, "本", "", 900),
        it("d5", "MILBON", "", "OX6%", 0, 0, "本", "", 900),
        it("d3", "hoyu", "", "オキシ6%", 0, 0, "本", "", 900),
        it("d4", "hoyu", "", "オキシ2%", 0, 0, "本", "", 900),
      ]
    ),
    perm: emptyCategory(),
    straight: cat(
      [mk("華凛", [...Object.keys(HAIRIN_SERIES), "2剤"]), mk("ケラフェクト", ["1剤", "2剤"])],
      [
        ...makeSeriesItems("華凛", HAIRIN_SERIES, "kr").map((i) => {
          const prices = {
            CA1: 1950,
            TG3: 1950,
            TG5: 1950,
            TG7: 1850,
            TG0EX: 1850,
            CA6: 1950,
            CY4: 2800,
            CA0: 1950,
            C10: 1600,
          };
          return { ...i, price: prices[i.name] || 0, stock: 2, par: 2 };
        }),
        it("kr100", "華凛", "2剤", "リキッド2剤 2L", 2, 2, "本", "", 3800),
        it("kr101", "華凛", "2剤", "クリーム2剤 2kg", 2, 2, "本", "", 5400),
        it("kf8", "ケラフェクト", "1剤", "ケラフェクト8", 2, 2, "本", "", 6120),
        it("kf65", "ケラフェクト", "1剤", "ケラフェクト6.5", 2, 2, "本", "", 6120),
        it("kf55", "ケラフェクト", "1剤", "ケラフェクト5.5", 2, 2, "本", "", 6120),
        it("kf45", "ケラフェクト", "1剤", "ケラフェクト4.5", 2, 2, "本", "", 6120),
        it("kf0", "ケラフェクト", "1剤", "ケラフェクト0", 2, 2, "本", "", 4500),
        it("kf2zai", "ケラフェクト", "2剤", "ケラフェクト2剤", 2, 2, "本", "", 3420),
        it("kfgconk", "ケラフェクト", "1剤", "ケラフェクトG-コンク", 2, 2, "本", "", 4950),
      ]
    ),
    manicure: cat(
      [mk("ナプラ", Object.keys(NAPLA_ACID_SERIES))],
      [
        ...makeSeriesItems("ナプラ", NAPLA_ACID_SERIES, "np").map((i) => ({ ...i, price: 950 })),
      ]
    ),
    shampoo: cat(
      [mk("LEBEL", []), mk("ソマルカ", [])],
      [
        it("s2", "LEBEL", "", "エドルクレンジングシャンプー", 0, 0, "本", "", 2100),
        it("so1", "ソマルカ", "", "カラーシャンプー ホワイトベージュ", 0, 0, "本", "", 1170),
        it("so2", "ソマルカ", "", "カラーシャンプー パープル", 0, 0, "本", "", 1170),
        it("so3", "ソマルカ", "", "カラーシャンプー ピンク", 0, 0, "本", "", 1170),
        it("so4", "ソマルカ", "", "カラーシャンプー ミルクティベージュ", 0, 0, "本", "", 1170),
      ]
    ),
    treatment: cat(
      [mk("サンコール", []), mk("MILBON", []), mk("Dr.HEAT", [])],
      [
        it("t3", "サンコール", "", "フェルエ ヘミング 800mlリフィル", 0, 0, "本", "", 3900),
        it("t4", "サンコール", "", "フェルエ キューティクルコート 250g", 0, 0, "本", "", 1800),
        it("t5", "サンコール", "", "フェルエ デオバッファー 800", 0, 0, "本", "", 3900),
        it("t6", "MILBON", "", "ネオリシオ ヒートプロテクター 400ml", 0, 0, "本", "", 2400),
        it("t7", "MILBON", "", "ミルボンカラーリムーバー 250ml", 0, 0, "本", "", 1980),
        it("t8", "Dr.HEAT", "", "D-GLT 500ml", 0, 0, "本", "", 10000),
      ]
    ),
    other: cat(
      [mk("hoyu", ["エトラス", "ナイン", "レセ"]), mk("消耗品", []), mk("クロス", [])],
      [
        it("ov2", "hoyu", "エトラス", "グリックス 100g", 0, 0, "本", "", 1024),
        it("ov3", "hoyu", "エトラス", "グレイスオイル 80ml", 0, 0, "本", "", 1170),
        it("ov4", "hoyu", "ナイン", "ルーセントスプレー5 50g", 0, 0, "本", "", 585),
        it("ov5", "hoyu", "ナイン", "ルーセントスプレー5 180g", 0, 0, "本", "", 1100),
        it("ov6", "hoyu", "ナイン", "ルーセントスプレー9 50g", 0, 0, "本", "", 585),
        it("ov7", "hoyu", "ナイン", "ルーセントスプレー9 180g", 0, 0, "本", "", 1110),
        it("ov8", "hoyu", "レセ", "ソーダベースメイク", 0, 0, "本", "", 1125),
        it("ov9", "消耗品", "", "イヤーキャップ(黒)", 0, 0, "本", "", 1000),
        it("ov10", "消耗品", "", "ネックシャッター", 0, 0, "本", "", 1200),
        it("ov11", "消耗品", "", "ダックカール", 0, 0, "本", "", 3060),
        it("ov12", "消耗品", "", "フラスコミニ(小)", 0, 0, "本", "", 490),
        it("ov13", "消耗品", "", "サボニーズ 保護ジェル", 0, 0, "本", "", 2400),
        it("ov14", "消耗品", "", "サボニーズ 保護クリーム", 0, 0, "本", "", 3400),
        it("ov15", "消耗品", "", "ダイドーペーパー L+", 0, 0, "本", "", 355),
        it("ov16", "消耗品", "", "PCターバンレギュラー", 0, 0, "本", "", 1950),
        it("ov17", "消耗品", "", "ロールコットン 3巻(白)", 0, 0, "本", "", 1750),
        it("ov18", "消耗品", "", "ハイライトペーパー S", 0, 0, "本", "", 1000),
        it("ov19", "消耗品", "", "ハイライトペーパー M", 0, 0, "本", "", 1330),
        it("ov20", "消耗品", "", "アイビルエコホイル シルバー", 0, 0, "本", "", 1520),
        it("ov21", "消耗品", "", "オカモトブラックグローブ S", 0, 0, "本", "", 3400),
        it("ov22", "消耗品", "", "オカモトブラックグローブ M", 0, 0, "本", "", 3400),
        it("ov23", "消耗品", "", "ウエラフェイスガーゼ", 0, 0, "本", "", 800),
        it("ov24", "消耗品", "", "ビューティバンド #16 黄", 0, 0, "本", "", 342),
        it("ov25", "消耗品", "", "東京チャーム NO.5", 0, 0, "本", "", 4970),
        it("ov26", "消耗品", "", "炭酸タブレット ナチュラル(N)", 0, 0, "本", "", 6000),
        it("ov27", "消耗品", "", "炭酸タブレット フラット(b)", 0, 0, "本", "", 6000),
        it("ov28", "消耗品", "", "炭酸タブレット シャープ(#)", 0, 0, "本", "", 6000),
        it("ov29", "消耗品", "", "魔法の液体", 0, 0, "本", "", 1980),
        it("ov30", "消耗品", "", "アロマオイル(レモン)", 0, 0, "本", "", 840),
        it("ov31", "消耗品", "", "ロイヤルタッチ", 0, 0, "本", "", 1450),
        it("ov32", "消耗品", "", "No205 ウルトラケープホワイト", 0, 0, "本", "", 800),
        it("ov33", "消耗品", "", "フローラビューティーバンド16", 0, 0, "本", "", 690),
        it("ov34", "消耗品", "", "ニゼルミラーフィルター 180g", 0, 0, "本", "", 1430),
        it("ov35", "消耗品", "", "エアリーフィルター 180g", 0, 0, "本", "", 1430),
        it("ov36", "消耗品", "", "シルクラティックスグローブ", 0, 0, "本", "", 1000),
        it("ov37", "消耗品", "", "タニーチューブシボリ", 0, 0, "本", "", 2100),
        it("ov38", "消耗品", "", "NBAA ナチュラルグロス", 0, 0, "本", "", 1260),
        it("ov39", "消耗品", "", "NBAA スムージングロス", 0, 0, "本", "", 1260),
        it("ov40", "クロス", "", "ワコ-3100B シワシワルック ホワイト", 0, 0, "本", "", 3040),
        it("ov41", "クロス", "", "ワコ NO.3170 Eガードドレス ホワイト", 0, 0, "本", "", 3360),
        it("ov42", "クロス", "", "カトレア NO.8000 ヘアダイクロス", 0, 0, "本", "", 3840),
        it("ov43", "クロス", "", "デオドラントケープ特注", 0, 0, "本", "", 2800),
      ]
    ),
  },
  ダリア: {
    orderHistory: [],
    colorHistory: [],
    manualMonthly: [],
    color: emptyCategory(),
    developer: emptyCategory(),
    perm: emptyCategory(),
    straight: emptyCategory(),
    manicure: emptyCategory(),
    shampoo: emptyCategory(),
    treatment: emptyCategory(),
    other: emptyCategory(),
  },
  ガモウ: {
    orderHistory: [],
    colorHistory: [],
    manualMonthly: [],
    color: emptyCategory(),
    developer: emptyCategory(),
    perm: emptyCategory(),
    straight: cat([mk("WELLA", [])], []),
    manicure: emptyCategory(),
    shampoo: emptyCategory(),
    treatment: cat([mk("オラプレックス", [])], []),
    other: emptyCategory(),
  },
  YAY: {
    orderHistory: [],
    colorHistory: [],
    color: emptyCategory(),
    developer: emptyCategory(),
    perm: emptyCategory(),
    straight: emptyCategory(),
    manicure: emptyCategory(),
    shampoo: cat(
      [mk("YAY", ["ボタニカルケア", "ダメージケア"])],
      [
        it("yay_sh1", "YAY", "ボタニカルケア", "ボタニカルケアシャンプー 300ml", 0, 0, "本", "", 1509, 0, "店販"),
        it("yay_sh2", "YAY", "ボタニカルケア", "ボタニカルケアシャンプー 500ml", 0, 0, "本", "", 1830, 0, "店販"),
        it("yay_sh3", "YAY", "ボタニカルケア", "ボタニカルケアシャンプー 業務用1000ml", 0, 0, "本", "", 3440, 0, "業務"),
        it("yay_sh4", "YAY", "ダメージケア", "ダメージケアシャンプー 300ml", 0, 0, "本", "", 1569, 0, "店販"),
        it("yay_sh5", "YAY", "ダメージケア", "ダメージケアシャンプー 500ml", 0, 0, "本", "", 1940, 0, "店販"),
        it("yay_sh6", "YAY", "ダメージケア", "ダメージケアシャンプー 業務用1000ml", 0, 0, "本", "", 3640, 0, "業務"),
      ]
    ),
    treatment: emptyCategory(),
    other: emptyCategory(),
    conditioner: cat(
      [mk("YAY", ["ボタニカルケア", "ダメージケア"])],
      [
        it("yay_co1", "YAY", "ボタニカルケア", "ボタニカルケアコンディショナー 300ml", 0, 0, "本", "", 1479, 0, "店販"),
        it("yay_co2", "YAY", "ボタニカルケア", "ボタニカルケアコンディショナー 500ml", 0, 0, "本", "", 1780, 0, "店販"),
        it("yay_co3", "YAY", "ボタニカルケア", "ボタニカルケアコンディショナー 業務用1000ml", 0, 0, "本", "", 3260, 0, "業務"),
        it("yay_co4", "YAY", "ダメージケア", "ダメージコンディショナー 300ml", 0, 0, "本", "", 1479, 0, "店販"),
        it("yay_co5", "YAY", "ダメージケア", "ダメージコンディショナー 500ml", 0, 0, "本", "", 1780, 0, "店販"),
        it("yay_co6", "YAY", "ダメージケア", "ダメージコンディショナー 業務用1000ml", 0, 0, "本", "", 3260, 0, "業務"),
      ]
    ),
    haircare: cat(
      [mk("YAY", []), mk("ナインヤーズ", [])],
      [
        it("yay_hc1", "YAY", "", "クリーム", 0, 0, "本", "", 1324, 0, "店販"),
        it("yay_hc2", "YAY", "", "ワックス", 0, 0, "本", "", 986, 0, "店販"),
        it("yay_hc3", "YAY", "", "ジェルオイル", 0, 0, "本", "", 1006, 0, "店販"),
        it("yay_hc4", "YAY", "", "ユースオイル", 0, 0, "本", "", 1326, 0, "店販"),
        it("yay_hc5", "YAY", "", "アンドミー", 0, 0, "本", "", 1008, 0, "店販"),
        it("yay_ny1", "ナインヤーズ", "", "cynトリートメント", 0, 0, "本", "", 10000, 0, "店販"),
        it("yay_ny2", "ナインヤーズ", "", "ベースウォーター", 0, 0, "本", "", 1670, 0, "店販"),
        it("yay_ny3", "ナインヤーズ", "", "yard(大)", 0, 0, "本", "", 1002.5, 0, "店販"),
        it("yay_ny4", "ナインヤーズ", "", "yard(小)", 0, 0, "本", "", 652.3, 0, "店販"),
      ]
    ),
  },
  ハーツ: {
    orderHistory: [],
    colorHistory: [],
    manualMonthly: [],
    color: emptyCategory(),
    developer: emptyCategory(),
    perm: emptyCategory(),
    straight: cat(
      [mk("ハーツ", [])],
      [
        it("hz_s1", "ハーツ", "", "ハーツH", 0, 0, "本", "", 2640),
        it("hz_s2", "ハーツ", "", "ハーツM", 0, 0, "本", "", 5830),
        it("hz_s3", "ハーツ", "", "ハーツB", 0, 0, "本", "", 5830),
        it("hz_s4", "ハーツ", "", "ハーツS", 0, 0, "本", "", 5720),
        it("hz_s5", "ハーツ", "", "ハーツG80", 0, 0, "本", "", 6930),
      ]
    ),
    manicure: emptyCategory(),
    shampoo: emptyCategory(),
    treatment: emptyCategory(),
    other: emptyCategory(),
    conditioner: emptyCategory(),
    haircare: emptyCategory(),
    digitalperm: cat(
      [mk("ハーツ", [])],
      [
        it("hz_d1", "ハーツ", "", "ハーツJ9", 0, 0, "本", "", 5720),
        it("hz_d2", "ハーツ", "", "ハーツJ6", 0, 0, "本", "", 5720),
      ]
    ),
    processing: cat(
      [mk("ハーツ", [])],
      [
        it("hz_p1", "ハーツ", "", "ピースアルファ", 0, 0, "本", "", 8800),
        it("hz_p2", "ハーツ", "", "ピースボンド", 0, 0, "本", "", 8250),
        it("hz_p3", "ハーツ", "", "ベルクロロ", 0, 0, "本", "", 4950),
        it("hz_p4", "ハーツ", "", "ベルバフ", 0, 0, "本", "", 8800),
        it("hz_p5", "ハーツ", "", "ベルポーション", 0, 0, "本", "", 5500),
        it("hz_p6", "ハーツ", "", "エバー1", 0, 0, "本", "", 6600),
        it("hz_p7", "ハーツ", "", "エバー2", 0, 0, "本", "", 6600),
        it("hz_p8", "ハーツ", "", "ネクター", 0, 0, "本", "", 7700),
        it("hz_p9", "ハーツ", "", "アンジー", 0, 0, "本", "", 13200),
      ]
    ),
  },
};


const KEYWORD_COLOR_HINTS = [
  ["オフブラック", "#1A1A1A"],
  ["ブラック", "#1A1A1A"],
  ["ホワイト", "#F3F1EC"],
  ["パウダー", "#F5F3EE"],
  ["シアン", "#00B4C8"],
  ["ロイヤルブルー", "#2E3A8C"],
  ["ブリリアントイエロー", "#F2D200"],
  ["マンダリンオレンジ", "#F0742A"],
  ["ミントグリーン", "#4FD9A8"],
  ["アネモネパープル", "#5B2E93"],
  ["シュガーピンク", "#F3AFC4"],
  ["キャンディーピンク", "#F0578C"],
  ["ネオンライム", "#C6F220"],
  ["ピュアレッド", "#B01030"],
  ["スウィートミルクティー", "#B08968"],
  ["ジェリーメディウム", "#F0EDE5"],
  ["ナチュラルグレー", "#8C8C88"],
  ["ヴァイオレット", "#7A5C9E"],
  ["イエロー", "#F2D200"],
  ["レッド", "#C4192A"],
  ["ピンク", "#EE9FB8"],
  ["ブルー", "#2E5FA8"],
  ["パープル", "#7B4FA0"],
  ["オレンジ", "#E08A2E"],
  ["BLUE", "#2A3A5A"],
  ["GREEN", "#2A5A4A"],
  ["VIOLET", "#4A2A5A"],
  ["ORANGE", "#A85A2A"],
  ["BROWN", "#4A3020"],
];

// Ordered from most specific to least specific. First match wins.
// Each family gets one clearly distinct color (no level/tone gradient).
const FAMILY_COLOR_RULES = [
  [/^S\d+-?HG/, "#C99A4A"],
  [/^S\d+-?OK/, "#B5652E"],
  [/^S\d+-?PA/, "#C79AAE"],
  [/-?GGB/, "#A08A72"],
  [/-?NB\b/, "#6B4A2E"],
  [/^C\d+-CB/i, "#8B5A34"],
  [/-?CB\b/, "#2E5FA8"],
  [/\d-10\b(?!\/)/, "#8FA0B5"],
  [/\d-15\b(?!\/)/, "#4A78B5"],
  [/\d-20\b(?!\/)/, "#6B7A5A"],
  [/\d-35\b(?!\/)/, "#C9A86C"],
  [/\d-40\b(?!\/)/, "#C97A2E"],
  [/\d-55\b(?!\/)/, "#D63384"],
  [/^AC/, "#E8E0D0"],
  [/^HY/, "#D4AF17"],
  [/^E ?CH/, "#6B4A2E"],
  [/^E ?BR/, "#6F4A30"],
  [/^E ?BE/, "#5A4530"],
  [/^E ?SG/, "#3F4A3A"],
  [/^E ?NA/, "#1F3A5A"],
  [/^E ?SO/, "#1F6F64"],
  [/^E ?CP/, "#E8639E"],
  [/^E ?CR/, "#A3236B"],
  [/^E ?MV/, "#7B3FA0"],
  [/^E ?CW/, "#C9A876"],
  [/^B ?BL/, "#1E4FA0"],
  [/^B ?GB/, "#1A5C4A"],
  [/^B ?OR/, "#D0472A"],
  [/^B ?RD/, "#B23A3A"],
  [/^AO/, "#A8442A"],
  [/^RR/, "#7A2530"],
  [/^EG/, "#3F7A52"],
  [/^CB/, "#2E5FA8"],
  [/^SV/, "#3A3570"],
  [/^LT/, "#F5EAC8"],
  [/^MT/, "#7A7A7A"],
  [/^PA/, "#7A8A9A"],
  [/^BA/, "#4A6B8A"],
  [/^OG/, "#7A8A5C"],
  [/^LA/, "#6A7590"],
  [/^MB/, "#A89A80"],
  [/^SG/, "#8A7A8A"],
  [/^BP/, "#C97AA0"],
  [/^MC/, "#5A5A56"],
  [/^BE/, "#9A8560"],
  [/^MA/, "#2E5248"],
  [/^CO/, "#9A9080"],
  [/^SM ?A/, "#8590A0"],
  [/^SM ?G/, "#757568"],
  [/^SM/, "#8A8A6A"],
  [/^SO/, "#9A82A5"],
  [/^RD/, "#B23A3A"],
  [/^OR/, "#C9682E"],
  [/^WR/, "#A83A3A"],
  [/^LB/, "#9A7A52"],
  [/^DB/, "#4A2E1C"],
  [/^WB/, "#C2A578"],
  [/^RB/, "#7B4A3A"],
  [/^AB/, "#7A6F63"],
  [/^BB/, "#3A3A42"],
  [/^PT/, "#D8CBB0"],
  [/^BK/, "#1C1C1C"],
  [/^CL/, "#F1EDE3"],
  [/^DL/, "#4A3123"],
  [/^NA/, "#9A8A68"],
  [/^G-/, "#C9962E"],
  [/^G\d/, "#C9962E"],
  [/^M-/, "#5A8577"],
  [/^M\d/, "#5A8577"],
  [/^N-/, "#8B6F52"],
  [/^N\d/, "#8B6F52"],
  [/^A-/, "#3D5FA0"],
  [/^A\d/, "#3D5FA0"],
  [/^C-/, "#D9722A"],
  [/^C\d/, "#C9A876"],
  [/^R-/, "#A3223A"],
  [/^R\d/, "#A3223A"],
  [/^V-/, "#6B3FA0"],
  [/^V\d/, "#6B3FA0"],
];

function hashStringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  const sat = 45 + (Math.abs(hash >> 3) % 20); // 45-64%
  const light = 42 + (Math.abs(hash >> 7) % 14); // 42-55%
  return hslToHex(hue, sat, light);
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const LEBEL_COLOR_RULES = [
  [/^FP-7\b/, "#D6236F"],
  [/^FP-9\b/, "#B81F63"],
  [/^P-7\b/, "#D6478E"],
  [/^P-9\b/, "#C15A8C"],
  [/^BE-/, "#A8916A"],
  [/^B-/, "#6B4A2E"],
  [/^GR-/, "#8A8A78"],
  [/^PE-/, "#B5AFC0"],
  [/^WA-/, "#7A8A9A"],
  [/^FP-/, "#A83A6E"],
  [/^R-/, "#A8422E"],
  [/^M-/, "#2E5A42"],
  [/^A-/, "#4A5A78"],
  [/^V-/, "#5A4568"],
  [/^P-/, "#C96B85"],
  [/^LT-EX/, "#D8B878"],
  [/^LT\b/, "#F0E8C8"],
  [/^CLR-?PX/, "#F5F3EE"],
  [/マゼンタ/, "#8B1F52"],
];

function guessItemColor(name, maker) {
  if (!name) return "";
  const upper = name.toUpperCase();
  if (maker === "LEBEL") {
    const compactL = upper.replace(/\s+/g, "");
    for (const [re, color] of LEBEL_COLOR_RULES) {
      if (re.test(compactL) || re.test(name)) return color;
    }
  }
  if (maker === "MILBON") {
    if (name === "2液クリスタル6%") return "#D81B60";
    if (name === "OX6%") return "#D8D4F0";
  }
  if (maker === "LEBEL" && name === "エドルクレンジングシャンプー") return "#C9A876";
  if (maker === "hoyu" && name === "オキシ6%") return "#6E6E6E";
  if (maker === "hoyu" && name === "オキシ2%") return "#B5B5B5";
  if (maker === "YAY") {
    if (name.includes("ボタニカルケア")) return "#4ADE80";
    if (name.includes("ダメージ")) return "#EDD9A3";
    if (name === "クリーム") return "#F4A6C1";
    if (name === "ワックス") return "#F5D800";
    if (name === "ジェルオイル") return "#0F3D2E";
    if (name === "ユースオイル") return "#0D1B3E";
    if (name === "アンドミー") return "#7EC8E3";
  }
  if (maker === "ハーツ") {
    if (name === "ハーツH") return "#C4192A";
    if (name === "ハーツM") return "#E8752E";
    if (name === "ハーツB") return "#F2D200";
    if (name === "ハーツS") return "#2E5FA8";
    if (name === "ハーツJ9") return "#7A4FA0";
    if (name === "ハーツJ6") return "#7EC8E3";
    if (name === "ハーツG80") return "#9A9A9A";
    if (name === "ピースアルファ") return "#4FD9A8";
    if (name === "ピースボンド") return "#C0C0C8";
    if (name === "ベルクロロ") return "#1F5C3A";
    if (name === "ベルバフ") return "#1F3A5A";
    if (name === "ベルポーション") return "#E8461E";
    if (name === "エバー1") return "#B8892E";
    if (name === "エバー2") return "#C9A8E0";
    if (name === "アンジー") return "#2E6FB5";
    if (name === "ネクター") return "#3F8A4A";
  }
  for (const [kw, color] of KEYWORD_COLOR_HINTS) {
    if (name.includes(kw) || upper.includes(kw.toUpperCase())) return color;
  }
  const compact = upper.replace(/\s+/g, "");
  for (const [re, color] of FAMILY_COLOR_RULES) {
    if (re.test(compact) || re.test(upper)) return color;
  }
  return hashStringToColor(name);
}

function levelColor(stock, par) {
  if (par <= 0) return "#999";
  const ratio = stock / par;
  if (ratio <= 0.34) return "#B4432F";
  if (ratio <= 0.7) return "#C79A2E";
  return "#4C7A4F";
}

export default function InventoryTracker() {
  const [data, setData] = useState(null);
  const [store, setStore] = useState("VAN");
  const [category, setCategory] = useState("color");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [exportMsg, setExportMsg] = useState("");
  const fileInputRef = useRef(null);
  const [diagInfo, setDiagInfo] = useState("");
  const [saving, setSaving] = useState(false);
  const [addingMakerOpen, setAddingMakerOpen] = useState(false);
  const [newMakerName, setNewMakerName] = useState("");
  const [activeMaker, setActiveMaker] = useState(null);
  const [editMakers, setEditMakers] = useState(false);
  const [addingItemOpen, setAddingItemOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", stock: "", par: "", unit: "本", color: "#CCCCCC", price: "" });
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemValues, setEditingItemValues] = useState({ stock: "", par: "", unit: "", price: "" });
  const [showOrderPreview, setShowOrderPreview] = useState(false);
  const [colorDebugMsg, setColorDebugMsg] = useState("");
  const [showColorHistory, setShowColorHistory] = useState(false);
  const [previewOrder, setPreviewOrder] = useState(null);
  const todayStr = new Date().toISOString().slice(0, 10);
  const [recordDate, setRecordDate] = useState(todayStr);
  const [showHistory, setShowHistory] = useState(false);
  const [manualMonth, setManualMonth] = useState("");
  const [manualGyomu, setManualGyomu] = useState("");
  const [manualTenhan, setManualTenhan] = useState("");
  const [showSupplierOrder, setShowSupplierOrder] = useState(false);
  const [historyFrom, setHistoryFrom] = useState(todayStr.slice(0, 8) + "01");
  const [historyTo, setHistoryTo] = useState(todayStr);
  const [renamingMaker, setRenamingMaker] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [activeType, setActiveType] = useState(null);
  const [editTypes, setEditTypes] = useState(false);
  const [addingTypeOpen, setAddingTypeOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [renamingType, setRenamingType] = useState(null);
  const [renameTypeValue, setRenameTypeValue] = useState("");

  useEffect(() => {
    (async () => {
      let parsed = {};
      let lastErr = null;
      const maxAttempts = 4;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const { data: row, error } = await supabase
            .from("oorder_orders")
            .select("data")
            .eq("id", "main")
            .maybeSingle();
          if (error) throw error;
          parsed = (row && row.data) || {};
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e;
          const wait = 400 * Math.pow(1.6, attempt);
          await new Promise((r) => setTimeout(r, wait));
        }
      }
      if (lastErr) {
        setLoadError(
          "保存データの読み込みに失敗しました：" + String((lastErr && lastErr.message) || lastErr)
        );
        parsed = {};
      }
      const oldLouieData = null;
      try {
        const merged = {};
        for (const s of STORES) {
          merged[s] = {};
          merged[s].orderHistory =
            parsed[s] && Array.isArray(parsed[s].orderHistory) ? parsed[s].orderHistory : [];
          merged[s].colorHistory =
            parsed[s] && Array.isArray(parsed[s].colorHistory) ? parsed[s].colorHistory : [];
          merged[s].manualMonthly =
            parsed[s] && Array.isArray(parsed[s].manualMonthly)
              ? parsed[s].manualMonthly
              : (DEFAULT_DATA[s] && DEFAULT_DATA[s].manualMonthly) || [];
          merged[s]._colorSchemeFixed = !!(parsed[s] && parsed[s]._colorSchemeFixed);
          merged[s]._importedFromLouie = !!(parsed[s] && parsed[s]._importedFromLouie);
          merged[s]._stockParSyncedOnce = !!(parsed[s] && parsed[s]._stockParSyncedOnce);
          for (const c of CATEGORIES) {
            const fallback = (DEFAULT_DATA[s] && DEFAULT_DATA[s][c.key]) || emptyCategory();
            const existing = parsed[s] && parsed[s][c.key];
            if (existing && Array.isArray(existing.makers) && Array.isArray(existing.items)) {
              merged[s][c.key] = {
                makers: existing.makers.map((m) =>
                  typeof m === "string" ? mk(m, []) : mk(m.name, m.types || [])
                ),
                items: existing.items.map((i) => ({
                  ...i,
                  type: i.type || "",
                  color: i.color || "",
                  colorManual: !!i.colorManual,
                  price: i.price || 0,
                  used: i.used || 0,
                  usedGyomu: i.usedGyomu || 0,
                  usedTenhan: i.usedTenhan || 0,
                  usage: i.usage || "業務",
                })),
              };
            } else {
              merged[s][c.key] = fallback;
            }
          }
        }
        let migrated = false;
        {
          const s = "YAY";
          if (merged[s]) {
            const yayShampoo = merged[s].shampoo;
            const yayCond = merged[s].conditioner;
            const yayHaircare = merged[s].haircare;
            const ensureMaker = (cat2, types) => {
              let m = cat2.makers.find((mm) => mm.name === "YAY");
              if (!m) {
                m = mk("YAY", []);
                cat2.makers.push(m);
              }
              types.forEach((t) => {
                if (!m.types.includes(t)) m.types.push(t);
              });
            };
            if (yayShampoo) {
              ensureMaker(yayShampoo, ["ボタニカルケア", "ダメージケア"]);
              const shItems = [
                { id: "yay_sh1", type: "ボタニカルケア", name: "ボタニカルケアシャンプー 300ml" },
                { id: "yay_sh2", type: "ボタニカルケア", name: "ボタニカルケアシャンプー 500ml" },
                { id: "yay_sh3", type: "ボタニカルケア", name: "ボタニカルケアシャンプー 業務用1000ml" },
                { id: "yay_sh4", type: "ダメージケア", name: "ダメージケアシャンプー 300ml" },
                { id: "yay_sh5", type: "ダメージケア", name: "ダメージケアシャンプー 500ml" },
                { id: "yay_sh6", type: "ダメージケア", name: "ダメージケアシャンプー 業務用1000ml" },
              ];
              shItems.forEach((si) => {
                if (!yayShampoo.items.some((i) => i.maker === "YAY" && i.name === si.name)) {
                  yayShampoo.items.push({
                    id: si.id, maker: "YAY", type: si.type, name: si.name,
                    stock: 0, par: 0, unit: "本", color: "", price: 0, used: 0,
                  });
                  migrated = true;
                }
              });
            }
            if (yayCond) {
              ensureMaker(yayCond, ["ボタニカルケア", "ダメージケア"]);
              const coItems = [
                { id: "yay_co1", type: "ボタニカルケア", name: "ボタニカルケアコンディショナー 300ml" },
                { id: "yay_co2", type: "ボタニカルケア", name: "ボタニカルケアコンディショナー 500ml" },
                { id: "yay_co3", type: "ボタニカルケア", name: "ボタニカルケアコンディショナー 業務用1000ml" },
                { id: "yay_co4", type: "ダメージケア", name: "ダメージコンディショナー 300ml" },
                { id: "yay_co5", type: "ダメージケア", name: "ダメージコンディショナー 500ml" },
                { id: "yay_co6", type: "ダメージケア", name: "ダメージコンディショナー 業務用1000ml" },
              ];
              coItems.forEach((ci) => {
                if (!yayCond.items.some((i) => i.maker === "YAY" && i.name === ci.name)) {
                  yayCond.items.push({
                    id: ci.id, maker: "YAY", type: ci.type, name: ci.name,
                    stock: 0, par: 0, unit: "本", color: "", price: 0, used: 0,
                  });
                  migrated = true;
                }
              });
            }
            if (yayHaircare) {
              ensureMaker(yayHaircare, []);
              if (!yayHaircare.makers.some((m) => m.name === "ナインヤーズ")) {
                yayHaircare.makers.push(mk("ナインヤーズ", []));
              }
              const hcItems = [
                { id: "yay_hc1", maker: "YAY", type: "", name: "クリーム" },
                { id: "yay_hc2", maker: "YAY", type: "", name: "ワックス" },
                { id: "yay_hc3", maker: "YAY", type: "", name: "ジェルオイル" },
                { id: "yay_hc4", maker: "YAY", type: "", name: "ユースオイル" },
                { id: "yay_hc5", maker: "YAY", type: "", name: "アンドミー" },
                { id: "yay_ny1", maker: "ナインヤーズ", type: "", name: "cynトリートメント" },
                { id: "yay_ny2", maker: "ナインヤーズ", type: "", name: "ベースウォーター" },
                { id: "yay_ny3", maker: "ナインヤーズ", type: "", name: "yard(大)" },
                { id: "yay_ny4", maker: "ナインヤーズ", type: "", name: "yard(小)" },
              ];
              hcItems.forEach((hi) => {
                if (!yayHaircare.items.some((i) => i.maker === hi.maker && i.name === hi.name)) {
                  yayHaircare.items.push({
                    id: hi.id, maker: hi.maker, type: hi.type, name: hi.name,
                    stock: 0, par: 0, unit: "本", color: "", price: 0, used: 0, usage: "店販",
                  });
                  migrated = true;
                }
              });
            }
          }
        }
        {
          const s = "VAN";
          if (merged[s] && merged[s].straight) {
            const vanStraight = merged[s].straight;
            let kf = vanStraight.makers.find((mm) => mm.name === "ケラフェクト");
            if (!kf) {
              kf = mk("ケラフェクト", ["1剤", "2剤"]);
              vanStraight.makers.push(kf);
              migrated = true;
            } else {
              ["1剤", "2剤"].forEach((t) => {
                if (!kf.types.includes(t)) {
                  kf.types.push(t);
                  migrated = true;
                }
              });
            }
            const kfItems = [
              { id: "kf8", type: "1剤", name: "ケラフェクト8", price: 6120 },
              { id: "kf65", type: "1剤", name: "ケラフェクト6.5", price: 6120 },
              { id: "kf55", type: "1剤", name: "ケラフェクト5.5", price: 6120 },
              { id: "kf45", type: "1剤", name: "ケラフェクト4.5", price: 6120 },
              { id: "kf0", type: "1剤", name: "ケラフェクト0", price: 4500 },
              { id: "kfgconk", type: "1剤", name: "ケラフェクトG-コンク", price: 4950 },
              { id: "kf2zai", type: "2剤", name: "ケラフェクト2剤", price: 3420 },
            ];
            kfItems.forEach((ki) => {
              if (!vanStraight.items.some((i) => i.maker === "ケラフェクト" && i.name === ki.name)) {
                vanStraight.items.push({
                  id: ki.id,
                  maker: "ケラフェクト",
                  type: ki.type,
                  name: ki.name,
                  stock: 2,
                  par: 2,
                  unit: "本",
                  color: "",
                  price: ki.price,
                  used: 0,
                  usedGyomu: 0,
                  usedTenhan: 0,
                  usage: "業務",
                });
                migrated = true;
              }
            });
          }
        }
        {
          const alreadyStockSynced = !!(merged.VAN && merged.VAN._stockParSyncedOnce);
          if (!alreadyStockSynced) {
            STORES.forEach((s) => {
              CATEGORIES.forEach((c) => {
                const catData = merged[s] && merged[s][c.key];
                if (!catData) return;
                catData.items.forEach((i) => {
                  if ((i.par || 0) === 0) {
                    i.par = 2;
                    i.stock = 2;
                  } else {
                    i.stock = i.par;
                  }
                });
              });
            });
            if (merged.VAN) merged.VAN._stockParSyncedOnce = true;
            migrated = true;
          }
        }
        {
          const louieOld = oldLouieData;
          const alreadyImported = !!(merged.VAN && merged.VAN._importedFromLouie);
          if (louieOld && !alreadyImported) {
            const makerToSupplier = (maker) => {
              if (maker === "ARIMINO") return "ダリア";
              if (maker === "WELLA" || maker === "オラプレックス") return "ガモウ";
              if (maker === "YAY") return "YAY";
              return "VAN";
            };
            CATEGORIES.forEach((c) => {
              const oldCat = louieOld[c.key];
              if (!oldCat || !Array.isArray(oldCat.items)) return;
              oldCat.items.forEach((item) => {
                const sup = makerToSupplier(item.maker);
                const targetCat = merged[sup][c.key];
                const exists = targetCat.items.some((i) => i.id === item.id);
                if (!exists) {
                  targetCat.items.push({
                    ...item,
                    type: item.type || "",
                    color: item.color || "",
                    colorManual: !!item.colorManual,
                    price: item.price || 0,
                    used: item.used || 0,
                  });
                }
                if (!targetCat.makers.some((m) => m.name === item.maker)) {
                  const oldMakerObj = (oldCat.makers || []).find((m) =>
                    typeof m === "string" ? m === item.maker : m.name === item.maker
                  );
                  const types = oldMakerObj && oldMakerObj.types ? oldMakerObj.types : [];
                  targetCat.makers.push(mk(item.maker, types));
                }
              });
            });
            merged.VAN._importedFromLouie = true;
            migrated = true;
          }
        }
        {
          const s = "LOUIE";
          if (merged[s]) {
            const shampooCat2 = merged[s].shampoo;
            if (shampooCat2 && !shampooCat2.makers.some((m) => m.name === "YAY")) {
              shampooCat2.makers.push(mk("YAY", []));
              migrated = true;
            }
            const treatCat4 = merged[s].treatment;
            if (treatCat4 && !treatCat4.makers.some((m) => m.name === "オラプレックス")) {
              treatCat4.makers.push(mk("オラプレックス", []));
              migrated = true;
            }
          }
        }
        let diagScanned = 0;
        let diagColored = 0;
        {
          STORES.forEach((s) => {
            if (merged[s]) {
              CATEGORIES.forEach((c) => {
                const ck = c.key;
                const cat = merged[s][ck];
                if (!cat) return;
                cat.items.forEach((i) => {
                  diagScanned++;
                  if (i.colorManual) return;
                  const guess = guessItemColor(i.name, i.maker);
                  if (guess && guess !== i.color) {
                    i.color = guess;
                    migrated = true;
                    diagColored++;
                  }
                });
              });
            }
          });
        }
        {
          const s = "LOUIE";
          if (merged[s]) {
            const catsToColor = ["color", "manicure"];
            catsToColor.forEach((ck) => {
              const cat = merged[s][ck];
              if (!cat) return;
              cat.items.forEach((i) => {
                if (!i.color) {
                  const guess = guessItemColor(i.name, i.maker);
                  if (guess) {
                    i.color = guess;
                    migrated = true;
                  }
                }
              });
            });
          }
        }
        {
          const s = "LOUIE";
          if (merged[s]) {
            const colorCatOrder = merged[s].color;
            const jellyIdx = colorCatOrder.items.findIndex(
              (i) => i.maker === "ソマルカ" && i.name === "ジェリーメディウム"
            );
            const hasSomarkaAfter =
              jellyIdx !== -1 &&
              colorCatOrder.items.slice(jellyIdx + 1).some((i) => i.maker === "ソマルカ");
            if (jellyIdx !== -1 && hasSomarkaAfter) {
              const [jellyItem] = colorCatOrder.items.splice(jellyIdx, 1);
              colorCatOrder.items.push(jellyItem);
              migrated = true;
            }
          }
        }
        {
          const s = "LOUIE";
          if (merged[s]) {
            const colorCat10 = merged[s].color;
            const somarkaColorItems = [
              "シアン", "ロイヤルブルー", "ブリリアントイエロー", "マンダリンオレンジ",
              "ミントグリーン", "アネモネパープル", "シュガーピンク", "キャンディーピンク",
              "ネオンライム", "ピュアレッド",
            ];
            somarkaColorItems.forEach((name, idx) => {
              const exists = colorCat10.items.some((i) => i.maker === "ソマルカ" && i.name === name);
              if (!exists) {
                colorCat10.items.push({
                  id: "somc" + idx, maker: "ソマルカ", type: "", name,
                  stock: 0, par: 0, unit: "本", color: "", price: 1600, used: 0,
                });
                migrated = true;
              }
            });
          }
        }
        {
          const s = "LOUIE";
          if (merged[s]) {
            // クオルシアブリーチ under hoyu ブリーチ (color)
            const colorCat9 = merged[s].color;
            const hoyuColorMaker2 = colorCat9.makers.find((m) => m.name === "hoyu");
            if (hoyuColorMaker2) {
              if (!hoyuColorMaker2.types.includes("ブリーチ")) hoyuColorMaker2.types.push("ブリーチ");
              const hasQuolshia = colorCat9.items.some(
                (i) => i.maker === "hoyu" && i.name === "クオルシアブリーチ"
              );
              if (!hasQuolshia) {
                colorCat9.items.push({
                  id: "hy_bleach2m", maker: "hoyu", type: "ブリーチ", name: "クオルシアブリーチ",
                  stock: 0, par: 0, unit: "本", color: "", price: 2800, used: 0,
                });
                migrated = true;
              }
            }

            // クロス maker + items, and additional 消耗品 items
            const otherCat7 = merged[s].other;
            let clothMaker = otherCat7.makers.find((m) => m.name === "クロス");
            if (!clothMaker) {
              clothMaker = mk("クロス", []);
              otherCat7.makers.push(clothMaker);
            }
            const clothItems = [
              { id: "cl1", name: "ワコ-3100B シワシワルック ホワイト", price: 3040 },
              { id: "cl2", name: "ワコ NO.3170 Eガードドレス ホワイト", price: 3360 },
              { id: "cl3", name: "カトレア NO.8000 ヘアダイクロス", price: 3840 },
              { id: "cl4", name: "デオドラントケープ特注", price: 2800 },
            ];
            clothItems.forEach((ci) => {
              const exists = otherCat7.items.some((i) => i.maker === "クロス" && i.name === ci.name);
              if (!exists) {
                otherCat7.items.push({
                  id: ci.id, maker: "クロス", type: "", name: ci.name,
                  stock: 0, par: 0, unit: "本", color: "", price: ci.price, used: 0,
                });
                migrated = true;
              }
            });
            const moreSupplies = [
              { id: "ms1", name: "タニーチューブシボリ", price: 2100 },
              { id: "ms2", name: "NBAA ナチュラルグロス", price: 1260 },
              { id: "ms3", name: "NBAA スムージングロス", price: 1260 },
            ];
            moreSupplies.forEach((ms) => {
              const exists = otherCat7.items.some((i) => i.maker === "消耗品" && i.name === ms.name);
              if (!exists) {
                otherCat7.items.push({
                  id: ms.id, maker: "消耗品", type: "", name: ms.name,
                  stock: 0, par: 0, unit: "本", color: "", price: ms.price, used: 0,
                });
                migrated = true;
              }
            });
          }
        }
        {
          const s = "LOUIE";
          if (merged[s]) {
            const otherCat6 = merged[s].other;
            const colorCat8 = merged[s].color;
            const bleachIdx = otherCat6.items.findIndex(
              (i) => i.maker === "hoyu" && i.name === "プロマスターパワーブリーチ"
            );
            if (bleachIdx !== -1) {
              const bleachItem = otherCat6.items[bleachIdx];
              otherCat6.items.splice(bleachIdx, 1);
              if (!otherCat6.items.some((i) => i.maker === "hoyu" && i.type === "プロマスター")) {
                const hoyuOtherMaker = otherCat6.makers.find((m) => m.name === "hoyu");
                if (hoyuOtherMaker) hoyuOtherMaker.types = hoyuOtherMaker.types.filter((t) => t !== "プロマスター");
              }
              let hoyuColorMaker = colorCat8.makers.find((m) => m.name === "hoyu");
              if (!hoyuColorMaker) {
                hoyuColorMaker = mk("hoyu", []);
                colorCat8.makers.push(hoyuColorMaker);
              }
              if (!hoyuColorMaker.types.includes("ブリーチ")) hoyuColorMaker.types.push("ブリーチ");
              const alreadyMoved = colorCat8.items.some(
                (i) => i.maker === "hoyu" && i.name === "プロマスターパワーブリーチ"
              );
              if (!alreadyMoved) {
                colorCat8.items.push({ ...bleachItem, type: "ブリーチ" });
              }
              migrated = true;
            }
          }
        }
        {
          const s = "LOUIE";
          if (merged[s]) {
            const otherCat5 = merged[s].other;
            let supplyMaker2 = otherCat5.makers.find((m) => m.name === "消耗品");
            if (!supplyMaker2) {
              supplyMaker2 = mk("消耗品", []);
              otherCat5.makers.push(supplyMaker2);
            }
            const remainingSupplies = [
              { id: "rs1", name: "サボニーズ 保護ジェル", price: 2400 },
              { id: "rs2", name: "サボニーズ 保護クリーム", price: 3400 },
              { id: "rs3", name: "ダイドーペーパー L+", price: 355 },
              { id: "rs4", name: "PCターバンレギュラー", price: 1950 },
              { id: "rs5", name: "ロールコットン 3巻(白)", price: 1750 },
              { id: "rs6", name: "ハイライトペーパー S", price: 1000 },
              { id: "rs7", name: "ハイライトペーパー M", price: 1330 },
              { id: "rs8", name: "アイビルエコホイル シルバー", price: 1520 },
              { id: "rs9", name: "オカモトブラックグローブ S", price: 3400 },
              { id: "rs10", name: "オカモトブラックグローブ M", price: 3400 },
              { id: "rs11", name: "ウエラフェイスガーゼ", price: 800 },
              { id: "rs12", name: "ビューティバンド #16 黄", price: 342 },
              { id: "rs13", name: "東京チャーム NO.5", price: 4970 },
              { id: "rs14", name: "炭酸タブレット ナチュラル(N)", price: 6000 },
              { id: "rs15", name: "炭酸タブレット フラット(b)", price: 6000 },
              { id: "rs16", name: "炭酸タブレット シャープ(#)", price: 6000 },
              { id: "rs17", name: "魔法の液体", price: 1980 },
              { id: "rs18", name: "アロマオイル(レモン)", price: 840 },
              { id: "rs19", name: "ロイヤルタッチ", price: 1450 },
              { id: "rs20", name: "No205 ウルトラケープホワイト", price: 800 },
              { id: "rs21", name: "フローラビューティーバンド16", price: 690 },
              { id: "rs22", name: "ニゼルミラーフィルター 180g", price: 1430 },
              { id: "rs23", name: "エアリーフィルター 180g", price: 1430 },
              { id: "rs24", name: "シルクラティックスグローブ", price: 1000 },
            ];
            remainingSupplies.forEach((rs) => {
              const exists = otherCat5.items.some((i) => i.maker === "消耗品" && i.name === rs.name);
              if (!exists) {
                otherCat5.items.push({
                  id: rs.id,
                  maker: "消耗品",
                  type: "",
                  name: rs.name,
                  stock: 0,
                  par: 0,
                  unit: "本",
                  color: "",
                  price: rs.price,
                  used: 0,
                });
                migrated = true;
              }
            });
          }
        }
        {
          const s = "LOUIE";
          if (merged[s]) {
            // アイスタイルC10 under 華凛
            const straightCat3 = merged[s].straight;
            const hairinMaker2 = straightCat3.makers.find((m) => m.name === "華凛");
            if (hairinMaker2) {
              if (!hairinMaker2.types.includes("アイスタイル")) hairinMaker2.types.push("アイスタイル");
              const hasC10 = straightCat3.items.some(
                (i) => i.maker === "華凛" && i.type === "アイスタイル" && i.name === "C10"
              );
              if (!hasC10) {
                straightCat3.items.push({
                  id: "krC10", maker: "華凛", type: "アイスタイル", name: "C10",
                  stock: 0, par: 0, unit: "本", color: "", price: 1600, used: 0,
                });
                migrated = true;
              }
            }

            // Dr.HEAT D-GLT500ml under treatment
            const treatCat3 = merged[s].treatment;
            let drHeatMaker = treatCat3.makers.find((m) => m.name === "Dr.HEAT");
            if (!drHeatMaker) {
              drHeatMaker = mk("Dr.HEAT", []);
              treatCat3.makers.push(drHeatMaker);
            }
            const hasDrHeat = treatCat3.items.some((i) => i.maker === "Dr.HEAT" && i.name === "D-GLT 500ml");
            if (!hasDrHeat) {
              treatCat3.items.push({
                id: "t8m", maker: "Dr.HEAT", type: "", name: "D-GLT 500ml",
                stock: 0, par: 0, unit: "本", color: "", price: 10000, used: 0,
              });
              migrated = true;
            }

            // hoyu 白髪ぼかしナチュラルグレー under color
            const colorCat7 = merged[s].color;
            const hasNGray = colorCat7.items.some((i) => i.maker === "hoyu" && i.name === "白髪ぼかし ナチュラルグレー");
            if (!hasNGray) {
              colorCat7.items.push({
                id: "hy_ngraym", maker: "hoyu", type: "", name: "白髪ぼかし ナチュラルグレー",
                stock: 0, par: 0, unit: "本", color: "", price: 700, used: 0,
              });
              migrated = true;
            }
          }
        }
        {
          // Corrective fix: restore real prices for items that may have been
          // overwritten to 600 by the old color test-data button.
          const s = "LOUIE";
          if (merged[s]) {
            const colorCat0 = merged[s].color;
            const knownColorPrices = {
              "ソマルカ|スウィートミルクティー": 1200,
              "ソマルカ|ジェリーメディウム": 1875,
              "資生堂|カラーミューズ カラークリーム ブルー 240g": 2200,
              "資生堂|カラーミューズ カラークリーム イエロー 240g": 2200,
            };
            const unknownColorItems = new Set([
              "MILBON|エノグ オフブラック",
              "資生堂|カラーミューズ カラークリーム レッド 240g",
              "資生堂|カラーミューズ カラークリーム ピンク 240g",
              "資生堂|カラーミューズ カラークリーム ヴァイオレット 240g",
            ]);
            colorCat0.items.forEach((i) => {
              const key = `${i.maker}|${i.name}`;
              if (knownColorPrices[key] !== undefined && i.price !== knownColorPrices[key]) {
                i.price = knownColorPrices[key];
                migrated = true;
              } else if (unknownColorItems.has(key) && i.price === 600) {
                i.price = 0;
                migrated = true;
              }
            });
          }
        }
        {
          const s = "LOUIE";
          if (merged[s]) {
            // Shampoo: エドルBLクレンジング
            const shampooCat2 = merged[s].shampoo;
            const hasEdolBL = shampooCat2.items.some((i) => i.maker === "LEBEL" && i.name === "エドル BLクレンジング 1L");
            if (!hasEdolBL) {
              shampooCat2.items.push({
                id: "s2m", maker: "LEBEL", type: "", name: "エドル BLクレンジング 1L",
                stock: 0, par: 0, unit: "本", color: "", price: 2800, used: 0,
              });
              migrated = true;
            }

            // Treatment: サンコール フェルエ
            const treatCat2 = merged[s].treatment;
            let suncallMaker = treatCat2.makers.find((m) => m.name === "サンコール");
            if (!suncallMaker) {
              suncallMaker = mk("サンコール", []);
              treatCat2.makers.push(suncallMaker);
            }
            const ferieItems = [
              { id: "t3m", name: "フェルエ ヘミング 800mlリフィル", price: 3900 },
              { id: "t4m", name: "フェルエ キューティクルコート 250g", price: 1800 },
              { id: "t5m", name: "フェルエ デオバッファー 800", price: 3900 },
            ];
            ferieItems.forEach((fi) => {
              const exists = treatCat2.items.some((i) => i.maker === "サンコール" && i.name === fi.name);
              if (!exists) {
                treatCat2.items.push({
                  id: fi.id, maker: "サンコール", type: "", name: fi.name,
                  stock: 0, par: 0, unit: "本", color: "", price: fi.price, used: 0,
                });
                migrated = true;
              }
            });

            let milbonTreatMaker = treatCat2.makers.find((m) => m.name === "MILBON");
            if (!milbonTreatMaker) {
              milbonTreatMaker = mk("MILBON", []);
              treatCat2.makers.push(milbonTreatMaker);
            }
            const milbonTreatItems = [
              { id: "t6m", name: "ネオリシオ ヒートプロテクター 400ml", price: 2400 },
              { id: "t7m", name: "ミルボンカラーリムーバー 250ml", price: 1980 },
            ];
            milbonTreatItems.forEach((mi) => {
              const exists = treatCat2.items.some((i) => i.maker === "MILBON" && i.name === mi.name);
              if (!exists) {
                treatCat2.items.push({
                  id: mi.id, maker: "MILBON", type: "", name: mi.name,
                  stock: 0, par: 0, unit: "本", color: "", price: mi.price, used: 0,
                });
                migrated = true;
              }
            });

            // Color: エノグ (MILBON) + カラーミューズ (資生堂)
            const colorCat6 = merged[s].color;
            let shiseidoMaker = colorCat6.makers.find((m) => m.name === "資生堂");
            if (!shiseidoMaker) {
              shiseidoMaker = mk("資生堂", []);
              colorCat6.makers.push(shiseidoMaker);
            }
            const hasEnogu = colorCat6.items.some((i) => i.maker === "MILBON" && i.name === "エノグ オフブラック");
            if (!hasEnogu) {
              colorCat6.items.push({
                id: "mlnoguEm", maker: "MILBON", type: "", name: "エノグ オフブラック",
                stock: 0, par: 0, unit: "本", color: "", price: 0, used: 0,
              });
              migrated = true;
            }
            const museItems = [
              { id: "sd1m", name: "カラーミューズ カラークリーム ブルー 240g", price: 2200 },
              { id: "sd2m", name: "カラーミューズ カラークリーム イエロー 240g", price: 2200 },
              { id: "sd3m", name: "カラーミューズ カラークリーム レッド 240g", price: 2200 },
              { id: "sd4m", name: "カラーミューズ カラークリーム ピンク 240g", price: 2200 },
              { id: "sd5m", name: "カラーミューズ カラークリーム ヴァイオレット 240g", price: 2200 },
            ];
            museItems.forEach((mi) => {
              const exists = colorCat6.items.some((i) => i.maker === "資生堂" && i.name === mi.name);
              if (!exists) {
                colorCat6.items.push({
                  id: mi.id, maker: "資生堂", type: "", name: mi.name,
                  stock: 0, par: 0, unit: "本", color: "", price: mi.price, used: 0,
                });
                migrated = true;
              }
            });
          }
        }
        {
          const s = "LOUIE";
          if (merged[s]) {
            // Remove old TG0, keep only TG0EX
            const straightCat2 = merged[s].straight;
            const beforeLen = straightCat2.items.length;
            straightCat2.items = straightCat2.items.filter(
              (i) => !(i.maker === "華凛" && i.type === "ジーニアス" && i.name === "TG0")
            );
            if (straightCat2.items.length !== beforeLen) migrated = true;

            // Add 備品 items to other category (maker: 消耗品, not 華凛)
            const otherCat4 = merged[s].other;
            // Fix any previously-created 華凛 maker within "other" category (should be 消耗品)
            const wrongHairinOther = otherCat4.makers.find((m) => m.name === "華凛");
            if (wrongHairinOther) {
              let correctSupplyMaker = otherCat4.makers.find((m) => m.name === "消耗品");
              if (!correctSupplyMaker) {
                correctSupplyMaker = mk("消耗品", []);
                otherCat4.makers.push(correctSupplyMaker);
              }
              otherCat4.makers = otherCat4.makers.filter((m) => m.name !== "華凛");
              otherCat4.items.forEach((i) => {
                if (i.maker === "華凛") i.maker = "消耗品";
              });
              migrated = true;
            }
            let hairinOther = otherCat4.makers.find((m) => m.name === "消耗品");
            if (!hairinOther) {
              hairinOther = mk("消耗品", []);
              otherCat4.makers.push(hairinOther);
            }
            const supplyItems = [
              { id: "sup1", name: "イヤーキャップ(黒)", price: 1000 },
              { id: "sup2", name: "ネックシャッター", price: 1200 },
              { id: "sup3", name: "ダックカール", price: 3060 },
              { id: "sup4", name: "フラスコミニ(小)", price: 490 },
            ];
            supplyItems.forEach((si) => {
              const exists = otherCat4.items.some((i) => i.maker === "消耗品" && i.name === si.name);
              if (!exists) {
                otherCat4.items.push({
                  id: si.id,
                  maker: "消耗品",
                  type: "",
                  name: si.name,
                  stock: 0,
                  par: 0,
                  unit: "本",
                  color: "",
                  price: si.price,
                  used: 0,
                });
                migrated = true;
              }
            });
          }
        }
        {
          const s = "LOUIE";
          if (merged[s]) {
            const straightCat = merged[s].straight;
            const hairinMaker = straightCat.makers.find((m) => m.name === "華凛");
            if (hairinMaker) {
              if (!hairinMaker.types.includes("ジーニアス")) hairinMaker.types.push("ジーニアス");
              const newCodes = [
                { name: "TG0EX", price: 1850 },
                { name: "CY4", price: 2800 },
                { name: "CA0", price: 1950 },
                { name: "AC", price: 0 },
              ];
              newCodes.forEach((nc, idx) => {
                const exists = straightCat.items.some(
                  (i) => i.maker === "華凛" && i.type === "ジーニアス" && i.name === nc.name
                );
                if (!exists) {
                  straightCat.items.push({
                    id: "krnew" + idx,
                    maker: "華凛",
                    type: "ジーニアス",
                    name: nc.name,
                    stock: 0,
                    par: 0,
                    unit: "本",
                    color: "",
                    price: nc.price,
                    used: 0,
                  });
                  migrated = true;
                }
              });
              const existingPrices = {
                CA1: 1950,
                TG3: 1950,
                TG5: 1950,
                TG7: 1850,
                CA6: 1950,
              };
              straightCat.items.forEach((i) => {
                if (i.maker === "華凛" && existingPrices[i.name] && i.price !== existingPrices[i.name]) {
                  i.price = existingPrices[i.name];
                  migrated = true;
                }
                if (i.maker === "華凛" && i.name === "リキッド2剤 2L" && i.price !== 3800) {
                  i.price = 3800;
                  migrated = true;
                }
                if (i.maker === "華凛" && i.name === "クリーム2剤 2kg" && i.price !== 5400) {
                  i.price = 5400;
                  migrated = true;
                }
              });
            }
          }
        }
        {
          const s = "LOUIE";
          if (merged[s]) {
            const ordeveTypes = Object.keys(ORDEVE_SERIES);
            const edolTypes = Object.keys(EDOL_SERIES);
            const naplaTypes = Object.keys(NAPLA_ACID_SERIES);
            const colorCat5 = merged[s].color;
            colorCat5.items.forEach((i) => {
              if (i.maker === "MILBON" && ordeveTypes.includes(i.type) && i.price !== 488) {
                i.price = 488;
                migrated = true;
              }
              if (i.maker === "LEBEL" && edolTypes.includes(i.type) && i.price !== 700) {
                i.price = 700;
                migrated = true;
              }
            });
            const devCat2 = merged[s].developer;
            devCat2.items.forEach((i) => {
              if (i.maker === "MILBON" && i.name === "OX6%" && i.price !== 900) {
                i.price = 900;
                migrated = true;
              }
            });
            const maniCat2 = merged[s].manicure;
            maniCat2.items.forEach((i) => {
              if (i.maker === "ナプラ" && naplaTypes.includes(i.type) && i.price !== 950) {
                i.price = 950;
                migrated = true;
              }
            });
          }
        }
        {
          const s = "LOUIE";
          if (merged[s]) {
            // SOMARCA shampoo items
            const shampooCat = merged[s].shampoo;
            let somarkaShampoo = shampooCat.makers.find((m) => m.name === "ソマルカ");
            if (!somarkaShampoo) {
              somarkaShampoo = mk("ソマルカ", []);
              shampooCat.makers.push(somarkaShampoo);
            }
            const shampooItems = [
              { id: "som1", name: "カラーシャンプー ホワイトベージュ" },
              { id: "som2", name: "カラーシャンプー パープル" },
              { id: "som3", name: "カラーシャンプー ピンク" },
              { id: "som4", name: "カラーシャンプー ミルクティベージュ" },
            ];
            shampooItems.forEach((si) => {
              const exists = shampooCat.items.some((i) => i.maker === "ソマルカ" && i.name === si.name);
              if (!exists) {
                shampooCat.items.push({
                  id: si.id,
                  maker: "ソマルカ",
                  type: "",
                  name: si.name,
                  stock: 0,
                  par: 0,
                  unit: "本",
                  color: "",
                  price: 1170,
                  used: 0,
                });
                migrated = true;
              }
            });

            // SOMARCA color items
            const colorCat4 = merged[s].color;
            let somarkaColor = colorCat4.makers.find((m) => m.name === "ソマルカ");
            if (!somarkaColor) {
              somarkaColor = mk("ソマルカ", []);
              colorCat4.makers.push(somarkaColor);
            }
            const colorItems = [
              { id: "som5", name: "スウィートミルクティー", price: 1200 },
              { id: "som6", name: "ジェリーメディウム", price: 1875 },
            ];
            colorItems.forEach((ci) => {
              const exists = colorCat4.items.some((i) => i.maker === "ソマルカ" && i.name === ci.name);
              if (!exists) {
                colorCat4.items.push({
                  id: ci.id,
                  maker: "ソマルカ",
                  type: "",
                  name: ci.name,
                  stock: 0,
                  par: 0,
                  unit: "本",
                  color: "",
                  price: ci.price,
                  used: 0,
                });
                migrated = true;
              }
            });
          }
        }
        {
          const otherNewItems = [
            { name: "プロマスターパワーブリーチ", type: "プロマスター", price: 2625 },
            { name: "グリックス 100g", type: "エトラス", price: 1024 },
            { name: "グレイスオイル 80ml", type: "エトラス", price: 1170 },
            { name: "ルーセントスプレー5 50g", type: "ナイン", price: 585 },
            { name: "ルーセントスプレー5 180g", type: "ナイン", price: 1100 },
            { name: "ルーセントスプレー9 50g", type: "ナイン", price: 585 },
            { name: "ルーセントスプレー9 180g", type: "ナイン", price: 1110 },
            { name: "ソーダベースメイク", type: "レセ", price: 1125 },
          ];
          const s = "LOUIE";
          if (merged[s]) {
            const otherCat3 = merged[s].other;
            let hoyuMaker2 = otherCat3.makers.find((m) => m.name === "hoyu");
            if (!hoyuMaker2) {
              hoyuMaker2 = mk("hoyu", []);
              otherCat3.makers.push(hoyuMaker2);
            }
            otherNewItems.forEach((ni, idx) => {
              if (!hoyuMaker2.types.includes(ni.type)) hoyuMaker2.types.push(ni.type);
              const exists = otherCat3.items.some(
                (i) => i.maker === "hoyu" && i.type === ni.type && i.name === ni.name
              );
              if (!exists) {
                otherCat3.items.push({
                  id: "ovm" + idx,
                  maker: "hoyu",
                  type: ni.type,
                  name: ni.name,
                  stock: 0,
                  par: 0,
                  unit: "本",
                  color: "",
                  price: ni.price,
                  used: 0,
                });
                migrated = true;
              }
            });
          }
        }
        {
          for (const s of STORES) {
            const colorCat3 = merged[s].color;
            const hoyuMaker = colorCat3.makers.find((m) => m.name === "hoyu");
            if (hoyuMaker) {
              if (!hoyuMaker.types.includes("PMアプリエミドル")) {
                hoyuMaker.types.push("PMアプリエミドル");
              }
              const hasLA6 = colorCat3.items.some(
                (i) => i.maker === "hoyu" && i.type === "PMアプリエミドル" && i.name === "LA6"
              );
              if (!hasLA6) {
                colorCat3.items.push({
                  id: "hyLA6",
                  maker: "hoyu",
                  type: "PMアプリエミドル",
                  name: "LA6",
                  stock: 0,
                  par: 0,
                  unit: "本",
                  color: "",
                  price: 525,
                  used: 0,
                });
                migrated = true;
              }
            }
          }
        }
        {
          for (const s of STORES) {
            const colorCat2 = merged[s].color;
            let changed = false;
            colorCat2.items.forEach((i) => {
              if (i.maker === "hoyu" && i.name === "PCパウダー" && i.price !== 3150) {
                i.price = 3150;
                changed = true;
              }
            });
            if (changed) migrated = true;
          }
        }
        {
          for (const s of STORES) {
            const devCat = merged[s].developer;
            let changed = false;
            devCat.items.forEach((i) => {
              if (i.maker === "hoyu" && (i.name === "オキシ6%" || i.name === "オキシ2%") && i.price !== 900) {
                i.price = 900;
                changed = true;
              }
            });
            if (changed) migrated = true;
          }
        }
        {
          const hoyuColorTypes = Object.keys(HOYU_COLOR_SERIES);
          for (const s of STORES) {
            const colorCat = merged[s].color;
            let changed = false;
            colorCat.items.forEach((i) => {
              if (i.maker === "hoyu" && hoyuColorTypes.includes(i.type) && i.price !== 525) {
                i.price = 525;
                changed = true;
              }
            });
            if (changed) migrated = true;
          }
        }
        for (const s of STORES) {
          const otherCat = merged[s].other;
          const colorCat0 = merged[s].color;
          const moveNames = ["ACケアージュ", "PCパウダー"];
          const toMove = otherCat.items.filter(
            (i) => i.maker === "hoyu" && moveNames.includes(i.name)
          );
          if (toMove.length > 0) {
            otherCat.items = otherCat.items.filter(
              (i) => !(i.maker === "hoyu" && moveNames.includes(i.name))
            );
            if (otherCat.items.every((i) => i.maker !== "hoyu")) {
              otherCat.makers = otherCat.makers.filter((m) => m.name !== "hoyu");
            }
            let colorHoyu = colorCat0.makers.find((m) => m.name === "hoyu");
            if (!colorHoyu) {
              colorHoyu = mk("hoyu", []);
              colorCat0.makers.push(colorHoyu);
            }
            if (!colorHoyu.types.includes("アプリエ")) colorHoyu.types.push("アプリエ");
            for (const item of toMove) {
              colorCat0.items.push({ ...item, type: "アプリエ" });
            }
            migrated = true;
          }
        }
        for (const s of STORES) {
          const colorCat = merged[s].color;
          const naplaIdx = colorCat.makers.findIndex((m) => m.name === "ナプラ");
          if (naplaIdx !== -1) {
            const naplaMaker = colorCat.makers[naplaIdx];
            const naplaItems = colorCat.items.filter((i) => i.maker === "ナプラ");
            colorCat.makers = colorCat.makers.filter((m) => m.name !== "ナプラ");
            colorCat.items = colorCat.items.filter((i) => i.maker !== "ナプラ");
            const maniCat = merged[s].manicure;
            let maniNapla = maniCat.makers.find((m) => m.name === "ナプラ");
            if (!maniNapla) {
              maniNapla = mk("ナプラ", []);
              maniCat.makers.push(maniNapla);
            }
            for (const t of naplaMaker.types) {
              if (!maniNapla.types.includes(t)) maniNapla.types.push(t);
            }
            maniCat.items.push(...naplaItems);
            migrated = true;
          }
        }
        {
          const hoyuAdditions = [
            { type: "プロマスター", before: "N-9/8", codes: ["N-10/12", "N-10/10"] },
            { type: "プロマスター", before: "MT-9/8", codes: ["MT-10/12", "MT-10/10"] },
            { type: "プロマスター", after: "C-7/7", codes: ["C-6/5"] },
            { type: "ピグメント", after: "M-8P", codes: ["M-7P", "M-6P"] },
            { type: "ピグメント", before: "E CR-7P", codes: ["E CP-9P"] },
            { type: "ピグメント", before: "E CP-9P", codes: ["V-9P", "V-8P", "V-7P", "V-6P", "E BR6P", "E BR-4P"] },
            { type: "ピグメント", after: "E CR-7P", codes: ["E NA-3P"] },
            { type: "ピグメント", after: "CB-5P", codes: ["SV6P"] },
            { type: "プロマスタートナーオン", append: true, codes: ["A-T7"] },
            { type: "アプリエ", after: "LA-13", codes: ["LA-15"] },
            { type: "アプリエ", after: "SG-13", codes: ["SG-15"] },
            { type: "PMアプリエミドル", after: "BE9", codes: ["BE7", "BE5"] },
            { type: "PMアプリエミドル", after: "MA9", codes: ["MA7"] },
            { type: "PMアプリエミドル", before: "LA9", codes: ["BA9", "BA7", "BA6"] },
            { type: "PMアプリエグロー", after: "CO G10", codes: ["CO G11"] },
            { type: "PMアプリエグロー", after: "SM G9", codes: ["SM G11"] },
            { type: "PMアプリエグロー", after: "SO L9", codes: ["SO L11"] },
          ];
          for (const s of STORES) {
            const colorCat = merged[s].color;
            let changed = false;
            for (const add of hoyuAdditions) {
              const missing = add.codes.filter(
                (code) =>
                  !colorCat.items.some(
                    (i) => i.maker === "hoyu" && i.type === add.type && i.name === code
                  )
              );
              if (missing.length === 0) continue;
              const newItems = missing.map((code) =>
                it(
                  "hy2_" + add.type + "_" + code.replace(/[^a-zA-Z0-9]/g, ""),
                  "hoyu",
                  add.type,
                  code,
                  0,
                  0,
                  "本",
                  "",
                  code === "PCパウダー" ? 3150 : 525
                )
              );
              if (add.append) {
                colorCat.items.push(...newItems);
              } else {
                const refName = add.before || add.after;
                const refIdx = colorCat.items.findIndex(
                  (i) => i.maker === "hoyu" && i.type === add.type && i.name === refName
                );
                if (refIdx === -1) {
                  colorCat.items.push(...newItems);
                } else {
                  const insertAt = add.before ? refIdx : refIdx + 1;
                  colorCat.items.splice(insertAt, 0, ...newItems);
                }
              }
              changed = true;
            }
            if (changed) migrated = true;
          }
        }
        {
          for (const s of STORES) {
            const straightCatR = merged[s].straight;
            if (!straightCatR) continue;
            const gaItem = straightCatR.items.find(
              (i) => i.maker === "華凛" && i.type === "ジーニアス" && i.name === "GA6"
            );
            if (gaItem) {
              gaItem.name = "CA6";
              migrated = true;
            }
          }
        }
        {
          const priceFixes = [
            { cat: "shampoo", maker: "YAY", name: "ボタニカルケアシャンプー 300ml", price: 1509 },
            { cat: "shampoo", maker: "YAY", name: "ボタニカルケアシャンプー 500ml", price: 1830 },
            { cat: "shampoo", maker: "YAY", name: "ボタニカルケアシャンプー 業務用1000ml", price: 3440 },
            { cat: "shampoo", maker: "YAY", name: "ダメージケアシャンプー 300ml", price: 1569 },
            { cat: "shampoo", maker: "YAY", name: "ダメージケアシャンプー 500ml", price: 1940 },
            { cat: "shampoo", maker: "YAY", name: "ダメージケアシャンプー 業務用1000ml", price: 3640 },
            { cat: "conditioner", maker: "YAY", name: "ボタニカルケアコンディショナー 300ml", price: 1479 },
            { cat: "conditioner", maker: "YAY", name: "ボタニカルケアコンディショナー 500ml", price: 1780 },
            { cat: "conditioner", maker: "YAY", name: "ボタニカルケアコンディショナー 業務用1000ml", price: 3260 },
            { cat: "conditioner", maker: "YAY", name: "ダメージコンディショナー 300ml", price: 1479 },
            { cat: "conditioner", maker: "YAY", name: "ダメージコンディショナー 500ml", price: 1780 },
            { cat: "conditioner", maker: "YAY", name: "ダメージコンディショナー 業務用1000ml", price: 3260 },
            { cat: "haircare", maker: "YAY", name: "ジェルオイル", price: 1006 },
            { cat: "haircare", maker: "YAY", name: "ユースオイル", price: 1326 },
            { cat: "haircare", maker: "YAY", name: "アンドミー", price: 1008 },
            { cat: "haircare", maker: "ナインヤーズ", name: "cynトリートメント", price: 10000 },
            { cat: "haircare", maker: "ナインヤーズ", name: "ベースウォーター", price: 1670 },
            { cat: "haircare", maker: "ナインヤーズ", name: "yard(大)", price: 1002.5 },
            { cat: "haircare", maker: "ナインヤーズ", name: "yard(小)", price: 652.3 },
            { cat: "color", maker: "MILBON", name: "エノグ オフブラック", price: 525 },
          ];
          for (const s of STORES) {
            for (const fix of priceFixes) {
              const cat2 = merged[s] && merged[s][fix.cat];
              if (!cat2) continue;
              const item = cat2.items.find((i) => i.maker === fix.maker && i.name === fix.name);
              if (item && item.price !== fix.price) {
                item.price = fix.price;
                migrated = true;
              }
            }
          }
        }
        setData(merged);
        setDiagInfo(
          `parsedKeys=${JSON.stringify(Object.keys(parsed))} ` +
            `oldLouieColorItems=${(oldLouieData && oldLouieData.color && oldLouieData.color.items && oldLouieData.color.items.length) || 0} ` +
            `importedFlag=${!!(parsed.VAN && parsed.VAN._importedFromLouie)} ` +
            `VANcolor=${merged.VAN.color.items.length} ` +
            `ダリアcolor=${merged.ダリア.color.items.length} ` +
            `ガモウstraight=${merged.ガモウ.straight.items.length} ` +
            `YAYshampoo=${merged.YAY.shampoo.items.length}`
        );
        if (migrated) {
          persist(merged);
        }
      } catch (e) {
        setLoadError(String((e && e.message) || e) + " | " + String((e && e.stack) || "").slice(0, 200));
        setData(DEFAULT_DATA);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!data) return;
    const makers = data[store][category].makers;
    if (!activeMaker || !makers.some((m) => m.name === activeMaker)) {
      setActiveMaker(makers[0] ? makers[0].name : null);
    }
  }, [store, category, data]);

  useEffect(() => {
    if (!data || !activeMaker) {
      setActiveType(null);
      return;
    }
    const categoryData = data[store][category];
    const makerObjCur = categoryData.makers.find((m) => m.name === activeMaker);
    const types = makerObjCur ? makerObjCur.types : [];
    if (types.length === 0) {
      if (activeType !== null) setActiveType(null);
      return;
    }
    const hasOrphan = categoryData.items.some(
      (i) => i.maker === activeMaker && (!i.type || !types.includes(i.type))
    );
    const avail = hasOrphan ? [...types, ""] : types;
    if (activeType === null || !avail.includes(activeType)) {
      setActiveType(avail[0]);
    }
  }, [store, category, data, activeMaker]);

  function persist(next) {
    setData(next);
    setSaving(true);
    return (async () => {
      let lastErr = null;
      const maxAttempts = 4;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const { error } = await supabase
            .from("oorder_orders")
            .upsert({ id: "main", data: next, updated_at: new Date().toISOString() });
          if (error) throw error;
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e;
          const wait = 400 * Math.pow(1.6, attempt);
          await new Promise((r) => setTimeout(r, wait));
        }
      }
      setSaving(false);
      if (lastErr) {
        setLoadError(
          "保存に失敗しました（何度か再試行しましたがダメでした）：" + String((lastErr && lastErr.message) || lastErr)
        );
      } else if (loadError) {
        setLoadError("");
      }
    })();
  }

  function exportToFile() {
    const json = JSON.stringify(data, null, 2);
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const filename = `louie-orders-${y}-${m}-${d}.json`;
    const blob = new Blob([json], { type: "application/json" });
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExportMsg("書き出しました。");
    } catch (e) {
      setExportMsg("書き出しに失敗しました：" + String((e && e.message) || e));
    }
  }

  function importFromFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed || typeof parsed !== "object") throw new Error("ファイルの中身が正しくありません");
        persist(parsed);
        setExportMsg("読み込みました。");
      } catch (err) {
        setExportMsg("読み込みに失敗しました：" + String((err && err.message) || err));
      }
    };
    reader.onerror = () => {
      setExportMsg("ファイルの読み込み中にエラーが発生しました。");
    };
    reader.readAsText(file);
  }

  function addMaker() {
    const name = newMakerName.trim();
    if (!name) return;
    const next = structuredClone(data);
    const c = next[store][category];
    if (!c.makers.some((m) => m.name === name)) c.makers.push(mk(name, []));
    persist(next);
    setNewMakerName("");
    setAddingMakerOpen(false);
  }

  function deleteMaker(maker) {
    const next = structuredClone(data);
    const c = next[store][category];
    c.makers = c.makers.filter((m) => m.name !== maker);
    persist(next);
  }

  function startRename(maker) {
    setRenamingMaker(maker);
    setRenameValue(maker);
  }

  function saveRename() {
    const newName = renameValue.trim();
    if (!newName || newName === renamingMaker) {
      setRenamingMaker(null);
      return;
    }
    const next = structuredClone(data);
    const c = next[store][category];
    if (c.makers.some((m) => m.name === newName) && newName !== renamingMaker) {
      setRenamingMaker(null);
      return;
    }
    c.makers = c.makers.map((m) => (m.name === renamingMaker ? { ...m, name: newName } : m));
    c.items.forEach((i) => {
      if (i.maker === renamingMaker) i.maker = newName;
    });
    persist(next);
    setRenamingMaker(null);
    if (activeMaker === renamingMaker) setActiveMaker(newName);
  }

  function addType() {
    const name = newTypeName.trim();
    if (!name || !activeMaker) return;
    const next = structuredClone(data);
    const m = next[store][category].makers.find((mm) => mm.name === activeMaker);
    if (m && !m.types.includes(name)) m.types.push(name);
    persist(next);
    setNewTypeName("");
    setAddingTypeOpen(false);
  }

  function deleteType(typeName) {
    const next = structuredClone(data);
    const m = next[store][category].makers.find((mm) => mm.name === activeMaker);
    if (!m) return;
    m.types = m.types.filter((t) => t !== typeName);
    persist(next);
  }

  function startRenameType(typeName) {
    setRenamingType(typeName);
    setRenameTypeValue(typeName);
  }

  function saveRenameType() {
    const newName = renameTypeValue.trim();
    if (!newName || newName === renamingType) {
      setRenamingType(null);
      return;
    }
    const next = structuredClone(data);
    const c = next[store][category];
    const m = c.makers.find((mm) => mm.name === activeMaker);
    if (!m) {
      setRenamingType(null);
      return;
    }
    if (m.types.includes(newName) && newName !== renamingType) {
      setRenamingType(null);
      return;
    }
    m.types = m.types.map((t) => (t === renamingType ? newName : t));
    c.items.forEach((i) => {
      if (i.maker === activeMaker && i.type === renamingType) i.type = newName;
    });
    persist(next);
    setRenamingType(null);
    if (activeType === renamingType) setActiveType(newName);
  }

  function addItem(maker, type) {
    if (!newItem.name.trim()) return;
    const next = structuredClone(data);
    next[store][category].items.push({
      id: "i" + Date.now(),
      maker,
      type: type || "",
      name: newItem.name.trim(),
      stock: Number(newItem.stock) || 0,
      par: Number(newItem.par) || 1,
      unit: newItem.unit || "本",
      color: newItem.color || "#CCCCCC",
      price: Number(newItem.price) || 0,
      used: 0,
    });
    persist(next);
    setNewItem({ name: "", stock: "", par: "", unit: "本", color: "#CCCCCC", price: "" });
    setAddingItemOpen(false);
  }

  function updateItemColor(id, color) {
    const next = structuredClone(data);
    const item = next[store][category].items.find((i) => i.id === id);
    if (item) {
      const prevColor = item.color || "";
      if (prevColor !== color) {
        if (!Array.isArray(next[store].colorHistory)) next[store].colorHistory = [];
        next[store].colorHistory.push({
          id: "clr" + Date.now(),
          category,
          itemId: id,
          itemName: item.name,
          from: prevColor,
          to: color,
          date: new Date().toISOString(),
        });
        if (next[store].colorHistory.length > 100) {
          next[store].colorHistory = next[store].colorHistory.slice(-100);
        }
      }
      item.color = color;
      item.colorManual = true;
    }
    persist(next);
  }

  function moveItem(id, direction) {
    const next = structuredClone(data);
    const catData = next[store][category];
    const items = catData.items;
    const makerObj = catData.makers.find((m) => m.name === activeMaker) || null;
    const mTypes = makerObj ? makerObj.types : [];
    const hasOrphan =
      makerObj &&
      items.some((i) => i.maker === activeMaker && (!i.type || !mTypes.includes(i.type)));
    const availTypes = mTypes.length > 0 ? [...mTypes, ...(hasOrphan ? [""] : [])] : [];
    const matchIdx = [];
    items.forEach((i, idx) => {
      if (i.maker !== activeMaker) return;
      if (availTypes.length > 0 && i.type !== activeType) return;
      matchIdx.push(idx);
    });
    const fullIdx = items.findIndex((i) => i.id === id);
    const pos = matchIdx.indexOf(fullIdx);
    if (pos === -1) return;
    const swapWith = direction === "up" ? pos - 1 : pos + 1;
    if (swapWith < 0 || swapWith >= matchIdx.length) return;
    const idxA = matchIdx[pos];
    const idxB = matchIdx[swapWith];
    const tmp = items[idxA];
    items[idxA] = items[idxB];
    items[idxB] = tmp;
    persist(next);
  }

  function toggleItemUsage(id) {
    const next = structuredClone(data);
    const item = next[store][category].items.find((i) => i.id === id);
    if (item) {
      item.usage = item.usage === "店販" ? "業務" : "店販";
    }
    persist(next);
  }

  function addManualMonthly() {
    const month = manualMonth.trim();
    const gyomu = Number(manualGyomu) || 0;
    const tenhan = Number(manualTenhan) || 0;
    if (!month || (!gyomu && !tenhan)) return;
    const next = structuredClone(data);
    if (!Array.isArray(next[store].manualMonthly)) next[store].manualMonthly = [];
    const existingIdx = next[store].manualMonthly.findIndex((m) => m.month === month);
    if (existingIdx >= 0) {
      next[store].manualMonthly[existingIdx].gyomu = gyomu;
      next[store].manualMonthly[existingIdx].tenhan = tenhan;
    } else {
      next[store].manualMonthly.push({ id: "mm" + Date.now(), month, gyomu, tenhan });
    }
    next[store].manualMonthly.sort((a, b) => (a.month < b.month ? 1 : -1));
    persist(next);
    setManualMonth("");
    setManualGyomu("");
    setManualTenhan("");
  }

  function removeManualMonthly(id) {
    const next = structuredClone(data);
    next[store].manualMonthly = (next[store].manualMonthly || []).filter((m) => m.id !== id);
    persist(next);
  }

  function undoColorChange(entry) {
    const next = structuredClone(data);
    const cat = next[store][entry.category];
    if (cat) {
      const item = cat.items.find((i) => i.id === entry.itemId);
      if (item) item.color = entry.from;
    }
    next[store].colorHistory = (next[store].colorHistory || []).filter((h) => h.id !== entry.id);
    persist(next);
  }

  function startEditItem(item) {
    setEditingItemId(item.id);
    setEditingItemValues({
      stock: String(item.stock),
      par: String(item.par),
      unit: item.unit || "本",
      price: item.price ? String(item.price) : "",
    });
  }

  function saveEditItem() {
    const next = structuredClone(data);
    const item = next[store][category].items.find((i) => i.id === editingItemId);
    if (item) {
      item.stock = Number(editingItemValues.stock) || 0;
      item.par = Number(editingItemValues.par) || 0;
      item.unit = editingItemValues.unit || "本";
      item.price = Number(editingItemValues.price) || 0;
    }
    persist(next);
    setEditingItemId(null);
  }

  function adjustStock(id, delta) {
    const next = structuredClone(data);
    const item = next[store][category].items.find((i) => i.id === id);
    if (item) {
      const par = item.par || 0;
      let shortfall = item.used || 0;
      let surplus = item.surplusOrdered || 0;
      const newStock = Math.max(0, (item.stock || 0) + delta);
      if (delta < 0) {
        if (surplus > 0) {
          // 買い足した余剰分を消費しているだけなので発注対象にはしない
          surplus -= 1;
        } else if (newStock < par) {
          // 基準数を下回った分だけ発注対象としてカウントする
          shortfall += 1;
        }
      } else if (delta > 0) {
        if (shortfall > 0) {
          // 直前のマイナス操作（不足カウント）の取り消し
          shortfall -= 1;
        } else {
          // 基準数を超えて意図的に買い足した分は発注実績としてカウントする
          surplus += 1;
        }
      }
      item.stock = newStock;
      item.used = shortfall;
      item.surplusOrdered = surplus;
    }
    persist(next);
  }

  function isDualUseItem(item) {
    return item.maker === "YAY" || item.maker === "ナインヤーズ";
  }

  function adjustStockDual(id, usageType) {
    const next = structuredClone(data);
    const item = next[store][category].items.find((i) => i.id === id);
    if (item) {
      item.stock = Math.max(0, item.stock - 1);
      if (usageType === "業務") {
        item.usedGyomu = (item.usedGyomu || 0) + 1;
      } else {
        item.usedTenhan = (item.usedTenhan || 0) + 1;
      }
    }
    persist(next);
  }

  function undoStockDual(id) {
    const next = structuredClone(data);
    const item = next[store][category].items.find((i) => i.id === id);
    if (item) {
      item.stock = item.stock + 1;
      if ((item.usedGyomu || 0) > 0) {
        item.usedGyomu -= 1;
      } else if ((item.usedTenhan || 0) > 0) {
        item.usedTenhan -= 1;
      }
    }
    persist(next);
  }

  function deleteItem(id) {
    const next = structuredClone(data);
    next[store][category].items = next[store][category].items.filter((i) => i.id !== id);
    persist(next);
  }

  function openLiveOrderPreview() {
    const items = reorderItems.map((i) => {
      const qty = (i.used || 0) + (i.usedGyomu || 0) + (i.usedTenhan || 0) + (i.surplusOrdered || 0);
      return {
        maker: i.maker,
        type: i.type,
        name: i.name,
        qty,
        unit: i.unit,
        price: i.price || 0,
        subtotal: qty * (i.price || 0),
      };
    });
    const total = items.reduce((s, i) => s + i.subtotal, 0);
    setPreviewOrder({ items, categoryLabel: catMeta.label, date: recordDate, total, confirmed: false });
  }

  function openSupplierWideOrderPreview() {
    const usedItems = getSupplierUsedItems(store);
    const items = usedItems.map((i) => {
      const qty = (i.used || 0) + (i.usedGyomu || 0) + (i.usedTenhan || 0) + (i.surplusOrdered || 0);
      return {
        maker: i.maker,
        type: i.type,
        name: i.name,
        qty,
        unit: i.unit,
        price: i.price || 0,
        subtotal: qty * (i.price || 0),
        categoryLabel: i.categoryLabel,
      };
    });
    const total = items.reduce((s, i) => s + i.subtotal, 0);
    setPreviewOrder({ items, categoryLabel: `${store}　全カテゴリまとめ`, date: recordDate, total, confirmed: false, wide: true });
  }

  function openHistoryPreview(r) {
    const items = r.items.map((i) => ({ ...i, subtotal: i.qty * (i.price || 0) }));
    setPreviewOrder({ items, categoryLabel: r.categoryLabel, date: r.date, total: r.total, confirmed: true });
  }

  function groupOrderItemsByCategory(items, fallbackLabel) {
    const groups = [];
    const byLabel = {};
    items.forEach((i) => {
      const label = i.categoryLabel || fallbackLabel || "品目";
      if (!byLabel[label]) {
        byLabel[label] = { label, items: [], subtotal: 0 };
        groups.push(byLabel[label]);
      }
      byLabel[label].items.push(i);
      byLabel[label].subtotal += i.qty * (i.price || 0);
    });
    return groups;
  }

  function buildOrderMailto(items, categoryLabel, date) {
    const lines = items.map(
      (i) =>
        `${i.categoryLabel ? `[${i.categoryLabel}] ` : ""}${i.maker}${i.type ? "・" + i.type : ""}・${i.name}　${i.qty}${i.unit}`
    );
    const subject = `発注書 ${store} ${categoryLabel} ${date}`;
    const body = `【発注書】${store}　${categoryLabel}　${date}\n\n${lines.join("\n")}`;
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function refreshMakerColors(makerName) {
    const next = structuredClone(data);
    if (!Array.isArray(next[store].colorHistory)) next[store].colorHistory = [];
    let count = 0;
    ["color", "manicure", "straight"].forEach((ck) => {
      const cat = next[store][ck];
      if (!cat) return;
      cat.items.forEach((i) => {
        if (i.maker !== makerName) return;
        const guess = guessItemColor(i.name, i.maker);
        if (guess && guess !== i.color) {
          next[store].colorHistory.push({
            id: "clr" + Date.now() + Math.random().toString(36).slice(2, 6),
            category: ck,
            itemId: i.id,
            itemName: i.name,
            from: i.color || "",
            to: guess,
            date: new Date().toISOString(),
          });
          i.color = guess;
          count++;
        }
      });
    });
    if (next[store].colorHistory.length > 100) {
      next[store].colorHistory = next[store].colorHistory.slice(-100);
    }
    persist(next);
    setColorDebugMsg(`${makerName}の色を${count}件、実物の色味に更新しました`);
  }

  function refreshHoyuColors() {
    refreshMakerColors("hoyu");
  }

  function refreshMilbonColors() {
    refreshMakerColors("MILBON");
  }

  function refreshSomarukaColors() {
    refreshMakerColors("ソマルカ");
  }

  function refreshShiseidoColors() {
    refreshMakerColors("資生堂");
  }

  async function fixAllColorsNow() {
    setColorDebugMsg("保存中…");
    const next = structuredClone(data);
    if (!Array.isArray(next[store].colorHistory)) next[store].colorHistory = [];
    let count = 0;
    let total = 0;
    CATEGORIES.forEach((c) => {
      const ck = c.key;
      const cat = next[store][ck];
      if (!cat) return;
      cat.items.forEach((i) => {
        total++;
        if (i.colorManual) return;
        const guess = guessItemColor(i.name, i.maker);
        if (guess && guess !== i.color) {
          next[store].colorHistory.push({
            id: "clr" + Date.now() + Math.random().toString(36).slice(2, 6),
            category: ck,
            itemId: i.id,
            itemName: i.name,
            from: i.color || "",
            to: guess,
            date: new Date().toISOString(),
          });
          i.color = guess;
          count++;
        }
      });
    });
    if (next[store].colorHistory.length > 100) {
      next[store].colorHistory = next[store].colorHistory.slice(-100);
    }
    next[store]._colorSchemeFixed = true;
    await persist(next);
    setColorDebugMsg(`保存完了：対象${total}件中、${count}件を最新の色に更新しました（この表示が出たら閉じて大丈夫です）`);
  }

  function autoColorItems() {
    const next = structuredClone(data);
    let count = 0;
    let total = 0;
    ["color", "manicure"].forEach((ck) => {
      const cat = next[store][ck];
      if (!cat) return;
      cat.items.forEach((i) => {
        total++;
        if (i.color) return;
        const guess = guessItemColor(i.name, i.maker);
        if (guess) {
          i.color = guess;
          count++;
        }
      });
    });
    persist(next);
    setColorDebugMsg(`対象${total}件中、${count}件に新しく色を設定しました（すでに色がある品目は変更していません）`);
  }

  function applyColorTestData() {
    const next = structuredClone(data);
    next[store].color.items.forEach((i) => {
      i.par = 5;
      i.stock = 5;
    });
    persist(next);
  }

  function getSupplierUsedItems(supplier) {
    const results = [];
    CATEGORIES.forEach((c) => {
      const catData = data[store][c.key];
      if (!catData) return;
      catData.items.forEach((i) => {
        const hasUsage =
          (i.used || 0) > 0 ||
          (i.usedGyomu || 0) > 0 ||
          (i.usedTenhan || 0) > 0 ||
          (i.surplusOrdered || 0) > 0;
        if (hasUsage && supplierForMaker(i.maker) === supplier) {
          results.push({ ...i, categoryKey: c.key, categoryLabel: c.label });
        }
      });
    });
    return results;
  }

  function confirmSupplierOrder(supplier) {
    const items = getSupplierUsedItems(supplier);
    if (items.length === 0) return;
    const stockDeltaById = {};
    const recordItems = items.map((i) => {
      const qty = (i.used || 0) + (i.usedGyomu || 0) + (i.usedTenhan || 0) + (i.surplusOrdered || 0);
      // 在庫への加算は「不足分」のみ。買い足し分(surplusOrdered)は+ボタン操作時点で
      // すでに在庫数へ反映済みのため、ここで再度加算すると二重カウントになる。
      stockDeltaById[i.id] = (i.used || 0) + (i.usedGyomu || 0) + (i.usedTenhan || 0);
      return {
        maker: i.maker,
        type: i.type,
        name: i.name,
        qty,
        unit: i.unit,
        price: i.price || 0,
        subtotal: qty * (i.price || 0),
        categoryLabel: i.categoryLabel,
      };
    });
    const total = recordItems.reduce((sum, i) => sum + i.subtotal, 0);
    const next = structuredClone(data);
    if (!Array.isArray(next[store].orderHistory)) next[store].orderHistory = [];
    next[store].orderHistory.push({
      id: "ord" + Date.now(),
      date: recordDate,
      category: "supplier:" + supplier,
      categoryLabel: `発注先：${supplier}`,
      items: recordItems,
      total,
    });
    const orderedByCategory = {};
    items.forEach((i) => {
      if (!orderedByCategory[i.categoryKey]) orderedByCategory[i.categoryKey] = new Set();
      orderedByCategory[i.categoryKey].add(i.id);
    });
    Object.keys(orderedByCategory).forEach((ck) => {
      next[store][ck].items.forEach((i) => {
        if (orderedByCategory[ck].has(i.id)) {
          i.used = 0;
          i.usedGyomu = 0;
          i.usedTenhan = 0;
          i.surplusOrdered = 0;
          i.stock = (i.stock || 0) + (stockDeltaById[i.id] || 0);
        }
      });
    });
    persist(next);
    setShowSupplierOrder(false);
  }

  function confirmOrder() {
    const catData = data[store][category];
    const items = catData.items.filter(
      (i) =>
        (i.used || 0) > 0 ||
        (i.usedGyomu || 0) > 0 ||
        (i.usedTenhan || 0) > 0 ||
        (i.surplusOrdered || 0) > 0
    );
    if (items.length === 0) return;
    const recordItems = [];
    items.forEach((i) => {
      if (isDualUseItem(i)) {
        if ((i.usedGyomu || 0) > 0) {
          recordItems.push({
            maker: i.maker,
            type: i.type,
            name: i.name,
            qty: i.usedGyomu,
            unit: i.unit,
            price: i.price || 0,
            subtotal: i.usedGyomu * (i.price || 0),
            usage: "業務",
          });
        }
        if ((i.usedTenhan || 0) > 0) {
          recordItems.push({
            maker: i.maker,
            type: i.type,
            name: i.name,
            qty: i.usedTenhan,
            unit: i.unit,
            price: i.price || 0,
            subtotal: i.usedTenhan * (i.price || 0),
            usage: "店販",
          });
        }
      } else {
        const qty = (i.used || 0) + (i.surplusOrdered || 0);
        recordItems.push({
          maker: i.maker,
          type: i.type,
          name: i.name,
          qty,
          unit: i.unit,
          price: i.price || 0,
          subtotal: qty * (i.price || 0),
          usage: i.usage || "業務",
        });
      }
    });
    const total = recordItems.reduce((sum, i) => sum + i.subtotal, 0);
    const next = structuredClone(data);
    if (!Array.isArray(next[store].orderHistory)) next[store].orderHistory = [];
    next[store].orderHistory.push({
      id: "ord" + Date.now(),
      date: recordDate,
      category,
      categoryLabel: CATEGORIES.find((c) => c.key === category).label,
      items: recordItems,
      total,
    });
    const orderedIds = new Set(items.map((i) => i.id));
    const orderQtyById = {};
    items.forEach((i) => {
      // 在庫への加算は「不足分（used/usedGyomu/usedTenhan）」のみ。
      // 買い足し分(surplusOrdered)は+ボタン操作時点ですでに在庫に反映済みのため対象外。
      orderQtyById[i.id] = (i.used || 0) + (i.usedGyomu || 0) + (i.usedTenhan || 0);
    });
    next[store][category].items.forEach((i) => {
      if (orderedIds.has(i.id)) {
        i.used = 0;
        i.usedGyomu = 0;
        i.usedTenhan = 0;
        i.surplusOrdered = 0;
        i.stock = (i.stock || 0) + (orderQtyById[i.id] || 0);
      }
    });
    persist(next);
    setShowOrderPreview(false);
  }

  function deleteOrderRecord(id) {
    const next = structuredClone(data);
    next[store].orderHistory = (next[store].orderHistory || []).filter((r) => r.id !== id);
    persist(next);
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#8A7355]" size={28} />
      </div>
    );
  }

  const catMeta = CATEGORIES.find((c) => c.key === category);
  const categoryData = data[store][category];
  const lowCount = categoryData.items.filter((i) => i.par > 0 && i.stock <= i.par * 0.34).length;
  const reorderItems = categoryData.items.filter(
    (i) =>
      (i.used || 0) > 0 ||
      (i.usedGyomu || 0) > 0 ||
      (i.usedTenhan || 0) > 0 ||
      (i.surplusOrdered || 0) > 0
  );
  const reorderTotal = reorderItems.reduce((sum, i) => {
    const qty = (i.used || 0) + (i.usedGyomu || 0) + (i.usedTenhan || 0) + (i.surplusOrdered || 0);
    return sum + qty * (i.price || 0);
  }, 0);
  const orderHistory = data[store].orderHistory || [];
  const filteredHistory = orderHistory
    .filter((r) => r.date >= historyFrom && r.date <= historyTo)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const historyTotal = filteredHistory.reduce((sum, r) => sum + r.total, 0);
  const grandTotals = {};
  let grandTotalAll = 0;
  let usageGyomu = 0;
  let usageTenhan = 0;
  STORES.forEach((sup) => {
    const hist = (data[sup] && data[sup].orderHistory) || [];
    const inRange = hist.filter((r) => r.date >= historyFrom && r.date <= historyTo);
    let t = inRange.reduce((sum, r) => sum + r.total, 0);
    const fromMonth = historyFrom.slice(0, 7);
    const toMonth = historyTo.slice(0, 7);
    ((data[sup] && data[sup].manualMonthly) || []).forEach((m) => {
      if (m.month >= fromMonth && m.month <= toMonth) {
        const g = m.gyomu || 0;
        const tn = m.tenhan || 0;
        t += g + tn;
        usageGyomu += g;
        usageTenhan += tn;
      }
    });
    grandTotals[sup] = t;
    grandTotalAll += t;
    inRange.forEach((r) => {
      (r.items || []).forEach((it2) => {
        if ((it2.usage || "業務") === "店販") usageTenhan += it2.subtotal || 0;
        else usageGyomu += it2.subtotal || 0;
      });
    });
  });
  const makerObjCur = categoryData.makers.find((m) => m.name === activeMaker) || null;
  const makerTypes = makerObjCur ? makerObjCur.types : [];
  const hasOrphanType =
    makerObjCur &&
    categoryData.items.some(
      (i) => i.maker === activeMaker && (!i.type || !makerTypes.includes(i.type))
    );
  const availableTypeValues = makerTypes.length > 0 ? [...makerTypes, ...(hasOrphanType ? [""] : [])] : [];
  const visibleItems = categoryData.items.filter((i) => {
    if (i.maker !== activeMaker) return false;
    if (availableTypeValues.length === 0) return true;
    return i.type === activeType;
  });

  return (
    <div className="min-h-screen bg-[#F5F3EF] font-sans">
      {loadError && (
        <div className="bg-[#B4432F] text-white px-4 py-3 text-[12px] font-mono break-all">
          エラー：{loadError}
        </div>
      )}
      {diagInfo && (
        <div className="bg-[#2A5A4A] text-white px-4 py-2 text-[10px] font-mono break-all">
          診断：{diagInfo}
        </div>
      )}
      {/* Header */}
      <div className="bg-[#232323] text-[#F5F3EF] px-5 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-4">
          <Package size={20} strokeWidth={1.5} />
          <h1 className="text-lg tracking-wide font-serif">OORDER 発注管理</h1>
          <span className="ml-auto text-[11px] text-[#9A9A9A] font-mono">
            {saving ? "保存中…" : loadError ? "保存エラー" : "同期済み"}
          </span>
        </div>
        <div className="flex gap-2 mb-3 flex-wrap">
          <button
            onClick={exportToFile}
            className="px-3 py-1.5 rounded-lg text-[11px] font-mono border border-[#4A4A4A] text-[#F5F3EF]"
          >
            バックアップを書き出す
          </button>
          <button
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className="px-3 py-1.5 rounded-lg text-[11px] font-mono border border-[#4A4A4A] text-[#F5F3EF]"
          >
            バックアップから読み込む
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files && e.target.files[0];
              if (f) importFromFile(f);
              e.target.value = "";
            }}
          />
        </div>
        {exportMsg && (
          <div className="text-[11px] font-mono text-[#C9C9C9] mb-3">{exportMsg}</div>
        )}
        <div className="flex gap-1.5">
          {STORES.map((s) => (
            <button
              key={s}
              onClick={() => {
                setStore(s);
                const allowed = categoriesForSupplier(s);
                if (!allowed.some((c) => c.key === category)) {
                  setCategory(allowed[0].key);
                }
              }}
              className={`px-3.5 py-1.5 text-sm rounded-full transition-colors ${
                store === s
                  ? "bg-[#F5F3EF] text-[#232323] font-medium"
                  : "bg-[#3A3A3A] text-[#C9C9C9]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={openSupplierWideOrderPreview}
          className="mt-3 w-full py-2.5 rounded-lg bg-[#F5F3EF] text-[#232323] text-sm font-medium flex items-center justify-center gap-2"
        >
          <Mail size={15} />
          {store} 全体の発注書を作る
        </button>
        <button
          onClick={() => setShowHistory((v) => !v)}
          className="mt-3 text-[11px] font-mono text-[#C9C9C9] underline underline-offset-2"
        >
          {showHistory ? "発注履歴を閉じる" : "発注履歴を見る"}
        </button>
      </div>

      {/* Order history with date range */}
      {showHistory && (
        <div className="mx-5 mt-4 rounded-xl border border-[#E4E0D6] bg-white p-3">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#9A9A9A] mb-2">
            {store} 発注履歴
          </div>
          <div className="flex items-center gap-2 mb-3">
            <input
              type="date"
              value={historyFrom}
              onChange={(e) => setHistoryFrom(e.target.value)}
              className="flex-1 px-2 py-1.5 text-[12px] font-mono rounded-lg border border-[#E4E0D6] outline-none"
            />
            <span className="text-[#9A9A9A] text-[12px]">〜</span>
            <input
              type="date"
              value={historyTo}
              onChange={(e) => setHistoryTo(e.target.value)}
              className="flex-1 px-2 py-1.5 text-[12px] font-mono rounded-lg border border-[#E4E0D6] outline-none"
            />
          </div>
          <div className="flex items-center justify-between text-[13px] font-mono font-semibold pb-2 mb-2 border-b border-[#E4E0D6]">
            <span className="text-[#232323]">{store}・期間合計（{filteredHistory.length}件）</span>
            <span className="text-[#9D3B4A]">¥{historyTotal.toLocaleString()}</span>
          </div>
          <div className="mb-3 rounded-lg bg-[#FAF9F6] p-2 space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#9A9A9A] mb-1">
              全発注先の合計（同じ期間）
            </div>
            {STORES.map((sup) => (
              <div key={sup} className="flex items-center justify-between text-[11px] font-mono text-[#5A5A5A]">
                <span>{sup}</span>
                <span>¥{(grandTotals[sup] || 0).toLocaleString()}</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-[12px] font-mono font-semibold pt-1 mt-1 border-t border-[#E4E0D6]">
              <span className="text-[#232323]">合計</span>
              <span className="text-[#9D3B4A]">¥{grandTotalAll.toLocaleString()}</span>
            </div>
          </div>
          <div className="mb-3 rounded-lg bg-[#FAF9F6] p-2 space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#9A9A9A] mb-1">
              業務・店販の内訳（同じ期間）
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-[#5A5A5A]">
              <span>業務</span>
              <span>¥{usageGyomu.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-[#5A5A5A]">
              <span>店販</span>
              <span>¥{usageTenhan.toLocaleString()}</span>
            </div>
          </div>
          {filteredHistory.length === 0 ? (
            <div className="text-center text-[#999] text-[12px] font-mono py-4">
              この期間の発注記録はありません
            </div>
          ) : (
            <div className="space-y-2">
              {filteredHistory.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between text-[12px] font-mono bg-[#FAF9F6] rounded-lg px-3 py-2"
                >
                  <button
                    onClick={() => openHistoryPreview(r)}
                    className="text-[#5A5A5A] text-left flex-1 min-w-0 truncate"
                  >
                    {r.date} ・ {r.categoryLabel} ・ {r.items.length}品目
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[#232323] font-semibold">¥{r.total.toLocaleString()}</span>
                    <a
                      href={buildOrderMailto(r.items, r.categoryLabel, r.date)}
                      className="text-[#5A5A5A]"
                    >
                      <Mail size={13} />
                    </a>
                    <button
                      onClick={() => deleteOrderRecord(r.id)}
                      className="text-[#C7A9A0]"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(store === "ガモウ" || store === "ダリア") && (
        <div className="mx-5 mt-4 rounded-xl border border-[#E4E0D6] bg-white p-4">
          <div className="text-[13px] font-mono text-[#232323] mb-2">
            {store}は既存の発注システムを使うため、月ごとの金額だけ入力します
          </div>
          <div className="flex gap-2 mb-2">
            <input
              type="month"
              value={manualMonth}
              onChange={(e) => setManualMonth(e.target.value)}
              className="flex-1 border border-[#E4E0D6] rounded-lg px-3 py-2 text-[13px] font-mono"
            />
          </div>
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <div className="text-[10px] font-mono text-[#9A9A9A] mb-1">業務</div>
              <input
                type="number"
                placeholder="金額"
                value={manualGyomu}
                onChange={(e) => setManualGyomu(e.target.value)}
                className="w-full border border-[#E4E0D6] rounded-lg px-3 py-2 text-[13px] font-mono"
              />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-mono text-[#9A9A9A] mb-1">店販</div>
              <input
                type="number"
                placeholder="金額"
                value={manualTenhan}
                onChange={(e) => setManualTenhan(e.target.value)}
                className="w-full border border-[#E4E0D6] rounded-lg px-3 py-2 text-[13px] font-mono"
              />
            </div>
            <button
              onClick={addManualMonthly}
              className="px-4 py-2 rounded-lg text-[13px] font-medium text-white shrink-0 self-end"
              style={{ background: "#232323" }}
            >
              保存
            </button>
          </div>
          <div className="space-y-1.5">
            {(data[store].manualMonthly || []).length === 0 ? (
              <div className="text-[12px] font-mono text-[#9A9A9A]">まだ入力がありません</div>
            ) : (
              (data[store].manualMonthly || []).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between text-[13px] font-mono bg-[#FAF9F6] rounded-lg px-3 py-2"
                >
                  <span className="text-[#5A5A5A]">{m.month}</span>
                  <span className="text-[#232323] text-[11px]">
                    業務¥{(m.gyomu || 0).toLocaleString()} / 店販¥{(m.tenhan || 0).toLocaleString()}
                  </span>
                  <button onClick={() => removeManualMonthly(m.id)} className="text-[#C7A9A0]">
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex overflow-x-auto gap-2 px-5 py-3 bg-[#EDEAE3] border-b border-[#DDD8CE]">
        {categoriesForSupplier(store).map((c) => (
          <button
            key={c.key}
            onClick={() => {
              setCategory(c.key);
              setAddingMakerOpen(false);
              setAddingItemOpen(false);
              setEditMakers(false);
              setRenamingMaker(null);
              setEditTypes(false);
              setAddingTypeOpen(false);
              setRenamingType(null);
              setShowOrderPreview(false);
              setEditingItemId(null);
              setColorDebugMsg("");
              setShowColorHistory(false);
            }}
            className="shrink-0 px-3 py-1.5 rounded-lg text-sm border transition-colors"
            style={{
              borderColor: category === c.key ? c.accent : "#DDD8CE",
              background: category === c.key ? c.light : "transparent",
              color: category === c.key ? c.accent : "#6B6B6B",
              fontWeight: category === c.key ? 600 : 400,
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {(category === "color" || category === "manicure") && (
        <div className="mx-5 mt-4">
          <button
            onClick={() => setShowColorHistory((v) => !v)}
            className="text-[11px] font-mono text-[#9A9A9A] underline underline-offset-2"
          >
            {showColorHistory ? "色の変更履歴を閉じる" : "色の変更履歴を見る（元に戻せます）"}
          </button>
          {showColorHistory && (
            <div className="mt-2 rounded-xl border border-[#E4E0D6] bg-white p-3">
              {(data[store].colorHistory || []).length === 0 ? (
                <div className="text-center text-[#999] text-[12px] font-mono py-3">
                  まだ色の変更履歴はありません
                </div>
              ) : (
                <div className="space-y-2">
                  {[...(data[store].colorHistory || [])]
                    .reverse()
                    .slice(0, 30)
                    .map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between text-[12px] font-mono bg-[#FAF9F6] rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-4 h-4 rounded-full border border-[#E4E0D6] shrink-0"
                            style={{ background: h.from || "#CCCCCC" }}
                          />
                          <span className="text-[#9A9A9A]">→</span>
                          <span
                            className="w-4 h-4 rounded-full border border-[#E4E0D6] shrink-0"
                            style={{ background: h.to || "#CCCCCC" }}
                          />
                          <span className="text-[#5A5A5A] truncate">{h.itemName}</span>
                        </div>
                        <button
                          onClick={() => undoColorChange(h)}
                          className="text-[#9D3B4A] shrink-0 ml-2"
                        >
                          元に戻す
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Alert bar */}
      {lowCount > 0 && (
        <div className="mx-5 mt-4 flex items-center gap-2 text-sm text-[#8A3B2A] bg-[#FBEDE8] border border-[#EFD3C6] rounded-lg px-3 py-2">
          <AlertTriangle size={15} />
          <span>{catMeta.label}で在庫が少ない品目が {lowCount} 件あります</span>
        </div>
      )}

      {/* Order amount preview */}
      {reorderItems.length > 0 && (
        <div className="mx-5 mt-3 rounded-xl border border-[#E4E0D6] bg-white overflow-hidden">
          <button
            onClick={() => setShowOrderPreview((v) => !v)}
            className="w-full flex items-center gap-2 px-4 py-2.5"
            style={{ background: catMeta.light }}
          >
            <ChevronDown
              size={14}
              style={{
                color: catMeta.accent,
                transform: showOrderPreview ? "rotate(0deg)" : "rotate(-90deg)",
                transition: "transform 150ms ease",
              }}
            />
            <span className="text-[12px] font-mono" style={{ color: catMeta.accent }}>
              使用した品目 {reorderItems.length} 件
            </span>
            <span className="ml-auto text-[13px] font-mono font-semibold" style={{ color: catMeta.accent }}>
              ¥{reorderTotal.toLocaleString()}
            </span>
          </button>
          {showOrderPreview && (
            <div className="p-3 space-y-1.5">
              {reorderItems.map((i) => {
                const qty = (i.used || 0) + (i.usedGyomu || 0) + (i.usedTenhan || 0) + (i.surplusOrdered || 0);
                return (
                  <div key={i.id} className="flex items-center justify-between text-[12px] font-mono">
                    <span className="text-[#5A5A5A] truncate">
                      {i.maker}
                      {i.type ? `・${i.type}` : ""}・{i.name}
                      {isDualUseItem(i) && (i.usedGyomu || 0) > 0 && (i.usedTenhan || 0) > 0
                        ? `（業${i.usedGyomu}/店${i.usedTenhan}）`
                        : ""}
                    </span>
                    <span className="text-[#9A9A9A] shrink-0 ml-2">
                      {qty}
                      {i.unit} × ¥{(i.price || 0).toLocaleString()} = ¥
                      {(qty * (i.price || 0)).toLocaleString()}
                    </span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between text-[13px] font-mono font-semibold pt-2 border-t border-[#E4E0D6] mt-2">
                <span className="text-[#232323]">合計</span>
                <span style={{ color: catMeta.accent }}>¥{reorderTotal.toLocaleString()}</span>
              </div>
              <div className="mt-2 pt-2 text-[11px] font-mono text-[#9A9A9A] text-center">
                発注書は「{store} 全体の発注書を作る」からまとめて作成してください
              </div>
            </div>
          )}
        </div>
      )}

      {/* Maker tabs */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#9A9A9A]">
            {catMeta.label} メーカー
          </span>
          <button
            onClick={() => {
              setEditMakers((v) => !v);
              setRenamingMaker(null);
            }}
            className="text-[11px] font-mono px-2 py-1 rounded-md"
            style={{
              color: editMakers ? "#FFF" : catMeta.accent,
              background: editMakers ? catMeta.accent : "transparent",
            }}
          >
            {editMakers ? "完了" : "編集"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {categoryData.makers.map((makerObj) => {
            const maker = makerObj.name;
            const makerItems = categoryData.items.filter((i) => i.maker === maker);
            const makerLow = makerItems.filter((i) => i.par > 0 && i.stock <= i.par * 0.34).length;
            const isActive = activeMaker === maker;

            if (renamingMaker === maker) {
              return (
                <div
                  key={maker}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-full border bg-white"
                  style={{ borderColor: catMeta.accent }}
                >
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveRename()}
                    autoFocus
                    className="w-24 px-1 text-[12px] font-mono outline-none bg-transparent"
                  />
                  <button onClick={saveRename} className="text-[#4C7A4F] shrink-0">
                    <Check size={13} />
                  </button>
                  <button onClick={() => setRenamingMaker(null)} className="text-[#B39B8A] shrink-0">
                    <X size={12} />
                  </button>
                </div>
              );
            }

            return (
              <button
                key={maker}
                onClick={() => {
                  if (editMakers) {
                    startRename(maker);
                  } else {
                    setActiveMaker(maker);
                    setEditTypes(false);
                    setAddingTypeOpen(false);
                    setRenamingType(null);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] border transition-colors"
                style={{
                  borderColor: isActive ? catMeta.accent : "#DDD8CE",
                  background: isActive ? catMeta.accent : "#FFF",
                  color: isActive ? "#FFF" : "#5A5A5A",
                }}
              >
                {maker}
                {makerLow > 0 && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: isActive ? "#FFF" : "#B4432F" }}
                  />
                )}
                {editMakers && (
                  <Pencil size={10} style={{ color: isActive ? "#FFF" : catMeta.accent, opacity: 0.75 }} />
                )}
                {editMakers && makerItems.length === 0 && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMaker(maker);
                    }}
                    style={{ color: isActive ? "#FFF" : "#B39B8A" }}
                  >
                    <X size={12} />
                  </span>
                )}
              </button>
            );
          })}

          <button
            onClick={() => setAddingMakerOpen((v) => !v)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] border border-dashed"
            style={{ borderColor: "#C9C2B2", color: "#8A7355" }}
          >
            <Plus size={13} /> メーカー追加
          </button>
        </div>

        {addingMakerOpen && (
          <div className="mt-2 flex gap-2">
            <input
              value={newMakerName}
              onChange={(e) => setNewMakerName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMaker()}
              placeholder="メーカー名（例：MILBON）"
              autoFocus
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-[#E4E0D6] outline-none focus:border-[#8A7355]"
            />
            <button
              onClick={addMaker}
              className="px-4 py-2 rounded-lg bg-[#232323] text-[#F5F3EF] text-sm font-medium"
            >
              追加
            </button>
            <button
              onClick={() => {
                setAddingMakerOpen(false);
                setNewMakerName("");
              }}
              className="px-3 py-2 rounded-lg border border-[#E4E0D6] text-[#8A8A8A] text-sm"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Type/series tabs (only if the active maker has registered types) */}
      {activeMaker && (makerTypes.length > 0 || editTypes || addingTypeOpen) && (
        <div className="px-5 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#B7AF9E]">
              {activeMaker} シリーズ
            </span>
            {makerTypes.length > 0 && (
              <button
                onClick={() => {
                  setEditTypes((v) => !v);
                  setRenamingType(null);
                }}
                className="text-[11px] font-mono px-2 py-1 rounded-md"
                style={{
                  color: editTypes ? "#FFF" : catMeta.accent,
                  background: editTypes ? catMeta.accent : "transparent",
                }}
              >
                {editTypes ? "完了" : "編集"}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {availableTypeValues.map((t) => {
              const label = t === "" ? "未分類" : SERIES_DISPLAY_LABELS[t] || t;
              const isActiveT = activeType === t;
              const typeItems = categoryData.items.filter((i) => i.maker === activeMaker && i.type === t);

              if (renamingType === t && t !== "") {
                return (
                  <div
                    key={t || "__none__"}
                    className="flex items-center gap-1 px-2 py-1 rounded-full border bg-white"
                    style={{ borderColor: catMeta.accent }}
                  >
                    <input
                      value={renameTypeValue}
                      onChange={(e) => setRenameTypeValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveRenameType()}
                      autoFocus
                      className="w-20 px-1 text-[11px] font-mono outline-none bg-transparent"
                    />
                    <button onClick={saveRenameType} className="text-[#4C7A4F] shrink-0">
                      <Check size={12} />
                    </button>
                    <button onClick={() => setRenamingType(null)} className="text-[#B39B8A] shrink-0">
                      <X size={11} />
                    </button>
                  </div>
                );
              }

              return (
                <button
                  key={t || "__none__"}
                  onClick={() => {
                    if (editTypes && t !== "") startRenameType(t);
                    else setActiveType(t);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] border transition-colors"
                  style={{
                    borderColor: isActiveT ? catMeta.accent : "#E4E0D6",
                    background: isActiveT ? catMeta.accent : "#FAF9F6",
                    color: isActiveT ? "#FFF" : "#6B6B6B",
                  }}
                >
                  {label}
                  {editTypes && t !== "" && (
                    <Pencil size={9} style={{ color: isActiveT ? "#FFF" : catMeta.accent, opacity: 0.75 }} />
                  )}
                  {editTypes && t !== "" && typeItems.length === 0 && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteType(t);
                      }}
                      style={{ color: isActiveT ? "#FFF" : "#B39B8A" }}
                    >
                      <X size={11} />
                    </span>
                  )}
                </button>
              );
            })}

            <button
              onClick={() => setAddingTypeOpen((v) => !v)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] border border-dashed"
              style={{ borderColor: "#C9C2B2", color: "#8A7355" }}
            >
              <Plus size={11} /> シリーズ追加
            </button>
          </div>

          {addingTypeOpen && (
            <div className="mt-2 flex gap-2">
              <input
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addType()}
                placeholder="シリーズ名（例：オルディーブ）"
                autoFocus
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-[#E4E0D6] outline-none focus:border-[#8A7355]"
              />
              <button
                onClick={addType}
                className="px-4 py-2 rounded-lg bg-[#232323] text-[#F5F3EF] text-sm font-medium"
              >
                追加
              </button>
              <button
                onClick={() => {
                  setAddingTypeOpen(false);
                  setNewTypeName("");
                }}
                className="px-3 py-2 rounded-lg border border-[#E4E0D6] text-[#8A8A8A] text-sm"
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}

      {/* Items for selected maker */}
      <div className="px-5 py-4">
        {!activeMaker ? (
          <div className="text-center text-[#999] text-sm py-10 font-mono">
            上の「メーカー追加」からメーカーを登録してください
          </div>
        ) : (
          <>
            <div className="space-y-2.5">
              {visibleItems.length === 0 && (
                <div className="text-center text-[#999] text-sm py-6 font-mono">
                  {activeMaker}
                  {availableTypeValues.length > 0 ? `（${activeType === "" ? "未分類" : (SERIES_DISPLAY_LABELS[activeType] || activeType)}）` : ""}
                  の品目はまだありません
                </div>
              )}
              {visibleItems.map((item) => {
                  const stockColor = levelColor(item.stock, item.par);
                  const pct = Math.min(100, Math.round((item.stock / Math.max(item.par, 1)) * 100));
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl border border-[#E4E0D6] px-4 py-3 flex items-center gap-3"
                    >
                      <div className="relative w-2 h-11 rounded-full bg-[#EEEBE3] overflow-hidden shrink-0">
                        <div
                          className="absolute bottom-0 w-full rounded-full transition-all"
                          style={{ height: `${pct}%`, background: stockColor }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 min-w-0">
                          <label className="relative w-6 h-6 rounded-full border border-[#E4E0D6] shrink-0 overflow-hidden mt-0.5" style={{ background: item.color || "#CCCCCC" }}>
                            <input
                              type="color"
                              value={item.color || "#CCCCCC"}
                              onChange={(e) => updateItemColor(item.id, e.target.value)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                          </label>
                          <div className="text-[#232323] text-sm font-medium break-words">
                            {(item.name.match(/^(.*?)[\s　]*((?:業務用)?\d+m[lL])$/) || [])[1] || item.name}
                          </div>
                          {(item.name.match(/((?:業務用)?\d+m[lL])$/) || [])[1] && (
                            <span className="shrink-0 text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#F0EEE7] text-[#5A5A5A]">
                              {(item.name.match(/((?:業務用)?\d+m[lL])$/) || [])[1]}
                            </span>
                          )}
                        </div>
                        {editingItemId === item.id ? (
                          <div className="mt-1 space-y-1.5 bg-[#FAF9F6] rounded-lg border border-[#E4E0D6] p-2">
                            <div className="flex gap-1.5">
                              <input
                                value={editingItemValues.stock}
                                onChange={(e) =>
                                  setEditingItemValues({ ...editingItemValues, stock: e.target.value })
                                }
                                placeholder="現在庫"
                                inputMode="numeric"
                                autoFocus
                                className="w-1/4 px-1.5 py-1 text-[11px] font-mono rounded border border-[#E4E0D6] outline-none"
                              />
                              <input
                                value={editingItemValues.par}
                                onChange={(e) =>
                                  setEditingItemValues({ ...editingItemValues, par: e.target.value })
                                }
                                placeholder="基準数"
                                inputMode="numeric"
                                className="w-1/4 px-1.5 py-1 text-[11px] font-mono rounded border border-[#E4E0D6] outline-none"
                              />
                              <input
                                value={editingItemValues.unit}
                                onChange={(e) =>
                                  setEditingItemValues({ ...editingItemValues, unit: e.target.value })
                                }
                                placeholder="単位"
                                className="w-1/4 px-1.5 py-1 text-[11px] font-mono rounded border border-[#E4E0D6] outline-none"
                              />
                              <input
                                value={editingItemValues.price}
                                onChange={(e) =>
                                  setEditingItemValues({ ...editingItemValues, price: e.target.value })
                                }
                                onKeyDown={(e) => e.key === "Enter" && saveEditItem()}
                                placeholder="単価¥"
                                inputMode="numeric"
                                className="w-1/4 px-1.5 py-1 text-[11px] font-mono rounded border border-[#E4E0D6] outline-none"
                              />
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                onClick={saveEditItem}
                                className="flex-1 py-1 rounded-md bg-[#232323] text-[#F5F3EF] text-[11px] font-medium"
                              >
                                保存
                              </button>
                              <button
                                onClick={() => setEditingItemId(null)}
                                className="px-2 py-1 rounded-md border border-[#E4E0D6] text-[#8A8A8A] text-[11px]"
                              >
                                キャンセル
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditItem(item)}
                            className="text-[11px] text-[#9A9A9A] font-mono mt-0.5 inline-flex items-center gap-1"
                          >
                            基準 {item.par}
                            {item.unit}
                            <span className="text-[#C9C2B2]">
                              ・¥{item.price ? item.price.toLocaleString() : "未設定"}
                            </span>
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isDualUseItem(item) ? (
                          <>
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => adjustStockDual(item.id, "業務")}
                                className="px-2 py-1 rounded-md bg-[#F0EEE7] text-[9px] font-mono text-[#5A5A5A] active:scale-95"
                              >
                                −業務
                              </button>
                              <button
                                onClick={() => adjustStockDual(item.id, "店販")}
                                className="px-2 py-1 rounded-md bg-[#F0EEE7] text-[9px] font-mono text-[#5A5A5A] active:scale-95"
                              >
                                −店販
                              </button>
                            </div>
                            <div className="flex flex-col items-center w-14">
                              <span className="font-mono text-base font-semibold" style={{ color: stockColor }}>
                                {item.stock}
                              </span>
                              {((item.usedGyomu || 0) > 0 || (item.usedTenhan || 0) > 0) && (
                                <span className="text-[9px] font-mono text-[#9D3B4A] leading-none text-center">
                                  業{item.usedGyomu || 0}/店{item.usedTenhan || 0}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => undoStockDual(item.id)}
                              className="w-7 h-7 rounded-full bg-[#F0EEE7] flex items-center justify-center text-[#5A5A5A] active:scale-95"
                            >
                              <Plus size={13} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => adjustStock(item.id, -1)}
                              className="w-7 h-7 rounded-full bg-[#F0EEE7] flex items-center justify-center text-[#5A5A5A] active:scale-95"
                            >
                              <Minus size={13} />
                            </button>
                            <div className="flex flex-col items-center w-9">
                              <span className="font-mono text-base font-semibold" style={{ color: stockColor }}>
                                {item.stock}
                              </span>
                              {item.used > 0 && (
                                <span className="text-[9px] font-mono text-[#9D3B4A] leading-none">
                                  不足{item.used}
                                </span>
                              )}
                              {(item.surplusOrdered || 0) > 0 && (
                                <span className="text-[9px] font-mono text-[#3B7A57] leading-none">
                                  追加{item.surplusOrdered}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => adjustStock(item.id, 1)}
                              className="w-7 h-7 rounded-full bg-[#F0EEE7] flex items-center justify-center text-[#5A5A5A] active:scale-95"
                            >
                              <Plus size={13} />
                            </button>
                          </>
                        )}
                        <div className="flex flex-col ml-1">
                          <button
                            onClick={() => moveItem(item.id, "up")}
                            className="w-6 h-5 flex items-center justify-center text-[#9A9A9A] active:scale-95"
                          >
                            <ChevronDown size={13} style={{ transform: "rotate(180deg)" }} />
                          </button>
                          <button
                            onClick={() => moveItem(item.id, "down")}
                            className="w-6 h-5 flex items-center justify-center text-[#9A9A9A] active:scale-95"
                          >
                            <ChevronDown size={13} />
                          </button>
                        </div>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="w-6 h-6 flex items-center justify-center text-[#C7A9A0] ml-1"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="mt-3">
              {addingItemOpen ? (
                <div className="bg-white rounded-xl border border-[#E4E0D6] p-4 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <label className="relative w-9 h-9 rounded-full border border-[#E4E0D6] shrink-0 overflow-hidden" style={{ background: newItem.color || "#CCCCCC" }}>
                      <input
                        type="color"
                        value={newItem.color}
                        onChange={(e) => setNewItem({ ...newItem, color: e.target.value })}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </label>
                    <span className="text-[12px] text-[#9A9A9A]">色を選択（任意）</span>
                  </div>
                  <input
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="品目名（例：8-10レベル）"
                    autoFocus
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#E4E0D6] outline-none focus:border-[#8A7355]"
                  />
                  <div className="flex gap-2">
                    <input
                      value={newItem.stock}
                      onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
                      placeholder="現在庫"
                      inputMode="numeric"
                      className="w-1/3 px-3 py-2 text-sm rounded-lg border border-[#E4E0D6] outline-none focus:border-[#8A7355]"
                    />
                    <input
                      value={newItem.par}
                      onChange={(e) => setNewItem({ ...newItem, par: e.target.value })}
                      placeholder="基準数"
                      inputMode="numeric"
                      className="w-1/3 px-3 py-2 text-sm rounded-lg border border-[#E4E0D6] outline-none focus:border-[#8A7355]"
                    />
                    <input
                      value={newItem.unit}
                      onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                      placeholder="単位"
                      className="w-1/3 px-3 py-2 text-sm rounded-lg border border-[#E4E0D6] outline-none focus:border-[#8A7355]"
                    />
                  </div>
                  <input
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    placeholder="仕入単価（円・任意）"
                    inputMode="numeric"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#E4E0D6] outline-none focus:border-[#8A7355]"
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => addItem(activeMaker, activeType)}
                      className="flex-1 py-2 rounded-lg bg-[#232323] text-[#F5F3EF] text-sm font-medium"
                    >
                      追加する
                    </button>
                    <button
                      onClick={() => setAddingItemOpen(false)}
                      className="px-4 py-2 rounded-lg border border-[#E4E0D6] text-[#8A8A8A] text-sm"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setNewItem({ name: "", stock: "", par: "", unit: "本", color: "#CCCCCC", price: "" });
                    setAddingItemOpen(true);
                  }}
                  className="w-full py-2.5 rounded-xl border border-dashed border-[#C9C2B2] text-[#8A7355] text-sm flex items-center justify-center gap-1.5"
                >
                  <Plus size={15} />
                  {activeMaker}
                  {availableTypeValues.length > 0 ? `（${activeType === "" ? "未分類" : (SERIES_DISPLAY_LABELS[activeType] || activeType)}）` : ""}
                  に品目を追加
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Formatted order-sheet preview modal */}
      {previewOrder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg max-h-[88vh] rounded-t-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#E4E0D6] px-5 py-4 flex items-center justify-between">
              <span className="font-serif text-lg text-[#232323]">発注書</span>
              <button
                onClick={() => setPreviewOrder(null)}
                className="w-8 h-8 rounded-full bg-[#F0EEE7] flex items-center justify-center text-[#5A5A5A]"
              >
                <X size={15} />
              </button>
            </div>

            <div className="px-5 py-4">
              <div className="grid grid-cols-2 gap-y-1 text-[13px] font-mono text-[#5A5A5A] mb-4 pb-4 border-b border-[#E4E0D6]">
                <span className="text-[#9A9A9A]">店舗</span>
                <span className="text-[#232323] text-right">{store}</span>
                <span className="text-[#9A9A9A]">カテゴリ</span>
                <span className="text-[#232323] text-right">{previewOrder.categoryLabel}</span>
                <span className="text-[#9A9A9A]">日付</span>
                <span className="text-[#232323] text-right">{previewOrder.date}</span>
                <span className="text-[#9A9A9A]">状態</span>
                <span className="text-[#232323] text-right">
                  {previewOrder.confirmed ? "記録済み" : "未記録（プレビュー）"}
                </span>
              </div>

              <div className="space-y-4 mb-4">
                {groupOrderItemsByCategory(previewOrder.items, previewOrder.categoryLabel).map((group) => (
                  <div key={group.label}>
                    <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-[#E4E0D6]">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#8A7355] font-semibold">
                        {group.label}
                      </span>
                      <span className="text-[11px] font-mono text-[#9A9A9A]">
                        ¥{group.subtotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {group.items.map((i, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[12px] font-mono border-b border-[#F0EEE7] pb-2">
                          <span className="text-[#5A5A5A] flex-1 min-w-0 pr-2">
                            {i.maker}
                            {i.type ? `・${i.type}` : ""}
                            <br />
                            <span className="text-[#232323] text-[13px]">{i.name}</span>
                          </span>
                          <span className="text-[#232323] text-right shrink-0 text-[14px] font-semibold">
                            {i.qty}
                            {i.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pb-2 pt-3">
                <a
                  href={buildOrderMailto(previewOrder.items, previewOrder.categoryLabel, previewOrder.date)}
                  className="flex-1 py-2.5 rounded-lg border border-[#E4E0D6] text-[#5A5A5A] text-[13px] font-medium flex items-center justify-center gap-1.5"
                >
                  <Mail size={14} /> メールで送る
                </a>
                {previewOrder.wide && !previewOrder.confirmed && (
                  <button
                    onClick={() => {
                      confirmSupplierOrder(store);
                      setPreviewOrder(null);
                    }}
                    className="px-4 py-2.5 rounded-lg bg-[#8A7355] text-white text-[13px] font-medium"
                  >
                    確定する
                  </button>
                )}
                <button
                  onClick={() => setPreviewOrder(null)}
                  className="px-4 py-2.5 rounded-lg bg-[#232323] text-white text-[13px] font-medium"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
