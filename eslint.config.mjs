import path from "node:path";
import { fileURLToPath } from "node:url";
import firebaseRulesPlugin from "@firebase/eslint-plugin-security-rules";

export default [
  {
    ignores: ["dist/**/*"]
  },
  firebaseRulesPlugin.configs["flat/recommended"]
];
