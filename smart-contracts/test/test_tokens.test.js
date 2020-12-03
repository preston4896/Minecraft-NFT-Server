const Tokens = artifacts.require("Tokens");

contract("Tokens", (accounts) => {
    // declare contract instance.
    let tokens;
    let num_of_nft = 3;
    let MAX_EMERALDS;
    let MAX_SWORD;
    let MAX_LUCKY_POTION;

    // load the instance.
    before(async() => {
        tokens = await Tokens.deployed();
        MAX_EMERALDS = await tokens.EMERALDS_total_supply();
        MAX_SWORD = await tokens.SWORD_total_supply();
        MAX_LUCKY_POTION = await tokens.LUCKY_POTION_total_supply();
    })

    describe("Begin testing of: (1) Safe Transfer, (2) Safe Batch Transfer and (3) Approved Transfer", async() => {

        it("1. Test SafeTransfer.", async() => {
            let fromAcc = accounts[0];
            let toAcc = accounts[1];

            // unauthorized transfer - attempts to send tokens with insufficent balance.
            try {
                await tokens.safeTransferFrom(toAcc, fromAcc, 1, 2, "0x0", {from: toAcc});
            } catch (error) {
                assert(error.message.indexOf("revert") >= 0, "error message must contain revert.");
            }

            // valid transfer - transfer all tokens and verify balance
            let max_arr = [MAX_EMERALDS, MAX_SWORD, MAX_LUCKY_POTION];
            for (let i = 0; i < num_of_nft; i++) {
                await tokens.safeTransferFrom(fromAcc, toAcc, i, max_arr[i], "0x0");
                let expected_balance = max_arr[i];
                let from_balance = await tokens.balanceOf(fromAcc, i);
                let to_balance = await tokens.balanceOf(toAcc, i);
                assert.equal(from_balance.toNumber(), 0, "account 0 balance should match");
                assert.equal(to_balance.toNumber(), expected_balance, "account 1 balance should match");
            }
        })

        it("2. Test BatchTransfer.", async() => {
            let fromAcc = accounts[1];
            let toAcc = accounts[0];
            let batch_ids = new Array(num_of_nft).fill(0).map((e,i) => {return i;});

            // account 0 attempts to batch transfer with zero balance.
            try {
                await tokens.safeBatchTransferFrom(toAcc, fromAcc, batch_ids, [1,1,1], "0x0");
            } catch (error) {
                assert(error.message.indexOf("revert") >= 0, "error message must contain revert.");
            }

            // transfers all tokens back to acc 0.
            let max_arr = [MAX_EMERALDS, MAX_SWORD, MAX_LUCKY_POTION];
            await tokens.safeBatchTransferFrom(fromAcc, toAcc, batch_ids, max_arr, "0x0", {from: fromAcc});

            // verify balance.
            let batch_from = new Array(num_of_nft).fill(fromAcc);
            let batch_to = new Array(num_of_nft).fill(toAcc);
            let from_balance = await tokens.balanceOfBatch(batch_from, batch_ids);
            let to_balance = await tokens.balanceOfBatch(batch_to, batch_ids);

            for (let i = 0; i < num_of_nft; i++) {
                assert.equal(from_balance[i].toNumber(), 0, "account 1's balance should be 0.");
                assert.equal(to_balance[i].toNumber(), max_arr[i], "account 0's balance should be max.");
            }
        })

        it("3. Test ApprovedTransfer. ", async() => {
            let fromAcc = accounts[0];
            let authorizedAcc = accounts[1];
            let toAcc = accounts[2];
            let max_arr = [MAX_EMERALDS, MAX_SWORD, MAX_LUCKY_POTION];
            let arr_75 = max_arr.map((e) => {return Math.floor(e * 0.75);});
            let batch_ids = new Array(num_of_nft).fill(0).map((e,i) => {return i;});

            // account 1 attempts to transfer prior approval.
            try {
                await tokens.safeTransferFrom(fromAcc, toAcc, 0, 7500, "0x0", {from: authorizedAcc});
            } catch (error) {
                assert(error.message.indexOf("revert") >= 0, "error message must contain revert.");
            }

            // account 0 sets approval for account 1.
            await tokens.setApprovalForAll(authorizedAcc, true);
            // verify approval.
            let approval = await tokens.isApprovedForAll(fromAcc, authorizedAcc);
            assert.equal(approval, true, "Account 1 is approved.");

            // account 1 transfers 75% of all tokens to account 2.
            await tokens.safeBatchTransferFrom(fromAcc, toAcc, batch_ids, arr_75, "0x0", {from: authorizedAcc});

            // verify balance
            for (let i = 0; i < num_of_nft; i++) {
                let transferred = arr_75[i];
                let balance = max_arr[i] - transferred;
                let from_balance = await tokens.balanceOf(fromAcc, i);
                let to_balance = await tokens.balanceOf(toAcc, i);
                assert.equal(from_balance, balance, "25% of tokens remained in account 0.");
                assert.equal(to_balance, transferred, "75% of token received by account 2.");
            }

            // revoke approval for account 1.
            await tokens.setApprovalForAll(authorizedAcc, false);
            // verify revoke.
            let revoke = await tokens.isApprovedForAll(fromAcc, authorizedAcc);
            assert.equal(revoke, false, "Account 1 is no longer approved.");

            // account 1 attempts to transfer fund without approval
            try {
                await tokens.safeTransferFrom(fromAcc, toAcc, 0, 7500, "0x0", {from: authorizedAcc});
            } catch (error) {
                assert(error.message.indexOf("revert") >= 0, "error message must contain revert.");
            }
        })
    })
})