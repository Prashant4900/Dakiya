#!/usr/bin/env node
import { runInit } from "./commands/init.js"
import { runServe } from "./commands/serve.js"
import { runHello } from "./hello.js"

const [, , cmd] = process.argv

function usage(exitCode = 0): never {
  console.log(`dakiya — local-first API toolkit (skeleton)

Usage:
  dakiya init     Create .dakiya/ with dakiya.yaml core manifest
  dakiya serve    Start web dashboard at http://localhost:4242

`)
  process.exit(exitCode)
}

async function main(): Promise<void> {
  switch (cmd) {
    case "init":
      runInit()
      return
    case "serve":
      await runServe()
      return
    case "hello":
      console.log(runHello())
      return
    case undefined:
    case "help":
    case "--help":
    case "-h":
      usage(0)
      break
    default:
      console.error(`Unknown command: ${cmd}\n`)
      usage(1)
  }
}

main().catch(err => {
  console.error(`[dakiya] ${err instanceof Error ? err.message : err}`)
  process.exit(1)
})
