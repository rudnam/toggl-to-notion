const utils = {
  convertToLocalTime: (utcDateString) => {
    if (!utcDateString) return
    const utcDate = new Date(utcDateString);

    utcDate.setHours(utcDate.getHours() + 8);
    const gmtPlus8DateString = utcDate.toISOString();
    return gmtPlus8DateString
  },

  appendPlus8: (utcDateString) => {
    if (!utcDateString) return
    const offset = "+08:00";

    const appendedString = utcDateString.slice(0, -1) + offset;
    return appendedString
  },

  getHoursDiff: (date1String, date2String) => {
    if (!date1String || !date2String) return
    const date1 = new Date(date1String);
    const date2 = new Date(date2String);

    const msDiff = date2.getTime() - date1.getTime();
    const hoursDiff = Math.abs(msDiff / (1000 * 60 * 60));

    return hoursDiff.toFixed(3);
  },

  projectIdToName: (projectId) => {
    projectNames =   {
      190485674: "Full stack open",
      190199111: "Personal",
      190192148: "The Odin Project - Javascript path",
      190182063: "Uni",
      190250141: "日本語"
    }
    return projectNames[projectId]
  },

  getTaskFromBody: (body) => {
    let task = {
      title: body.payload.description,
      duration: body.payload.stop
        ? utils.getHoursDiff(body.payload.start, body.payload.stop)
        : 0,
      start: utils.convertToLocalTime(body.payload.start),
      stop: body.payload.stop
        ? utils.convertToLocalTime(body.payload.stop)
        : null,
      category: utils.projectIdToName(body.payload.project_id),
      tags: body.payload.tags || []
    }
    
    return task
  },

};

module.exports = utils;