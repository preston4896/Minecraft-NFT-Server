const helper = require("./utils.js");

describe("Testing Helper Functions", () => {
    it("should advance the blockchain forward a block", async () =>{
        const originalBlockHash = web3.eth.getBlock('latest').hash;
        let newBlockHash = web3.eth.getBlock('latest').hash;

        newBlockHash = await helper.advanceBlock();

        assert.notEqual(originalBlockHash, newBlockHash);
    });

    it("should be able to advance time and block together", async () => {
        const advancement = 600;
        const originalBlock = await web3.eth.getBlock('latest');
        const newBlock = await helper.advanceTimeAndBlock(advancement);
        const timeDiff = newBlock.timestamp - originalBlock.timestamp;

        assert.isTrue(timeDiff >= advancement);
    });
});