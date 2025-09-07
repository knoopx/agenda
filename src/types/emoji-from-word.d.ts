declare module "emoji-from-word" {
  interface EmojiData {
    keywords: string[];
    char: string;
    category: string;
  }
  interface Match {
    input: string;
    score: number;
    emoji: EmojiData;
    emoji_name: string;
  }
  function emojiFromWord(word: string): Match | undefined;
  export default emojiFromWord;
}
