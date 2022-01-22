/* eslint-disable babel/new-cap */

import Icons from "unplugin-icons/vite"
import IconsResolver from "unplugin-icons/resolver"
import AutoImport from "unplugin-auto-import/vite"
import react from "@vitejs/plugin-react"
import peggy from "peggy"
import { defineConfig } from "vite"
import { viteCommonjs } from "@originjs/vite-plugin-commonjs"

const peggyPlugin = (options = {}) => {
  return {
    name: "vite-peggy",
    enforce: "pre",
    transform(input, id) {
      if (!id.toLowerCase().includes(".pegjs")) return null

      try {
        const code = peggy.generate(input, {
          ...options,
          grammarSource: id,
          format: "commonjs",
          output: "source",
          trace: id.toLowerCase().includes("trace"),
          map: null,
        })

        return {
          ...viteCommonjs().transform(code, id),
          map: null,
          warnings: null,
        }
      } catch (e) {
        if (typeof e.format === "function") {
          throw new Error(e.format([{ source: id, text: input }]))
        } else {
          throw e
        }
      }
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  base: "/simply-do/",
  plugins: [
    AutoImport({
      eslintrc: {
        enabled: true,
      },
      resolvers: [
        IconsResolver({
          prefix: "Icon",
          extension: "jsx",
        }),
      ],
    }),
    Icons({ compiler: "jsx", autoInstall: true }),
    peggyPlugin({
      cache: true,
      ...(process.env.NODE_ENV === "test" && {
        allowedStartRules: [
          "Root",
          "AtTimeExpr",
          "Context",
          "ContextOrTagExpr",
          "Date",
          "DateTimeExpr",
          "EveryExpr",
          "RecurringExprSpecifierExpr",
          "RecurringExpr",
          "EverySubExpr",
          "ForExpr",
          "NaturalTimeExpr",
          "NextExpr",
          "NextSubExpr",
          "Tag",
          "TagExpr",
        ],
      }),
    }),
    react({
      fastRefresh: process.env.NODE_ENV !== "test",
    }),
  ],
})
