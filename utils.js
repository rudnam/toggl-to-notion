const utils = {
  convertToLocalTime: (utcDateString) => {
    if (!utcDateString) return
    const utcDate = new Date(utcDateString);

    utcDate.setHours(utcDate.getHours() + 8);
    const gmtPlus8DateString = utcDate.toISOString();
    return gmtPlus8DateString
  },

  projectIdToName: (projectId) => {
    projectNames =   {
      190485674: "Full stack open",
      190199111: "Personal",
      190192148: "The Odin Project - Javascript path",
      190182063: "Uni",
      190250141: "日本語",
      193116795: "Programming",
      193123935: "Deutsch"
    }
    return projectNames[projectId]
  },

  getTaskFromBody: (body) => {
    let task = {
      title: body.payload.description,
      start: utils.convertToLocalTime(body.payload.start),
      stop: body.payload.stop
        ? utils.convertToLocalTime(body.payload.stop)
        : null,
      category: utils.projectIdToName(body.payload.project_id),
      tags: body.payload.tags || [],
      timeEntryId: body.payload.id.toString() || null
    }
    return task
  },

};

module.exports = utils;