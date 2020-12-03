const Tokens = artifacts.require("Tokens");
const DeFi = artifacts.require("DeFi");

module.exports = function (deployer) {
  deployer.deploy(Tokens);
  deployer.deploy(DeFi);
};
