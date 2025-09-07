import emojilib from "emojilib";

// Custom work/personal-related word/emoji pairs
const customEmojiMap: Record<string, string> = {
  // Work-related
  work: "🧑‍💼",
  office: "🏢",
  meeting: "📅",
  deadline: "⏰",
  boss: "👔",
  project: "📁",
  // Personal-related
  home: "🏠",
  family: "👨‍👩‍👧‍👦",
  friend: "🧑‍🤝‍🧑",
  self: "🧘",
  personal: "🛋️",
  chill: "🛋️",
  relax: "🛋️",
  vacation: "🌴",
  // Daily life tasks
  shopping: "🛒",
  groceries: "🥦",
  cleaning: "🧹",
  dishes: "🍽️",
  laundry: "🧺",
  cooking: "🍳",
  trash: "🗑️",
  walk: "🚶",
  exercise: "🏋️",
  workout: "🏋️",
  pay: "💸",
  bill: "🧾",
  call: "📞",
  email: "📧",
  appointment: "📅",
  medicine: "💊",
  water: "💧",
  plant: "🪴",
  pet: "🐾",
  feed: "🍽️",
  read: "📖",
  study: "📚",
  buy: "🛒",
  fix: "🛠️",
  repair: "🛠️",
};

// Helper: find emoji by keyword
export function emojiFromKeyword(keyword: string): string | undefined {
  keyword = keyword.toLowerCase();
  if (customEmojiMap[keyword]) {
    return customEmojiMap[keyword];
  }
  for (const [emoji, keywords] of Object.entries(emojilib)) {
    if (keywords.map(k => k.toLowerCase()).includes(keyword)) {
      return emoji;
    }
  }
  return undefined;
}
