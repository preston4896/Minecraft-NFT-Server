const Tokens = artifacts.require("Tokens");
const DeFi = artifacts.require("DeFi");

module.exports = async function (deployer) {
  await deployer.deploy(Tokens);
  await deployer.deploy(DeFi, Tokens.address);
};
