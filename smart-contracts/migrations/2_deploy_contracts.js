const Tokens = artifacts.require("Tokens");
const DeFi = artifacts.require("DeFi");
const Gov = artifacts.require("Governance");
// const Stake = artifacts.require("Staking");

module.exports = async function (deployer) {
  await deployer.deploy(Tokens);
  await deployer.deploy(DeFi, Tokens.address);
  await deployer.deploy(Gov, Tokens.address);
  // await deployer.deploy(Stake, Tokens.address);
};
