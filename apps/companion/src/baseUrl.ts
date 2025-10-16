import * as fs from "fs";
import * as yaml from "js-yaml";

let baseUrl;
try {
  const file = fs.readFileSync("../manifest.yml", "utf8");
  const config = yaml.load(file); // parse YAML into JS object

  baseUrl = config.permissions.external.fetch.backend[0];
} catch (e) {
  baseUrl = "http://localhost:3000"; // default value if error occurs
  console.error(e);
}
export default baseUrl;
