const yaml = require("js-yaml");

/**
 * path this handler will serve
 */
function path() {
  return "/admin/removeOrgConfigDefaults";
}

/**
 * http method this handler will serve
 */
function method() {
  return "post";
}

/**
 * if the route requires admin
 */
function requiresAdmin() {
  return true;
}

/**
 * handle index
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  const owner = req.body.owner;
  const repository = req.body.repository;
  await dependencies.cache.orgConfigDefaults.removeDefaults(owner);
  res.writeHead(301, {
    Location:
      "/admin/viewOrgConfigDefaults?owner=" +
      owner +
      "&repository=" +
      repository,
  });
  res.end();
}

module.exports.path = path;
module.exports.method = method;
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
