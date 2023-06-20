require('dotenv').config()
const express = require("express")
const bodyParser = require("body-parser")
const notion = require('./notion')
const utils = require('./utils');

const app = express()
const PORT = process.env.PORT

app.use(bodyParser.json())

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))

app.get('/', (req, res) => {
  res.send('Nothing here')
})

app.get("/webhook", (req, res) => {
  res.send("webhook route");
});

app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;

    if (['created', 'updated', 'deleted'].includes(body.metadata.action)) {
      console.log(`Received "${body.payload.description} ${body.metadata.action}"`);
    } else {
      console.log(body)
    }
    
    res.status(200).end();

    // Set up time entry
    let task = utils.getTaskFromBody(body);

    let pageId = await notion.getPageId(
      process.env.NOTION_TIME_ENTRIES_DB_ID,
      task.title,
      utils.appendPlus8(task.start)
    );

    if (body.metadata.action === "created" && !pageId) {
      let resp = await notion.createPage(task);
      // console.log(resp);
    } else if (body.metadata.action === "updated" || (body.metadata.action === "created" && pageId)) {
      let resp = await notion.updatePage(pageId, task);
      // console.log(resp);
    } else if (body.metadata.action === 'deleted') {
      let resp = await notion.deletePage(pageId);
      // console.log(resp);
    }

  } catch (error) {
    console.error(error);
  }
})
