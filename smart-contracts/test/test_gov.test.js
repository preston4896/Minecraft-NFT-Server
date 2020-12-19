const Tokens = artifacts.require("Tokens");
const Gov = artifacts.require("Governance");

contract("Governance", (accounts) => {

    let tokens;
    let gov;
    let reserve = accounts[0];
    let proposer = accounts[1];
    let voted_for = accounts[2];
    let voted_against = accounts[3];

    // load contract instance
    before(async() => {
        tokens = await Tokens.deployed();
        gov = await Gov.deployed();
    })

    it("1. Initialize the test by distributing governance tokens.", async() => {
        let p_receipt = await tokens.safeTransferFrom(reserve, proposer, 3, 100, "0x0");
        let for_receipt = await tokens.safeTransferFrom(reserve, voted_for, 3, 1, "0x0");
        let against_receipt = await tokens.safeTransferFrom(reserve, voted_against, 3, 1, "0x0");

        // verify transfer
        assert.equal(p_receipt.logs[0].args[0], reserve);
        assert.equal(p_receipt.logs[0].args[2], proposer);
        assert.equal(p_receipt.receipt.status, true);
        assert.equal(for_receipt.logs[0].args[0], reserve);
        assert.equal(for_receipt.logs[0].args[2], voted_for);
        assert.equal(for_receipt.receipt.status, true);
        assert.equal(against_receipt.logs[0].args[0], reserve);
        assert.equal(against_receipt.logs[0].args[2], voted_against);
        assert.equal(against_receipt.receipt.status, true);
    })

})