const { Client } = require('@notionhq/client')
const toggl = require('./toggl');

const notion = new Client({ auth: process.env.NOTION_API_KEY })

async function getDatabase(dbId) {
  const response = await notion.databases.retrieve({ database_id: dbId })
  return response
}

async function getPageId(dbId, title, timeEntryId=null) {
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

  if (response['results'].length !== 0) {
    console.log('pageId found.')
    return response.results[0].id
  } else {
    console.log('No pageId found.')
    return null
  }
}

async function createTimeEntry(task) {
  console.log(`Creating time entry for ${task.title}...`)

  const response = await notion.pages.create({
    "parent": {
      "type": "database_id",
      "database_id": process.env.NOTION_TIME_ENTRIES_DB_ID
    },
    "properties": {
      [process.env.NOTION_TASK_ID]: {
        "title": await prepareFormat("title", task.title)
      },
      [process.env.NOTION_STOP_ID]: {
        "date": await prepareFormat("date", task.stop)
      },
      [process.env.NOTION_START_ID]: {
        "date": await prepareFormat("date", task.start)
      },
      [process.env.NOTION_PROJECTS_ID]: {
        "relation": await prepareFormat("relation", task.project, relationType="project")
      },
      [process.env.NOTION_TAGS_ID]: {
        "relation": await prepareFormat("relation", task.tags, relationType="tags")
      },
      [process.env.NOTION_TIME_ENTRY_ID]: {
        "rich_text": await prepareFormat("rich_text", task.timeEntryId)
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

  const response = await notion.pages.update({
    page_id: pageId,
    properties: {
      [process.env.NOTION_TASK_ID]: {
        "title": await prepareFormat("title", task.title)
      },
      [process.env.NOTION_STOP_ID]: {
        "date": await prepareFormat("date", task.stop)
      },
      [process.env.NOTION_START_ID]: {
        "date": await prepareFormat("date", task.start)
      },
      [process.env.NOTION_PROJECTS_ID]: {
        "relation": await prepareFormat("relation", task.project, relationType="project")
      },
      [process.env.NOTION_TAGS_ID]: {
        "relation": await prepareFormat("relation", task.tags, relationType="tags")
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

async function createTag(tagName) {
  console.log(`Creating page for tag ${tagName}...`)

  const response = await notion.pages.create({
    "parent": {
      "type": "database_id",
      "database_id": process.env.NOTION_TAGS_DB_ID
    },
    "properties": {
      [process.env.NOTION_TASK_ID]: {
        "title": await prepareFormat("title", tagName)
      },
      "Tag": {
        "select": await prepareFormat("select", tagName)
      }
    }
  })

  console.log(`Page for tag ${tagName} created.`)
  return response
}

async function createProject(projectName) {
  console.log(`Creating page for project ${projectName}...`)

  const response = await notion.pages.create({
    "parent": {
      "type": "database_id",
      "database_id": process.env.NOTION_PROJECTS_DB_ID
    },
    "properties": {
      [process.env.NOTION_TASK_ID]: {
        "title": await prepareFormat("title", projectName)
      },
      "Tag": {
        "select": await prepareFormat("select", projectName)
      },
      [process.env.NOTION_PROJECT_CATEGORY_ID]: {
        "relation": await prepareFormat("relation", await toggl.getProjectClient(projectName), relationType="category")
      }

    }
  })

  console.log(`Page for project ${projectName} created.`)
  return response;
}

async function createCategory(categoryName) {
  console.log(`Creating page for category ${categoryName}...`)
  
  const response = await notion.pages.create({
    "parent": {
      "type": "database_id",
      "database_id": process.env.NOTION_CATEGORIES_DB_ID
    },
    "properties": {
      [process.env.NOTION_TASK_ID]: {
        "title": await prepareFormat("title", categoryName)
      },
      "Tag": {
        "select": await prepareFormat("select", categoryName)
      }
    }
  })
  console.log(`Page for category ${categoryName} created.`)
  return response
}

async function prepareFormat(type, data, relationType=null) {
  switch(type) {
    case "title":
      return [
        {
          "text": {
            "content": data
          }
        }
      ]
      break;

    case "date":
      return data
        ? {
          start: data,
          time_zone: "Asia/Manila"
        }
        : null;
      break;

    case "rich_text":
      return data
        ? [
          {
            "text": {
              "content": data
            }
          }
        ]
        : null;
      break;

    case "select":
      return data
      ? {
        "name": data
      }
      : null;
      break;
      
    case "relation":
      if (!data) return [];

      if (relationType === "category") {
        let pageId = await getPageId(process.env.NOTION_CATEGORIES_DB_ID, data)
          if (!pageId) {
            await createCategory(data)
            pageId = await getPageId(process.env.NOTION_CATEGORIES_DB_ID, data)
          }
          return [{ "id": pageId }]
      } else if (relationType === "project") {
        let pageId = await getPageId(process.env.NOTION_PROJECTS_DB_ID, data)
          if (!pageId) {
            await createProject(data)
            pageId = await getPageId(process.env.NOTION_PROJECTS_DB_ID, data)
          }
          return [{ "id": pageId }]
      } else if (relationType === "tags") {
        let pageIds = []
        for (const dataItem of data) {
          let pageId = await getPageId(process.env.NOTION_TAGS_DB_ID, dataItem)
          if (!pageId) {
            await createTag(dataItem)
            pageId = await getPageId(process.env.NOTION_TAGS_DB_ID, dataItem)
          }
          pageIds.push({ "id": pageId })
        }
        return pageIds
      } else {
        console.error("Relation type undefined.")
        return
      }
      break;
  }
}

const notionObject = {
  getPageId,
  getDatabase,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry
};

module.exports = notionObject