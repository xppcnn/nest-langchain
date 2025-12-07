import * as dotenv from "dotenv";
import { resolve } from "node:path";
// Load env from package root first, then workspace root as fallback
dotenv.config({ path: resolve(process.cwd(), "..", ".env") });
dotenv.config({ path: resolve(process.cwd(), ".env") });
const getEnvConfig = () => {
  return process.env;
};

export default getEnvConfig;
