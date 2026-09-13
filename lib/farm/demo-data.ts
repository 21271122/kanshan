import type { ContentItem } from "./model";
const rawItems: ContentItem[] = [
  { id: "a1", favlist: "值得反复看的回答", title: "一个人如何建立稳定的内在秩序？", hint: "秩序 · 自我理解 · 长期", tags: ["成长", "思考"], type: "回答", url: "https://www.zhihu.com" },
  { id: "a2", favlist: "值得反复看的回答", title: "你是从什么时候开始理解父母的？", hint: "家人 · 时间 · 体谅", tags: ["生活", "关系"], type: "回答", url: "https://www.zhihu.com" },
  { id: "a3", favlist: "值得反复看的回答", title: "有哪些曾改变过你看待世界方式的句子？", hint: "语言 · 视角 · 感受", tags: ["阅读", "思考"], type: "回答", url: "https://www.zhihu.com" },
  { id: "a4", favlist: "值得反复看的回答", title: "普通人怎样做长期主义，才能不被耗尽？", hint: "耐心 · 节奏 · 长期", tags: ["成长", "职业"], type: "回答", url: "https://www.zhihu.com" },
  { id: "b1", favlist: "灵感与创作", title: "做设计时，怎样保留那些看似无用的直觉？", hint: "创作 · 直觉 · 留白", tags: ["设计", "创作"], type: "文章", url: "https://www.zhihu.com" },
  { id: "b2", favlist: "灵感与创作", title: "如何判断一个好想法值得花时间？", hint: "想法 · 选择 · 行动", tags: ["创作", "方法"], type: "回答", url: "https://www.zhihu.com" },
  { id: "b3", favlist: "灵感与创作", title: "为什么有些作品会让人想回头再看一遍？", hint: "作品 · 记忆 · 回望", tags: ["艺术", "创作"], type: "回答", url: "https://www.zhihu.com" },
  { id: "b4", favlist: "灵感与创作", title: "创作者如何度过没有反馈的日子？", hint: "创作 · 安静 · 坚持", tags: ["创作", "生活"], type: "文章", url: "https://www.zhihu.com" },
  { id: "c1", favlist: "关于城市的想象", title: "一座好城市，会怎样照顾独自生活的人？", hint: "城市 · 独处 · 日常", tags: ["城市", "生活"], type: "回答", url: "https://www.zhihu.com" },
  { id: "c2", favlist: "关于城市的想象", title: "你住过最有烟火气的街区是什么样？", hint: "街道 · 人情 · 记忆", tags: ["城市", "旅行"], type: "回答", url: "https://www.zhihu.com" },
  { id: "c3", favlist: "关于城市的想象", title: "为什么我们会怀念已经离开的地方？", hint: "离开 · 地方 · 回忆", tags: ["情感", "城市"], type: "回答", url: "https://www.zhihu.com" },
  { id: "c4", favlist: "关于城市的想象", title: "下雨天最适合去一座城市的哪里？", hint: "雨天 · 漫步 · 发现", tags: ["旅行", "生活"], type: "文章", url: "https://www.zhihu.com" },
];
export const demoItems = rawItems.map(item => ({ ...item, url: "https://www.zhihu.com/search?type=content&q=" + encodeURIComponent(item.title) }));
