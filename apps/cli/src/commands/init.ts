import * as fs from "node:fs"
import * as path from "node:path"

/** Create an empty `.dakiya/` workspace folder in the current directory. */
export function runInit(): void {
  const target = path.join(process.cwd(), ".dakiya")

  if (fs.existsSync(target)) {
    console.log(`[dakiya] .dakiya already exists at ${target}`)
    return
  }

  fs.mkdirSync(target, { recursive: true })
  console.log(`[dakiya] Created ${target}`)
}
