import fs from "fs"
import path from "path"
import Ajv from "ajv/dist/2020.js"
import addFormats from "ajv-formats"
import { parseFlowMD } from "../parser/reference.js"


const ajv = new Ajv({
  allErrors: true,
  strict: false
})

addFormats(ajv)


const schema = JSON.parse(
fs.readFileSync(path.resolve("schema/flowmd-v0.json"), "utf8")
)


const validate = ajv.compile(schema)


const examplesDir = path.resolve("examples")
const exampleFiles = fs.readdirSync(examplesDir)


let failed = false


for (const file of exampleFiles) {
const markdown = fs.readFileSync(path.join(examplesDir, file), "utf8")


const parsed = parseFlowMD(markdown)


const valid = validate(parsed)


if (!valid) {
failed = true
console.error(`❌ ${file} failed schema validation`)
console.error(validate.errors)
} else {
console.log(`✅ ${file} passed`)
}
}


if (failed) {
process.exit(1)
}