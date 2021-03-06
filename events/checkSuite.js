"use strict";

const checkRun = require("../lib/checkRun");
const notification = require("../lib/notification");

/**
 * handle event
 * @param {*} body
 * @param {*} serverConf
 * @param {*} cache
 * @return {Object} response to the event
 */
async function handle(body, serverConf, cache, scm, db, logger) {
  // Parse the incoming body into the parts we care about
  const event = parseEvent(body);
  logger.info("CheckSuiteEvent:");
  if (serverConf.logLevel === "verbose") {
    logger.verbose(JSON.stringify(event, null, 2));
  }
  notification.repositoryEventReceived("check_suite", event);

  // Ignore check_suite events not for this app
  if (event.appID !== parseInt(serverConf.githubAppID)) {
    return { status: "ignored, not our app id" };
  }

  await db.storeRepository(event.owner, event.repo);

  // Ignore actions we don't care about
  if (event.action !== "rerequested") {
    return { status: "ignored, not an action we respond to" };
  }

  // Create the check runs
  for (let index = 0; index < event.pullRequests.length; index++) {
    await checkRun.createCheckRun(
      event.owner,
      event.repo,
      event.sha,
      event.pullRequests[index],
      event.cloneURL,
      event.sshURL,
      scm,
      cache,
      serverConf,
      db,
      logger
    );
  }
  return { status: "check runs created" };
}

/**
 * parse body into an event object
 * @param {*} body
 * @return {object} event
 */
function parseEvent(body) {
  const fullName = body.repository.full_name;
  const parts = fullName.split("/");
  const owner = parts[0];
  const repo = parts[1];
  return {
    appID: body.check_suite.app.id,
    owner: owner,
    repo: repo,
    action: body.action,
    pullRequests:
      body.check_suite.pull_requests != null
        ? body.check_suite.pull_requests
        : [],
    sha: body.check_suite.head_sha,
    cloneURL: body.repository.clone_url,
    sshURL: body.repository.ssh_url,
  };
}

module.exports.handle = handle;
