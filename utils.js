const toggl = require('./toggl');

const utils = {
  convertToLocalTime: (utcDateString) => {
    if (!utcDateString) return
    const utcDate = new Date(utcDateString);

    utcDate.setHours(utcDate.getHours() + 8);
    const gmtPlus8DateString = utcDate.toISOString();
    return gmtPlus8DateString
  },

  getTaskFromBody: async (body) => {
    let task = {
      title: body.payload.description,
      start: utils.convertToLocalTime(body.payload.start),
      stop: body.payload.stop
        ? utils.convertToLocalTime(body.payload.stop)
        : null,
      project: body.payload.project_id
        ? await toggl.projectIdToName(body.payload.project_id)
        : null,
      tags: body.payload.tags || [],
      timeEntryId: body.payload.id.toString()
    }
    return task
  },

};

module.exports = utils;