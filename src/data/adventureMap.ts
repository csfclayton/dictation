/** 主題小故事地圖：香港線 + 科學島線 */

export type AdventureRouteId = "hongkong" | "science";

export type AdventureStation = {
  id: string;
  title: string;
  emoji: string;
  story: string;
};

export type AdventureRoute = {
  id: AdventureRouteId;
  name: string;
  themeColor: string;
  topics: string[];
  stations: AdventureStation[];
};

export const ADVENTURE_ROUTES: AdventureRoute[] = [
  {
    id: "hongkong",
    name: "香港探險隊",
    themeColor: "rose",
    topics: ["香港", "地理"],
    stations: [
      {
        id: "hk0",
        title: "起點：維港碼頭",
        emoji: "🚢",
        story:
          "你加入香港探險隊！第一站係維多利亞港。海風吹過，兩岸高樓好似衛士一樣守護住城市。準備出發啦！",
      },
      {
        id: "hk1",
        title: "太平山頂",
        emoji: "🌄",
        story:
          "搭纜車上山頂，夜景閃閃發光。原來香港叫「東方之珠」，就係因為呢啲燈火好似珍珠咁靚！",
      },
      {
        id: "hk2",
        title: "大館 · 中環",
        emoji: "🏛️",
        story:
          "大館以前係警察總部，而家係文物同藝術空間。紅磚牆講緊香港昔日同今日嘅故事。",
      },
      {
        id: "hk3",
        title: "赤柱大街",
        emoji: "🛍️",
        story:
          "赤柱有市場、海灘同歷史建築。你發現香港好近海，好多地方都同「港」字有關！",
      },
      {
        id: "hk4",
        title: "濕地公園",
        emoji: "🦩",
        story:
          "米埔同濕地係候鳥嘅休息站。保護濕地，就係保護住嚟香港過冬嘅朋友。",
      },
      {
        id: "hk5",
        title: "太空館",
        emoji: "🌌",
        story:
          "尖沙咀太空館帶你睇星空。香港細細地，但我哋一樣可以望向宇宙！",
      },
      {
        id: "hk6",
        title: "終點：香港精神",
        emoji: "🏅",
        story:
          "恭喜你走完香港線！勤力、靈活、同唔同文化相處——呢啲就係香港精神。你係真正嘅小探險家！",
      },
    ],
  },
  {
    id: "science",
    name: "科學島冒險",
    themeColor: "sky",
    topics: ["科學", "健康", "氣候"],
    stations: [
      {
        id: "sc0",
        title: "起點：實驗碼頭",
        emoji: "🔬",
        story:
          "歡迎嚟到科學島！呢度每樣嘢都有「點解」。戴好想像力頭盔，我哋開始解謎！",
      },
      {
        id: "sc1",
        title: "磁力山谷",
        emoji: "🧲",
        story:
          "兩塊磁石互相吸引又互相推開。原來 N 極同 S 極先會吸埋一齊——自然界都有「規則」！",
      },
      {
        id: "sc2",
        title: "水循環瀑布",
        emoji: "💧",
        story:
          "水蒸發變雲，落返落嚟變雨，流入河再出海。氣候同水循環息息相關，珍惜食水好重要。",
      },
      {
        id: "sc3",
        title: "人體車站",
        emoji: "❤️",
        story:
          "心臟好似泵，每日泵血去全身。運動同充足睡眠，可以令呢個「泵」更健康！",
      },
      {
        id: "sc4",
        title: "光影迷宮",
        emoji: "🔦",
        story:
          "光沿直線走，照到鏡面會反射。影子嘅長短會隨太陽位置改變——你試過戶外觀察未？",
      },
      {
        id: "sc5",
        title: "生態森林",
        emoji: "🌳",
        story:
          "植物用光合作用製造養分同氧氣。冇綠樹，動物同人類都會好辛苦。科學島請你一齊護樹！",
      },
      {
        id: "sc6",
        title: "終點：小小科學家",
        emoji: "🎓",
        story:
          "你完成科學島全部關卡！記住：好奇、觀察、問「點解」，你就係未來嘅科學家！",
      },
    ],
  },
];

export function routeById(id: AdventureRouteId): AdventureRoute {
  return ADVENTURE_ROUTES.find((r) => r.id === id)!;
}
