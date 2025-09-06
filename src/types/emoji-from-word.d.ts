declare module 'emoji-from-word' {
  interface EmojiResult {
    emoji: string;
    char: string;
  }
  function emojiFromWord(word: string): EmojiResult;
  export default emojiFromWord;
}