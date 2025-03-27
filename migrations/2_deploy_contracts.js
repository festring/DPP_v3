// migrations/2_deploy_contracts.js
const Contacts = artifacts.require("Contacts");

module.exports = function (deployer) {
  deployer.deploy(Contacts);
};
