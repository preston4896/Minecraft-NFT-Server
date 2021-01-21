const Tokens = artifacts.require("Tokens");
const DeFi = artifacts.require("DeFi");
// time-travel utils.js import
const utils = require("../test_lib/utils");

contract("DeFi", (accounts) => {
    let tokens;
    let defi;
    let reserve = accounts[0];
    let borrower_1 = accounts[1]; // possesses NFT tokens. (collatoral)
    let borrower_2 = accounts[2]; // possesses NFT tokens. (collatoral)
    let lender = accounts[3]; // possesses fungible tokens. (funds)
    let apy = 1; // 100%, TODO: Import SafeMath for the contract. @mw2000
    let YEAR_IN_SECONDS = (3600 * 24 * 365);

    // load the contract instances.
    before(async() => {
        tokens = await Tokens.deployed();
        defi = await DeFi.deployed();
    })

    it("1. Prior Test Initialization. Borrower Attempts To Open Trade Without NFT Token.", async() => {
        try {
            await defi.openTrade(1, borrower_1, 20, apy);
        } catch (error) {
            assert(error.message.indexOf("revert") >= 0, "error message must contain revert.");
        }
    })

    it("2. Initialize The Test By Distributing NFTs to Borrowers and Fungible Tokens to Lenders.", async() => {
        // First, mint token id #2.
        await tokens.mint(10);
        
        // For the simplicity of this test, the "reserve" account is holding the entire supply of the tokens.
        // lender is given 10000 fungible tokens.
        // borrower 1 is given one of nft #1 and nft #2 each.
        // borrower 2 is given one nft #2.
        let funReceipt = await tokens.safeTransferFrom(reserve, lender, 0, 10000, "0x0");
        let b1Receipt = await tokens.safeBatchTransferFrom(reserve, borrower_1, [1,2], [1,1], "0x0");
        let b2Receipt = await tokens.safeTransferFrom(reserve, borrower_2, 2, 1, "0x0");
        
        // verify transfers.
        assert.equal(funReceipt.logs[0].args[0], reserve);
        assert.equal(funReceipt.logs[0].args[2], lender);
        assert.equal(funReceipt.receipt.status, true);
        assert.equal(b1Receipt.logs[0].args[0], reserve);
        assert.equal(b1Receipt.logs[0].args[2], borrower_1);
        assert.equal(b1Receipt.receipt.status, true);
        assert.equal(b2Receipt.logs[0].args[0], reserve);
        assert.equal(b2Receipt.logs[0].args[2], borrower_2);
        assert.equal(b2Receipt.receipt.status, true);

        // verify balance
        let lender_balance = await tokens.balanceOf(lender, 0);
        let b1_balance = await tokens.balanceOf(borrower_1, 1);
        let b2_balance = await tokens.balanceOf(borrower_2, 2);
        assert.equal(lender_balance, 10000);
        assert.equal(b1_balance, 1);
        assert.equal(b2_balance, 1);
    })

    it("3. Test Token Contract Address.", async() => {
        let actual_token_address = tokens.address;
        let expected_token_address = await defi.tokensContract();
        assert.equal(actual_token_address, expected_token_address, "Address should match.");
    })

    // IMPORTANT: the remainder of the test will fail if this part of the test is not executed.
    // Suggestion: @mw2000 consider adding these functions from the front-end with a trigger.
    // So to make sure the user can only approves the contract to move their tokens, after a click of a button.
    it("IMPORTANT: Granting contract permission for ownership.", async() => {
        // permission from lender.
        await tokens.setApprovalForAll(defi.address, true, {from: lender});
        let lenderPermission = await tokens.isApprovedForAll(lender, defi.address);
        assert.equal(lenderPermission, true); 

        // permission from borrower_1.
        await tokens.setApprovalForAll(defi.address, true, {from: borrower_1});
        let b1Permission = await tokens.isApprovedForAll(borrower_1, defi.address);
        assert.equal(b1Permission, true);

        // permission from borrower_2.
        await tokens.setApprovalForAll(defi.address, true, {from: borrower_2});
        let b2Permission = await tokens.isApprovedForAll(borrower_2, defi.address);
        assert.equal(b2Permission, true);
    })

    it("4. Test Open Trade.", async() => {
        // borrower 1 opens a loan of 1000 tokens and used nft #2 as collatoral.
        await defi.openTrade(1, borrower_1, 1000, apy, {from: borrower_1});

        // verify that borrow_1 no longer has nft #1.
        let b1_balance = await tokens.balanceOf(borrower_1, 1);
        assert.equal(b1_balance.toNumber(), 0);
        
        // verify that contract has possession of borrower 1's nft.
        let cb1_balance = await tokens.balanceOf(defi.address, 1);
        assert.equal(cb1_balance.toNumber(), 1, "1 NFT token expected.");

        // borrower 2 attempts to open a loan of 1000 tokens using nft #1 as collatoral -- expected to fail.
        try {
            await defi.openTrade(1, borrower_2, 1000, apy, {from: borrower_2});
        } catch (error) {
            assert(error.message.indexOf("revert") >= 0, "error message must contain revert.");
        }

        // verify that borrower_2 still has nft token #2
        let b2_balance = await tokens.balanceOf(borrower_2, 2);
        assert.equal(b2_balance.toNumber(), 1);

        // verify that contract does not have any possession of nft token #2.
        let cb2_balance = await tokens.balanceOf(defi.address, 2);
        assert.equal(cb2_balance.toNumber(), 0, "0 NFT tokens expected.");

    })

    it("5. Test Lending.", async() => {
        // borrower 1 begins loan.
        await defi.lendToTrade(0, {from: lender});

        // verify contract balance.
        let contract_nft_balance = await tokens.balanceOf(defi.address, 1);
        assert.equal(contract_nft_balance.toNumber(), 1, "NFT remains in the contract.");

        // verify lender balance.
        let lender_fungible_balance = await tokens.balanceOf(lender, 0);
        assert.equal(lender_fungible_balance.toNumber(), 9000);
    })

    it("6. Borrower attempts to open excess loan.", async() => {
        await defi.openTrade(2, borrower_1, 10000, apy, {from: borrower_1});

        // lender attempts to finance the borrower. -- expected to fail
        try {
            await defi.lendToTrade(1, {from: lender});
        } catch (error) {
            assert(error.message.indexOf("revert") >= 0, "error message must contain revert.");
        }

        // lender still has 9000 fungible tokens.
        let lender_fungible_balance = await tokens.balanceOf(lender, 0);
        assert.equal(lender_fungible_balance.toNumber(), 9000);

        // IMPORTANT: Borrower should be able to cancel their loans while they still can.
    })

    it("7. Borrower 1 pays 50% loan instantly.", async() => {
        // verify borrow 1's info.
        let b1 = await defi.trades(0);

        assert.equal(b1.nft_id, 1, "NFT #1");
        assert.equal(b1.lender, lender, "Lender address should match.");
        assert.equal(b1.borrower, borrower_1, "Borrower address should match.");
        assert.equal(b1.borrowing_amount, 1000, "1000 tokens loan.");
        assert.equal(b1.paid_back_amount, 0, "No payment has been made yet.");
        assert.equal(b1.state, 1, "FINANCED state.");

        // borrower 1 attempts to pay loan without funds.
        try {
            await defi.payInterest(0, 500);
        } catch (error) {
            assert(error.message.indexOf("revert") >= 0, "error message must contain revert.");
        }

        // borrower 1 pays 50% (500 tokens) of the loan.
        await tokens.safeTransferFrom(reserve, borrower_1, 0, 5000, "0x0"); // Faucet: 5000 tokens to borrower 1.
        await defi.payInterest(0, 500, {from: borrower_1});

        // verify borrower 1's balance.
        let b1_fungible_balance = await tokens.balanceOf(borrower_1, 0);
        assert.equal(b1_fungible_balance, 5500);

        // verify amount paid by borrower 1
        b1 = await defi.trades(0); // update.
        assert.equal(b1.paid_back_amount, 500);

        // verify contract has received the payment from borrower 1.
        let contract_balance = await tokens.balanceOf(defi.address, 0);
        assert.equal(contract_balance, 500);

        // borrower 1 is still in loan.
        assert.equal(b1.state, 1);
    })

    // TODO: Import SafeMath library. Solidity is unable to process floating point numbers.
    // it("8. Borrower 1 pays the remainder and completes the loan. (1 year later)", async() => {
    //     // Take a snapshot to make sure that blockchain goes back in time to the point before this test is initiated.
    //     let snapshot = await utils.takeSnapshot();
    //     let snapshotID = snapshot['result'];

    //     let b1 = await defi.trades(0);

    //     // time travel 1 year into the future.
    //     let diff = ((Date.now() / 1000) - b1.start_time.toNumber());
    //     let forward = YEAR_IN_SECONDS;
    //     await utils.advanceBlockAndSetTime(forward);

    //     // verify that the loan is indeed two years old.
    //     let block_year = b1.start_time.toNumber() + forward + diff;
    //     assert.equal(Math.floor(block_year), Math.floor((Date.now() / 1000) + forward), "Future time does not match.");

    //     // test interest function.
    //     let interest = await defi.calculateReturnAmount(forward, b1.borrowing_amount, apy);
    //     assert.equal(interest.toNumber(), 1000, "100% interest = 1000 $.");

    //     // // pays remainder of the loan.
    //     // await defi.payInterest(0, amount_owed, {from: borrower_1});

    //     // // verify amount paid by borrower 1
    //     // b1 = await defi.trades(0); // update.
    //     // assert.equal(b1.paid_back_amount.toNumber(), 500 + amount_owed);

    //     // // verify contract balance.
    //     // let contract_balance = await tokens.balanceOf(defi.address, 0);
    //     // assert.equal(contract_balance, 500 + amount_owed);

    //     // // borrower 1 still has to pay interest, therefore the loan is still open.
    //     // assert.equal(b1.state, 1);

    //     // pays the interest then clost the loan.
    //     await defi.payInterest(0, interest, {from: borrower_1});

    //     // verify amount paid by borrower 1
    //     b1 = await defi.trades(0); // update.
    //     assert.equal(b1.paid_back_amount.toNumber(), 1500);

    //     // verify borrower_1 balance
    //     let balance = await tokens.balanceOf(borrower_1, 0);
    //     assert.equal(balance, 4500);

    //     // verify contract balance.
    //     contract_balance = await tokens.balanceOf(defi.address, 0);
    //     assert.equal(contract_balance, 1500);

    //     // meets the condition to close loan.
    //     assert(b1.paid_back_amount >= b1.borrowing_amount, "Original amount paid.");
    //     assert(b1.paid_back_amount >= interest, "Paid interest.");

    //     // borrower 1 closes loan
    //     assert.equal(b1.state, 3);

    //     // verify nft token returned to borrow 1.
    //     let b1_nft = await tokens.balanceOf(borrower_1, 1);
    //     assert.equal(b1_nft, 1);

    //     // verify lender received their funds.
    //     let lender_fund = await tokens.balanceOf(lender, 0);
    //     assert.equal(lender_fund, 10500);

    //     // contract no longer is in possession of the tokens.
    //     let contract_nft = await tokens.balanceOf(defi.address, 1);
    //     assert.equal(contract_nft, 0);

    //     // restore time.
    //     await utils.revertToSnapshot(snapshotID);
    // })

    it("9: Borrower 2 takes a loan and gets liquidated.", async() => {
        // Take a snapshot to make sure that blockchain goes back in time to the point before this test is initiated.
        let snapshot = await utils.takeSnapshot();
        let snapshotID = snapshot['result'];

        await defi.openTrade(2, borrower_2, 2000, apy, {from: borrower_2});

        // verify collateral
        let b2_nft = await tokens.balanceOf(borrower_2, 2);
        assert.equal(b2_nft, 0);
        let b2_collateral = await tokens.balanceOf(defi.address, 2);
        assert.equal(b2_collateral, 2); // See test case #6 - borrower 1 still has a pending loan using nft #2 as a collateral.

        // begin loan
        await defi.lendToTrade(2, {from: lender});

        // verify lender balance
        let lender_balance = await tokens.balanceOf(lender, 0);
        assert.equal(lender_balance.toNumber(), 7000); // temp

        // one year later.
        // time travel 1 year into the future.
        let forward = YEAR_IN_SECONDS;
        await utils.advanceBlockAndSetTime(forward);

        // liquidate trade.
        await defi.liquidateTrade(2, {from: lender});
        let trade = await defi.trades(2);

        // borrower 2 does not pay back any loans.
        assert.equal(trade.paid_back_amount, 0);

        // verify lender balance
        let lender_nft = await tokens.balanceOf(lender, 2);
        assert.equal(lender_nft, 1);
        let lender_fungible = await tokens.balanceOf(lender, 0);
        assert.equal(lender_fungible, 7000); // temp

        // contract no longer has possession of collateral
        b2_collateral = await tokens.balanceOf(defi.address, 2);
        assert.equal(b2_collateral, 1); // See test case #6

        // verify liquidated.
        assert.equal(trade.state, 2, "Loan liquidated.");

        // restore time.
        await utils.revertToSnapshot(snapshotID);
    })

    it("10. Lender attempts to fraudently finance a loan.", async() => {
        try {
            await defi.lendToTrade(0, {from: lender});
        } catch (error) {
            assert(error.message.indexOf("revert") >= 0, "error message must contain revert.");
        }
    })
})