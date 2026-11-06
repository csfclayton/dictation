export type BeyBadge = { id: string; name: string; image: string };

/** 圖片來自 beyblade.phstudy.org（僅作學習徽章展示） */
export const BEY_BADGES: BeyBadge[] = [
  { id: "BX-52", name: "BX-52 輝耀龍騎士 6-60LC", image: "https://beyblade.phstudy.org/images/products/BX-52/085553_00.png" },
  { id: "BX-53", name: "BX-53 極限衝擊對戰組", image: "https://beyblade.phstudy.org/images/products/BX-53/073734_00.png" },
  { id: "BX-54", name: "BX-54 巨神壓制 0-70LP", image: "https://beyblade.phstudy.org/images/products/BX-54/080763_00.png" },
  { id: "BXA-01", name: "BX-00 蒼龍神劍 3-60F 壽司郎聯名版", image: "https://beyblade.phstudy.org/images/products/BXA-01/939672_01.jpg" },
  { id: "BXA-03", name: "BX-00 漫威 美國隊長 & 紅浩克 雙陀螺組", image: "https://beyblade.phstudy.org/images/products/BXA-03/305718_00.jpg" },
  { id: "BXA-04", name: "BX-00 漫威 終極蜘蛛人 & 綠惡魔 雙陀螺組", image: "https://beyblade.phstudy.org/images/products/BXA-04/305725_00.jpg" },
  { id: "BXA-05", name: "BX-00 星際大戰 歐比王肯諾比 & 葛里維斯將軍 雙陀螺組", image: "https://beyblade.phstudy.org/images/products/BXA-05/305732_00.jpg" },
  { id: "BXA-06", name: "BX-00 星際大戰 丘巴卡 & 風暴兵 雙陀螺組", image: "https://beyblade.phstudy.org/images/products/BXA-06/305749_00.jpg" },
  { id: "BXC-00", name: "BX-00 蒼龍神劍 3-60F 金屬塗層版", image: "https://beyblade.phstudy.org/images/products/BXC-00/910909_01.png" },
  { id: "BXC-01", name: "BX-00 鳳凰翔羽 3-60F", image: "https://beyblade.phstudy.org/images/products/BXC-01/135282_01.jpg" },
  { id: "BXC-02", name: "BX-00 惡魔紅鐮 3-80F", image: "https://beyblade.phstudy.org/images/products/BXC-02/932970_00.jpg" },
  { id: "BXC-03", name: "UX-00 蒼龍爆刃 1-60A 金屬塗層:火紅", image: "https://beyblade.phstudy.org/images/products/BXC-03/941460_00.jpg" },
  { id: "BXC-04", name: "BX-00 蒼龍神劍 金屬塗層:藍", image: "https://beyblade.phstudy.org/images/products/BXC-04/01.jpg" },
  { id: "BXC-05", name: "BX-00 鳳凰飛翼 9-80DB", image: "https://beyblade.phstudy.org/images/products/BXC-05/953654_00.jpg" },
  { id: "BXC-07", name: "BX-00 鱷魚粉碎 2-60Q 金屬塗層:綠", image: "https://beyblade.phstudy.org/images/products/BXC-07/953678_00.jpg" },
  { id: "BXC-08", name: "BX-00 鳳凰翔羽 金屬塗層:橘", image: "https://beyblade.phstudy.org/images/products/BXC-08/01.jpg" },
  { id: "BXC-11", name: "BX-00 武士鋼鐵 5-70GF 金屬塗層:白", image: "https://beyblade.phstudy.org/images/products/BXC-11/993766_00.jpg" },
  { id: "BXC-12", name: "UX-00 武士星劍 2-70L 金屬塗層:橘", image: "https://beyblade.phstudy.org/images/products/BXC-12/993773_00.jpg" },
  { id: "BXC-13", name: "CX-00 蒼龍至尊 S2-70K 金屬塗層:水藍", image: "https://beyblade.phstudy.org/images/products/BXC-13/993872_00.jpg" },
  { id: "BXC-15", name: "UX-00 大蛇簇擁 6-60LF", image: "https://beyblade.phstudy.org/images/products/BXC-15/997023_00.jpg" },
  { id: "BXC-18", name: "BX-00 蒼龍神劍 金屬塗層:紅", image: "https://beyblade.phstudy.org/images/products/BXC-18/0381002126.jpg" },
  { id: "BXC-19", name: "CX-00 龍王閃擊 BK1-50I 金屬塗層:黃", image: "https://beyblade.phstudy.org/images/products/BXC-19/072447_00.png" },
  { id: "BXC-20", name: "UX-00 時鐘幻象 4-55S 金屬塗層:闇黑", image: "https://beyblade.phstudy.org/images/products/BXC-20/067900_00.jpg" },
  { id: "BXC-21", name: "CX-00 基德狩獵 K4-70TK 金屬塗層:白", image: "https://beyblade.phstudy.org/images/products/BXC-21/056225_00.png" },
];

export function getBeyById(id: string): BeyBadge | undefined {
  return BEY_BADGES.find((b) => b.id === id);
}
