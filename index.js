require('dotenv').config()
const express = require("express")
const bodyParser = require("body-parser")
const notion = require('./notion')
const toggl = require('./toggl');
const utils = require('./utils');

const app = express()
const PORT = process.env.PORT

app.use(bodyParser.json())

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))

app.get('/', (req, res) => {
  res.send('Nothing here')
})

app.get("/webhook", async (req, res) => {
  res.send("webhook route");
  let dbResp = await notion.getDatabase(process.env.NOTION_PROJECTS_DB_ID);
  console.log(dbResp);
});

app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;

    res.status(200).end();

    if (["created", "updated", "deleted"].includes(body.metadata.action)) {
      console.log(`Received "${body.payload.description} ${body.metadata.action}"`);
    } else {
      console.log(body)
      return;
    }

    if (body.metadata.action === "updated" && body.metadata.request_body.includes('"path":"/deleted_at"')) {
      console.log("Time entry is deleted but meta.data.action is \"updated\" (Toggl api bug).")
    }
    

    let task = await utils.getTaskFromBody(body);

    let pageId = await notion.getPageId(
      process.env.NOTION_TIME_ENTRIES_DB_ID,
      task.title,
      task.timeEntryId
    );

    let resp;
    if ((body.metadata.action === "deleted") || body.metadata.request_body.includes('"path":"/deleted_at"')) {
      await delay(5000);
      resp = await notion.deleteTimeEntry(pageId);
    } else if (body.metadata.action === "updated") {
      await delay(5000);
      resp = await notion.updateTimeEntry(pageId, task);
    } else if (body.metadata.action === "created") {
      resp = await notion.createTimeEntry(task);
    } 
    // console.log(resp);
    
  } catch (error) {
    console.error(error);
  }
})

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}