const fs = require("fs")
const { inspect } = require("util")

const peggy = require("peggy")

const parser = peggy.generate(
  fs.readFileSync("./src/parser/grammar.pegjs", "utf8"),
)
const text = process.argv.slice(2).join(" ")

try {
  console.log(inspect(parser.parse(text), { colors: true, depth: null }))
} catch (e) {
  console.log(text)
  if (e.location) console.log(`${"-".repeat(e.location.start.column - 1)}^`)
  console.log(e.message)
}
