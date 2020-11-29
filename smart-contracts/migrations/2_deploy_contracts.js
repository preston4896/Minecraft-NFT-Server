const Tokens = artifacts.require("Tokens");

module.exports = function (deployer) {
  deployer.deploy(Tokens);
};
