// notion_import.js
import fs from 'node:fs';
import readline from 'node:readline';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DB_ID = process.env.NOTION_DATABASE_ID; // e.g. 2536c0558681805bab9ef670e84dea0c

function asRich(text){ return [{ type:'text', text:{ content:text }}]; }
function asSelect(v){ return v ? { name:v } : null; }
function asNumber(n){ return (n === '' || n == null) ? null : Number(n); }
function asUrl(u){ return u || null; }
function asDate(d){ return d ? { start:d } : null; }

async function addRow(row){
  const props = {
    "Name":               { title: asRich(row.Name || '') },
    "Sport":              { select: asSelect(row.Sport) },
    "Level":              { select: asSelect(row.Level) },
    "Country":            { select: asSelect(row.Country) },
    "Region":             { rich_text: asRich(row.Region || '') },
    "Position":           { rich_text: asRich(row.Position || '') },
    "Birth Date":         { date: asDate(row["Birth Date"]) },
    "Team/Academy":       { rich_text: asRich(row["Team/Academy"] || '') },
    "B/T":                { rich_text: asRich(row["B/T"] || '') },
    "Height (cm)":        { number: asNumber(row["Height (cm)"]) },
    "Weight (kg)":        { number: asNumber(row["Weight (kg)"]) },
    "FB (mph)":           { number: asNumber(row["FB (mph)"]) },
    "EV (mph)":           { number: asNumber(row["EV (mph)"]) },
    "60 yd (s)":          { number: asNumber(row["60 yd (s)"]) },
    "Pop Time (s)":       { number: asNumber(row["Pop Time (s)"]) },
    "NIL ($)":            { number: asNumber(row["NIL ($)"]) },
    "Buzz (0-100)":       { number: asNumber(row["Buzz (0-100)"]) },
    "Blaze Score (0-100)":{ number: asNumber(row["Blaze Score (0-100)"]) },
    "Last Verified":      { date: asDate(row["Last Verified"]) },
    "Source":             { url: asUrl(row["Source"]) }
  };

  await notion.pages.create({ parent:{ database_id: DB_ID }, properties: props });
}

async function main(){
  const f = process.argv[2] || './seed.jsonl';
  const rl = readline.createInterface({ input: fs.createReadStream(f) });
  for await (const line of rl){
    if(!line.trim()) continue;
    await addRow(JSON.parse(line));
  }
}
main().catch(e=>{ console.error(e); process.exit(1); });