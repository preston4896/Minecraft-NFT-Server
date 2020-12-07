const Tokens = artifacts.require("Tokens");
const DeFi = artifacts.require("DeFi");

contract("DeFi", (accounts) => {
    let tokens;
    let defi;
    let reserve = accounts[0];
    let borrower_1 = accounts[1]; // possesses NFT tokens. (collatoral)
    let borrower_2 = accounts[2]; // possesses NFT tokens. (collatoral)
    let lender = accounts[3]; // possesses fungible tokens. (funds)
    let apy = 2; // 200%, TODO: Import SafeMath for the contract. @mw2000

    // load the contract instances.
    before(async() => {
        tokens = await Tokens.deployed();
        defi = await DeFi.deployed();
    })

    it("1. Prior Test Initialization. Borrower Attempts To Open Trade Without NFT Token", async() => {
        try {
            await defi.openTrade(1, borrower_1, 20, apy);
        } catch (error) {
            assert(error.message.indexOf("revert") >= 0, "error message must contain revert.");
        }
    })

    it("2. Initialize The Test By Distributing NFTs to Borrowers and Fungible Tokens to Lenders", async() => {
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

    it("3. Test Token Contract Address", async() => {
        let actual_token_address = tokens.address;
        let expected_token_address = await defi.tokensContract();
        assert.equal(actual_token_address, expected_token_address, "Address should match.");
    })

    // IMPORTANT: For some reason, the remainder of the test will fail if this part of the test is not executed.
    it("IMPORTANT: Granting contract permission for ownership", async() => {
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

    it("4. Test Open Trade", async() => {
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
        let contract_address = defi.address;
        let contract_nft_balance = await tokens.balanceOf(contract_address, 1);
        assert.equal(contract_nft_balance.toNumber(), 1, "NFT remains in the contract.");
        let contract_fungible_balance = await tokens.balanceOf(contract_address, 0);
        assert.equal(contract_fungible_balance.toNumber(), 1000, "Contract is now funded with fungible tokens.");

        // verify lender balance.
        let lender_fungible_balance = await tokens.balanceOf(lender, 0);
        assert.equal(lender_fungible_balance.toNumber(), 9000);
    })

    it("6. Borrower attempts to open excess loan.", async() => {
        await defi.openTrade(2, borrower_2, 10000, apy, {from: borrower_2});

        // lender attempts to finance the borrower. -- expected to fail
        try {
            await defi.lendToTrade(1, {from: lender});
        } catch (error) {
            assert(error.message.indexOf("revert") >= 0, "error message must contain revert.");
        }

        // lender still has 9000 fungible tokens.
        let lender_fungible_balance = await tokens.balanceOf(lender, 0);
        assert.equal(lender_fungible_balance.toNumber(), 9000);
    })
})