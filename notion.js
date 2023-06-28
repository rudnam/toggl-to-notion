const { Client } = require('@notionhq/client')

const notion = new Client({ auth: process.env.NOTION_API_KEY })

async function getDatabase(dbId) {
  const response = await notion.databases.retrieve({ database_id: dbId })
  return response
}

async function getPageId(dbId, title, timeEntryId=null) {
  if (!title && !timeEntryId) return null
  if (timeEntryId) {
    console.log(`Getting pageId of task with timeEntryId ${timeEntryId}...`)
  } else {
    console.log(`Getting pageId of ${title}...`)
  }

  let filter = timeEntryId ? {
    property: "Time entry id",
    rich_text: {
      equals: timeEntryId
    }
  } : {
    property: "Name",
    title: {
      contains: title
    }
  };

  const response = await notion.databases.query({
    database_id: dbId,
    filter: filter
  })

  if (response['results'].length != 0) {
    console.log('pageId found.')
    return response.results[0].id
  } else {
    console.log('No pageId found.')
    return null
  }
}

async function createTimeEntry(task) {
  console.log(`Creating time entry for ${task.title}...`)

  // Prepare format
  let dateStop = task.stop
    ? {
        start: task.stop,
        time_zone: "Asia/Manila"
      }
    : null;

  let dateStart = task.start
    ? {
        start: task.start,
        time_zone: "Asia/Manila"
      }
    : null;

  let categoryId = await getPageId(process.env.NOTION_CATEGORIES_DB_ID, task.category)
  if (!categoryId) {
    await createPage(process.env.NOTION_CATEGORIES_DB_ID, task.category)
    categoryId = await getPageId(process.env.NOTION_CATEGORIES_DB_ID, task.category)
  }
  let category = categoryId ? [{ "id": categoryId}] : []

  let tags = []
  for (const tag of task.tags) {
    let tagId = await getPageId(process.env.NOTION_TAGS_DB_ID, tag)
    if (!tagId) {
      await createPage(process.env.NOTION_TAGS_DB_ID, tag)
      tagId = await getPageId(process.env.NOTION_TAGS_DB_ID, tag)
    }
    tags.push({ "id": tagId })
  }

  const response = await notion.pages.create({
    "parent": {
      "type": "database_id",
      "database_id": process.env.NOTION_TIME_ENTRIES_DB_ID
    },
    "properties": {
      [process.env.NOTION_TASK_ID]: {
        "title": [
          {
            "text": {
              "content": task.title
            }
          }
        ]
      },
      [process.env.NOTION_STOP_ID]: {
        "date": dateStop
      },
      [process.env.NOTION_START_ID]: {
        "date": dateStart
      },
      [process.env.NOTION_CATEGORIES_ID]: {
        "relation": category
      },
      [process.env.NOTION_TAGS_ID]: {
        "relation": tags
      },
      [process.env.NOTION_TIME_ENTRY_ID]: {
        "rich_text": [
          {
            "text": {
              "content": task.timeEntryId
            }
          }
        ]
      }
    }
  })

  console.log(`Time entry for ${task.title} created.`)
  return response
}

async function updateTimeEntry(pageId, task) {
  console.log(`Updating time entry for ${task.title}...`)
  if (!pageId) {
    console.log('Update cancelled, pageId is undefined.')
    return
  }

  // Prepare format
  let dateStop = task.stop
    ? {
        start: task.stop,
        time_zone: "Asia/Manila"
      }
    : null;

  let dateStart = task.start
    ? {
        start: task.start,
        time_zone: "Asia/Manila"
      }
    : null;

  let categoryId = await getPageId(process.env.NOTION_CATEGORIES_DB_ID, task.category)
  if (!categoryId) {
    await createPage(process.env.NOTION_CATEGORIES_DB_ID, task.category)
    categoryId = await getPageId(process.env.NOTION_CATEGORIES_DB_ID, task.category)
  }
  let category = categoryId ? [{ "id": categoryId}] : []

  let tags = []
  for (const tag of task.tags) {
    let tagId = await getPageId(process.env.NOTION_TAGS_DB_ID, tag)
    if (!tagId) {
      await createPage(process.env.NOTION_TAGS_DB_ID, tag)
      tagId = await getPageId(process.env.NOTION_TAGS_DB_ID, tag)
    }
    tags.push({ "id": tagId })
  }

  const response = await notion.pages.update({
    page_id: pageId,
    properties: {
      [process.env.NOTION_TASK_ID]: {
        title: [
          {
            text: {
              content: task.title
            }
          }
        ]
      },
      [process.env.NOTION_STOP_ID]: {
        "date": dateStop
      },
      [process.env.NOTION_START_ID]: {
        "date": dateStart
      },
      [process.env.NOTION_CATEGORIES_ID]: {
        "relation": category
      },
      [process.env.NOTION_TAGS_ID]: {
        "relation": tags
      }
    }
  })

  console.log(`Time entry for ${task.title} updated.`)
  return response
}

async function deleteTimeEntry(pageId) {
  console.log(`Deleting time entry...`)
  if (!pageId) {
    console.log('Deletion cancelled, pageId is undefined.')
    return
  }

  const response = await notion.pages.update({
    page_id: pageId,
    archived: true,
  })
  
  console.log(`Time entry deleted.`)
  return response
}

async function createPage(dbId, pageName) {
  console.log(`Creating page for ${pageName}...`)
  const response = await notion.pages.create({
    "parent": {
      "type": "database_id",
      "database_id": dbId
    },
    "properties": {
      [process.env.NOTION_TASK_ID]: {
        "title": [
          {
            "text": {
              "content": pageName
            }
          }
        ]
      },
      "Tag": {
        "select": {
          "name": pageName
        }
      }
    }
  })

  console.log(`Page for ${pageName} created.`)
  return response
}

const notionObject = {
  getPageId,
  getDatabase,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry
};

module.exports = notionObject