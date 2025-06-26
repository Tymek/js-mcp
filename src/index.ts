#!/usr/bin/env node

import { startServer } from "./server.js";

const main = async (): Promise<void> => {
  try {
    await startServer();
  } catch (error) {
    console.error("Fatal error in main():", error);
    process.exit(1);
  }
};

main();
