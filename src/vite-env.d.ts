/// <reference types="vite/client" />
/// <reference types="unplugin-icons/types/react" />
/// <reference types="../auto-imports" />

declare module "*.pegjs" {
  import { Parser } from "peggy";
  const parser: Parser;
  export default parser;
}

declare module "*.pegjs?trace" {
  import { Parser } from "peggy";
  const parser: Parser;
  export default parser;
}
