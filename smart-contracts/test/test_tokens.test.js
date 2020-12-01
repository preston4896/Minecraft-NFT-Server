const Tokens = artifacts.require("Tokens");

contract("Tokens", (accounts) => {
    // declare contract instance.
    let tokens;
    let num_of_nft = 3;
    let num_of_accounts = 2;
    let deploy_balance = [];
    let target_balance = [];

    // load the instance.
    before(async() => {
        tokens = await Tokens.deployed();
    })

    describe("Begin testing of: (1) check balances, (2) safe transfer and (3) safe batch transfer", async() => {
        it("Load all NFT balances for deployed and target accounts.", async() => {
            for (let i = 0; i < num_of_accounts; i++) {
                for (let j = 0; j < num_of_nft; j++) {
                    let currBalance = await tokens.balanceOf(accounts[i], j);
                    if (i == 0) {deploy_balance.push(currBalance);}
                    else {target_balance.push(currBalance)};
                    console.log(`NFT # ${j} balance for account ${i} is ${currBalance}.`);
                }
            }
        })

        it("SafeTransfer a random amount of NFT Tokens from deployed (acc #0) to target (acc #1).", async() => {
            for (let i = 0; i < num_of_nft; i++) {
                let randomAmount;
                if (i == 0) {
                    randomAmount = Math.floor(Math.random() * 1000);
                }
                else if (i == 1) {
                    randomAmount = Math.floor(Math.random() * 5);
                }
                else {
                    randomAmount = Math.floor(Math.random() * 2);
                }
                let expected_deploy_balance = deploy_balance[i].toNumber() - randomAmount;
                let expected_target_balance = target_balance[i].toNumber() + randomAmount;
                console.log(`Transferring ${randomAmount} of NFT # ${i} from account 0 to account 1.`);
                await tokens.safeTransferFrom(accounts[0], accounts[1], i, randomAmount, "0x0");
                let actual_deploy_balance = await tokens.balanceOf(accounts[0], i);
                let actual_target_balance = await tokens.balanceOf(accounts[1], i);
                assert.equal(actual_deploy_balance.toNumber(), expected_deploy_balance, "Actual and expected for account 0 should match.");
                assert.equal(actual_target_balance.toNumber(), expected_target_balance, "Actual and expected for account 1 should match.");

                // update balance.
                deploy_balance[i] = actual_deploy_balance;
                target_balance[i] = actual_target_balance;
            }
        })

        it("Batch transfer all tokens from acc #0 to acc#1", async() => {
            await tokens.safeBatchTransferFrom(accounts[0], accounts[1], [0,1,2], [deploy_balance[0], deploy_balance[1], deploy_balance[2]], "0x0");
            deploy_balance = await tokens.balanceOfBatch(new Array(num_of_nft).fill(accounts[0]), [0,1,2]);
            target_balance = await tokens.balanceOfBatch(new Array(num_of_nft).fill(accounts[1]), [0,1,2]);
            for (let i = 0; i < num_of_nft; i++) {
                assert.equal(deploy_balance[i].toNumber(), 0, "Balance should be zero.");
            }

            console.log("Final balance for both accounts: ");
            for (let i = 0; i < num_of_accounts; i++) {
                for (let j = 0; j < num_of_nft; j++) {
                    let acc = i == 0 ? deploy_balance : target_balance;
                    console.log(`NFT # ${j} balance for account ${i} is ${acc[j]}.`);
                }
            }
        })
    })
})