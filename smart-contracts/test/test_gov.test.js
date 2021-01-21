const Tokens = artifacts.require("Tokens");
const Gov = artifacts.require("Governance");
const utils = require("../test_lib/utils");

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
        await tokens.safeTransferFrom(reserve, proposer, 1, 100, "0x0");
        await tokens.safeTransferFrom(reserve, voted_for, 1, 1, "0x0");
        await tokens.safeTransferFrom(reserve, voted_against, 1, 1, "0x0");

        // verify balance
        let propose_balance = await tokens.balanceOf(proposer, 1);
        let for_balance = await tokens.balanceOf(voted_for, 1);
        let against_balance = await tokens.balanceOf(voted_against, 1);

        assert.equal(propose_balance, 100);
        assert.equal(for_balance, 1);
        assert.equal(against_balance, 1);
    })

    it("2. Proposal creations.", async() => {
        let description = web3.utils.keccak256("Hello, world!");

        // an account attempts to create a proposal with insufficient governance token.
        try {
            await gov.createProposal(0, description, {from: voted_for});
        } catch (error) {
            assert(error.message.indexOf("revert") >= 0, "error message must contain revert.");
        }

        let expected_startTime = Math.floor(Date.now()/1000);
        let expected_endTime = expected_startTime + 60; // 1 minute to vote
        await gov.createProposal(expected_endTime, description, {from: proposer});

        // verify proposal
        let proposal1_obj = await gov.proposals(0);

        assert.equal(proposal1_obj.description, description, "Description should match.");
        assert.equal(proposal1_obj.end_date, expected_endTime, "End time should match.");
    })

    it("3. Test Voting.", async() => {
        // account attempts to vote without governance token.
        try {
            await gov.voteForProposal(0, {from: accounts[4]});
        } catch(error) {
            assert(error.message.indexOf("revert") >= 0, "error message must contain revert.");
        }

        try {
            await gov.voteAgainstProposal(0, {from: accounts[4]});
        } catch(error) {
            assert(error.message.indexOf("revert") >= 0, "error message must contain revert.");
        }

        await gov.voteForProposal(0, {from: voted_for});
        await gov.voteAgainstProposal(0, {from: voted_against});

        let pro_0 = await gov.proposals(0);

        // verify vote count.
        assert.equal(pro_0.votes_against, 1);
        assert.equal(pro_0.votes_for, 1);

        // verify votes.
        let voted_0_prop_0 = await gov.verify_votes(voted_for, 0);
        let voted_1_prop_0 = await gov.verify_votes(voted_against, 0);
        let voted_0_acc_4 = await gov.verify_votes(accounts[4], 0);
        assert.equal(voted_0_prop_0, true);
        assert.equal(voted_1_prop_0, true);
        assert.equal(voted_0_acc_4, false);

        // double voting attempts (conflicting votes).
        try {
            await gov.voteForProposal(0, {from: voted_against});
        } catch(error) {
            assert(error.message.indexOf("revert") >= 0, "error message must contain revert.");
        }

        try {
            await gov.voteAgainstProposal(0, {from: voted_for});
        } catch (error) {
            assert(error.message.indexOf("revert") >= 0, "error message must contain revert.");
        }

        // check square roots.
        await gov.voteForProposal(0, {from: proposer});
        pro_0 = await gov.proposals(0);

        // total = sqrt(1) + sqrt(100) = 11;
        let expected_total = 11;
        assert.equal(pro_0.votes_for, expected_total);
    })

    it("4. Create a proposal then vote past deadline.", async() => {
        // Take a snapshot to make sure that blockchain goes back in time to the point before this test is initiated.
        // let snapshot = await utils.takeSnapshot();
        // let snapshotID = snapshot['result'];

        let description = web3.utils.keccak256("You are late.");
        let expected_end = Math.floor(Date.now()/1000); // TODO: add 10 seconds delay, then uncomment time travel code.
        await gov.createProposal(expected_end, description, {from: proposer});

        // fast-forward fivve minute into the future.
        // let five = 5 * 60;
        // await utils.advanceBlockAndSetTime(five);

        // attempts to vote on prop 1
        try {
            await gov.voteForProposal(1, {from: voted_for});
        } catch (error) {
            assert(error.message.indexOf("revert") >= 0, "error message must contain revert.");
        }
        try {
            await gov.voteAgainstProposal(1, {from: voted_against});
        } catch (error) {
            assert(error.message.indexOf("revert") >= 0, "error message must contain revert.");
        }

        let pro_1 = await gov.proposals(1);

        // count votes - expected to be zero.
        assert.equal(pro_1.votes_against, 0);
        assert.equal(pro_1.votes_for, 0);

        // verify that votes were not casted.
        let voted_0_prop_1 = await gov.verify_votes(voted_for, 1);
        let voted_1_prop_1 = await gov.verify_votes(voted_against, 1);
        assert.equal(voted_0_prop_1, false);
        assert.equal(voted_1_prop_1, false);

        // restore time.
        // await utils.revertToSnapshot(snapshotID);
    }) 
})