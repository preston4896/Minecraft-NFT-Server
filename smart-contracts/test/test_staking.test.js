const Tokens = artifacts.require("Tokens");
const Stake = artifacts.require("Staking");

contract("Staking", (accounts) => {
    let owner = accounts[0];
    let staker = accounts[1];
    let tokens;
    let staking;

    // load the contract instances.
    before(async() => {
        tokens = await Tokens.deployed();
        staking = await Stake.deployed();
    })

    it("1. Initialize the test. Distribute fungible tokens and verify contract owner.", async() => {
        // verify owner
        let contract_owner = await staking.owner();
        assert.equal(contract_owner, owner, "Address should match.");

        // distributing fungible tokens
        await tokens.safeTransferFrom(owner, staker, 0, 400, "0x0");

        // verify balance
        let balance = await tokens.balanceOf(staker, 0);
        assert.equal(balance, 400);
    })

    it("IMPORTANT: Staker grants staking contract transfer permission.", async() => {
        await tokens.setApprovalForAll(staking.address, true, {from: staker});
        let permission = await tokens.isApprovedForAll(staker, staking.address);
        assert.equal(permission, true, "Contract should be granted permission.");
    })

    it("2. Test Stake.", async() => {
        // user attempts to stake without owning fungible tokens.
        try {
            await staking.stake(1, {from: accounts[2]});
        } catch (error) {
            assert(error.message.indexOf("revert") >= 0, "error message must contain revert.");
        }

        // account 1 staking begins here.
        let expected_amount = 100;
        await staking.stake(expected_amount, {from: staker});

        // verify stake.
        let actual_amount = await staking.stakers(staker);
        assert.equal(actual_amount, expected_amount, "Amount should match.");

        // check balance.
        let actual_balance = await tokens.balanceOf(staker, 0);
        let expected_balance = 400 - expected_amount;
        assert.equal(actual_balance, expected_balance, "Balance should match.");

        // increase stake.
        let stake_more = 150;
        await staking.stake(stake_more, {from: staker});
        actual_amount = await staking.stakers(staker);
        assert.equal(actual_amount, expected_amount + stake_more, "Amount should match.");

        // check balance.
        actual_balance = await tokens.balanceOf(staker, 0);
        expected_balance -= stake_more;
        assert.equal(actual_balance, expected_balance, "Balance should match.");
    })

    it("3. Test contract ownership.", async() => {
        // non-owner attempts to add new nft
        try {
            await staking.addNFT(1, 1, {from: staker});
        } catch (error) {
            assert(error.message.indexOf("revert") >= 0, "error message must contain revert.");
        }

        // owner adds new NFT. q = 1; p = 1
        await staking.addNFT(1, 1);

        // verify new NFT has been added into the tokens contract.
        let expected_id = 2;
        let actual_id = await tokens.get_num_of_token_types.call() - 1;
        assert.equal(actual_id, expected_id, "NFT ID should match.");

        // verify new NFT cost has been added into the staking contract.
        let expected_cost = 1;
        let actual_cost = await staking.nft_cost(expected_id);
        assert.equal(actual_cost, expected_cost, "Cost should match.");

        // verify the staking contract currently possess the correct amount of newly minted nft.
        let balance = await tokens.balanceOf(staking.address, expected_id);
        assert.equal(balance, 1, "There should only be 1 minted NFT.");
    })

    it("4. Test unstake (withdrawal), then exit.", async() => {
        // unauthorized withdrawal
        try {
            await staking.withdraw(300, {from: staker});
        } catch (error) {
            assert(error.message.indexOf("revert") >= 0, "error message must contain revert.");
        }

        let before_balance = await tokens.balanceOf(staker, 0);

        // unstake
        await staking.withdraw(50, {from: staker});

        // verify balance
        let after_balance = await tokens.balanceOf(staker, 0);
        assert.equal(after_balance - before_balance, 50);

        // verify remaining staked amount.
        let expected_staked = 200;
        let actual_staked = await staking.stakers(staker);
        assert.equal(actual_staked, expected_staked);

        // exit
        await staking.exit({from: staker});

        // balance is fully withdrawn.
        let expected_final_bal = 400;
        let actual_final_bal = await tokens.balanceOf(staker, 0);
        assert.equal(actual_final_bal, expected_final_bal, "Balance should be fully withdrawn.");

        // no more funds staked.
        expected_staked = 0;
        actual_staked = await staking.stakers(staker);
        assert.equal(actual_staked, expected_staked);
    })

    it("5. Test NFT redemption.", async() => {
        // attempts to redeem a non-existent NFT.
        try {
            await staking.redeem(3);
        } catch (error) {
            assert(error.message.indexOf("revert") >= 0, "error message must contain revert.");
        }

        // attempts to redeem a fungible token
        try {
            await staking.redeem(0);
        } catch (error) {
            assert(error.message.indexOf("revert") >= 0, "error message must contain revert.");
        }

        // attempts to redeem a governance token.
        try {
            await staking.redeem(1);
        } catch (error) {
            assert(error.message.indexOf("revert") >= 0, "error message must contain revert.");
        }

        // redemption begins here.
        let point = await staking.points(staker);
        // console.log(point.toNumber()); <-- I am getting very high number (in the billions) is this intended?
        await staking.redeem(2, {from: staker});

        // verify that staker redeemed NFT.
        let redeemed = await tokens.balanceOf(staker, 2);
        assert.equal(redeemed, 1);

        // contract no longer possesses the NFT.
        let contract_nft = await tokens.balanceOf(staking.address, 2);
        assert.equal(contract_nft, 0);

        // staker attempts to redeem the same NFT again, which is no longer in circulation.
        try {
            await staking.redeem(2, {from: staker});
        } catch (error) {
            assert(error.message.indexOf("revert") >= 0, "error message must contain revert.");
        }
    })
})