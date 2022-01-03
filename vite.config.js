import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { viteCommonjs } from "@originjs/vite-plugin-commonjs"
import peggy from "peggy"

const peggyPlugin = (options = {}) => {
  return {
    name: "vite-peggy",
    enforce: "pre",
    transform(input, id) {
      if (id.startsWith("__vite")) return null

      const url = new URL(`file://${id}`)

      if (url.pathname.toLowerCase().endsWith(".pegjs")) {
        try {
          const code = peggy.generate(input, {
            ...options,
            grammarSource: id,
            format: "commonjs",
            output: "source",
            trace: url.searchParams.has("trace"),
            map: null,
          })
          return { code }
        } catch (e) {
          if (typeof e.format === "function") {
            throw new Error(e.format([{ source: id, text: input }]))
          } else {
            throw e
          }
        }
      }

      return null
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    // environment: "happy-dom",
    deps: {
      inline: ["luxon"],
    },
  },
  plugins: [
    viteCommonjs(),
    peggyPlugin({
      cache: true,
      allowedStartRules: [
        "Root",
        "Date",
        "DateExpr",
        "ForExpr",
        "EveryExpr",
        "EveryExprEnd",
        "NaturalTimeExpr",
        "AtTimeExpr",
        "EveryExprEndAtTimeExpr",
        "EverySubExprListExpr",
        "EveryExprEndAtTimeOrForExpr",
        "NextExpr",
        "NextSubExpr",
      ],
    }),
    react({
      fastRefresh: process.env.NODE_ENV !== "test",
    }),
  ],
  resolve: {},
})
