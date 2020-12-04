const Tokens = artifacts.require("Tokens");
const DeFi = artifacts.require("DeFi");

contract("DeFi", (accounts) => {
    let tokens;
    let defi;
    let reserve = accounts[0];
    let borrower_1 = accounts[1]; // possesses NFT tokens. (collatoral)
    let borrower_2 = accounts[2]; // possesses NFT tokens. (collatoral)
    let lender = accounts[3]; // possesses fungible tokens. (funds)
    let apy = 2;

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
        let funReceipt = await tokens.safeTransferFrom(reserve, lender, 0, 10000, "0x0");
        let b1Receipt = await tokens.safeBatchTransferFrom(reserve, borrower_1, [1,2], [2,1], "0x0");
        let b2Receipt = await tokens.safeTransferFrom(reserve, borrower_2, 1, 1, "0x0");
        
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
        assert.equal(b1_balance, 2);
        assert.equal(b2_balance, 0);
    })

    it("3. Test Token Contract Address", async() => {
        let actual_token_address = tokens.address;
        let expected_token_address = await defi.tokensContract();
        assert.equal(actual_token_address, expected_token_address, "Address should match.");
    })

    // it("3. Test Open Trade, Then Begin Lending.", async() => {
    //     // borrower 1 opens a loan of 1000 tokens and used nft #2 as collatoral.
    //     let expected_trade_id = 0;
    //     let trade_1 = await defi.openTrade(2, borrower_1, 1000, apy, {from: borrower_1});
    //     assert.equal(trade_1.logs[0].args.trade_id.toNumber(), expected_trade_id, "trade id should match.");

    //     // // borrower 2 attempts to open a loan of 1000 tokens using nft #2 as collatoral -- expected to fail.
    //     // try {
    //     //     await defi.openTrade(2, borrower_2, 1000, apy);
    //     // } catch (error) {
    //     //     assert(error.message.indexOf("revert") >= 0, "error message must contain revert.");
    //     // }
    // })
})