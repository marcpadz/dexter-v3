import { executeCode } from "./execute-code";
import { executeCommand } from "./execute-command";
import { listFiles, readFile, writeFile, deleteFile } from "./filesystem";
import { gitClone, gitStatus, gitCommit } from "./git";
import { browseUrl, takeScreenshot } from "./browser";
import { webSearch } from "./search";

export const allTools = [
  executeCode,
  executeCommand,
  listFiles,
  readFile,
  writeFile,
  deleteFile,
  gitClone,
  gitStatus,
  gitCommit,
  browseUrl,
  takeScreenshot,
  webSearch,
];
