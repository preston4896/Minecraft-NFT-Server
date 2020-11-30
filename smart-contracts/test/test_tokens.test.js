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
                    console.log(`NFT ID: ${j} balance for account ${i} is ${currBalance}.`);
                }
            }
        })

        it("SafeTransfer a random amount of NFT Tokens from deployed to target account.", async() => {
            for (let i = 0; i < num_of_nft; i++) {
                // generates a random number from 1 - 1000.
                let randomAmount = Math.random() * 1000;
                let expected_deploy_balance = deploy_balance[i] - randomAmount;
                let expected_target_balance = target_balance[i] + randomAmount;
                console.log(`Transfering ${randomAmount} of NFT Token ${i} from account 0 to account 1.`);
                await tokens.safeTransferFrom(accounts[0], accounts[1], i, randomAmount, "0x0");
                let actual_deploy_balance = await tokens.balanceOf(accounts[0], i);
                let actual_target_balance = await tokens.balanceOf(accounts[1], i);
                assert.equal(actual_deploy_balance, expected_deploy_balance, "Actual and expected for account 0 should match.");
                assert.equal(actual_target_balance, expected_target_balance, "Actual and expected for account 1 should match.");

                // update balance.
                deploy_balance[i] = actual_deploy_balance;
                target_balance[i] = actual_target_balance;
            }
        })
    })
})