import "dotenv/config";
import { Client } from "@notionhq/client";
const { NOTION_TOKEN, NOTION_DB_ID_WEBSITE_CONTENT } = process.env;
if (!NOTION_TOKEN || !NOTION_DB_ID_WEBSITE_CONTENT) {
  console.log("Skip: NOTION_TOKEN / NOTION_DB_ID_WEBSITE_CONTENT not set.");
  process.exit(0);
}
const notion = new Client({ auth: NOTION_TOKEN });
console.log("Notion sync placeholder — implement mapping when DB is shared with the integration.");
