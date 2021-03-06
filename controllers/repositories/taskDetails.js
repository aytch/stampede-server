const prettyMilliseconds = require("pretty-ms");

/**
 * path this handler will serve
 */
function path() {
  return "/repositories/taskDetails";
}

/**
 * handle taskDetails
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  const taskRows = await dependencies.db.fetchTask(req.query.taskID);
  const task = taskRows.rows[0];
  const buildRows = await dependencies.db.fetchBuild(task.build_id);
  const build = buildRows.rows[0];

  const detailsRows = await dependencies.db.fetchTaskDetails(req.query.taskID);
  let taskDetails = { details: {} };
  let configValues = [];
  let scmDetails = [];
  let summary = "";
  let text = "";
  let artifacts = [];
  if (detailsRows.rows.length > 0) {
    taskDetails = detailsRows.rows[0];
    if (req.validAdminSession == true) {
      Object.keys(
        taskDetails.details.config != null ? taskDetails.details.config : {}
      ).forEach(function (key) {
        configValues.push({
          key: key,
          value: taskDetails.details.config[key].value,
          source: taskDetails.details.config[key].source,
        });
      });
    }
    summary =
      taskDetails.details.result != null &&
      taskDetails.details.result.summary != null
        ? taskDetails.details.result.summary
        : "";
    text =
      taskDetails.details.result != null &&
      taskDetails.details.result.text != null
        ? taskDetails.details.result.text
        : "";
    artifacts =
      taskDetails.details.result != null &&
      taskDetails.details.result.artifacts != null
        ? taskDetails.details.result.artifacts
        : [];

    if (taskDetails.details.scm.pullRequest != null) {
      scmDetails.push({
        title: "PR Number",
        value: taskDetails.details.scm.pullRequest.number,
      });
      scmDetails.push({
        title: "Head",
        value: taskDetails.details.scm.pullRequest.head.ref,
      });
      scmDetails.push({
        title: "Head SHA",
        value: taskDetails.details.scm.pullRequest.head.sha,
      });
      scmDetails.push({
        title: "Base",
        value: taskDetails.details.scm.pullRequest.base.ref,
      });
      scmDetails.push({
        title: "Base SHA",
        value: taskDetails.details.scm.pullRequest.base.sha,
      });
    } else if (taskDetails.details.scm.branch != null) {
      scmDetails.push({
        title: "Branch",
        value: taskDetails.details.scm.branch.name,
      }),
        scmDetails.push({
          title: "SHA",
          value: taskDetails.details.scm.branch.sha,
        });
      scmDetails.push({
        title: "Commit",
        value: taskDetails.details.scm.commitMessage,
      });
    } else if (taskDetails.details.scm.release != null) {
      scmDetails.push({
        title: "Release",
        value: taskDetails.details.scm.release.name,
      });
      scmDetails.push({
        title: "Tag",
        value: taskDetails.details.scm.release.tag,
      });
      scmDetails.push({
        title: "SHA",
        value: taskDetails.details.scm.release.sha,
      });
    }
  }

  res.render(dependencies.viewsPath + "repositories/taskDetails", {
    owners: owners,
    isAdmin: req.validAdminSession,
    task: task,
    build: build,
    taskDetails: taskDetails,
    configValues: configValues,
    summary: summary,
    text: text,
    artifacts: artifacts,
    scmDetails: scmDetails,
    prettyMilliseconds: (ms) => (ms != null ? prettyMilliseconds(ms) : ""),
  });
}

module.exports.path = path;
module.exports.handle = handle;
