import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { viteCommonjs } from "@originjs/vite-plugin-commonjs"
import peggy from "peggy"

const peggyPlugin = (options = {}) => {
  return {
    name: "vite-peggy",
    enforce: "pre",
    transform(input, id) {
      if (id.endsWith(".pegjs")) {
        const code = peggy.generate(input, {
          ...options,
          format: "commonjs",
          output: "source",
        })
        return { code }
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
      allowedStartRules: ["Root", "TimeConstructExpr", "DateFull"],
    }),
    react({
      fastRefresh: process.env.NODE_ENV !== "test",
    }),
  ],
  resolve: {},
})
