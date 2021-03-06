const prettyMilliseconds = require("pretty-ms");

/**
 * path this handler will serve
 */
function path() {
  return "/repositories/repositoryDetails";
}

/**
 * handle index
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  const owner = req.query.owner;
  const repository = req.query.repository;

  const currentRepositoryBuilds = await dependencies.cache.repositoryBuilds.fetchRepositoryBuilds(
    owner,
    repository
  );
  const activeBuilds = await dependencies.db.activeBuilds(owner, repository);

  const repositoryBuilds = [];

  // Now check repository builds and don't add any that are active
  for (let index = 0; index < currentRepositoryBuilds.length; index++) {
    const recentBuild = await dependencies.db.mostRecentBuild(
      owner,
      repository,
      currentRepositoryBuilds[index]
    );

    if (recentBuild.rows.length > 0) {
      repositoryBuilds.push({
        build: currentRepositoryBuilds[index],
        message: recentBuild.rows[0].started_at,
      });
    } else {
      repositoryBuilds.push({
        build: currentRepositoryBuilds[index],
        message: "",
      });
    }
  }

  const sortedBuilds = repositoryBuilds.sort(function (a, b) {
    if (a.build < b.build) {
      return -1;
    } else if (a.build > b.build) {
      return 1;
    } else {
      return 0;
    }
  });

  // Get the branch list
  const branchBuilds = await dependencies.db.fetchBuildKeys(
    owner,
    repository,
    "branch-push"
  );

  // Get the release list
  const releaseBuilds = await dependencies.db.fetchBuildKeys(
    owner,
    repository,
    "release"
  );
  const releases = [];
  for (let index = 0; index < releaseBuilds.rows.length; index++) {
    if (!releases.includes(releaseBuilds.rows[index].build_key)) {
      releases.push(releaseBuilds.rows[index].build_key);
    }
  }

  // Get the pull request list
  const prBuilds = await dependencies.db.fetchBuildKeys(
    owner,
    repository,
    "pull-request"
  );

  res.render(dependencies.viewsPath + "repositories/repositoryDetails", {
    owners: owners,
    isAdmin: req.validAdminSession,
    owner: owner,
    repository: repository,
    activeBuilds: activeBuilds.rows,
    repositoryBuilds: sortedBuilds,
    branchBuilds: branchBuilds.rows,
    releases: releases,
    prBuilds: prBuilds.rows,
    prettyMilliseconds: (ms) => (ms != null ? prettyMilliseconds(ms) : ""),
  });
}

module.exports.path = path;
module.exports.handle = handle;
