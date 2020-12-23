// Contract for staking fungible tokens to earn points and redeem NFTs

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155Holder.sol";
import "./Tokens.sol";

contract Staking is ERC1155Holder{
  Tokens public tokensContract;
  
  mapping (address => uint256) public points;
  mapping (address => uint256) public stakers;
  mapping (address => uint256) public lastUpdateTime;
  mapping (uint256 => uint256) public nft_cost;

  // A user has staked his/her tokens
  event Staked(address user, uint256 amount);
  // A user has unstaked his/her tokens
  event Withdrawn(address user, uint256 amount);
  // An NFT token was withdrawn by the user
  event Redeemed(address indexed user, uint256 amount);
  // An NFT token was added to the project
  event NFTAdded(uint256 nft_id, uint256 points);

  // Updates the count of points rewarded
  modifier updateReward(address account) {
		if (account != address(0)) {
			points[account] = earned(account);
			lastUpdateTime[account] = block.timestamp;
		}
    _;
	}

  // Checks if the function caller is the owner of the contract
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }


  // Adds an NFT to the project and returns the generated nft id
  function addNFT(uint256 amount, uint256 cost) public onlyOwner returns (uint256) {
    uint256 nft_id = tokensContract.mint(amount);
    nft_cost[nft_id] = cost;
		emit NFTAdded(nft_id, amount);
    return nft_id;
	}

  // Returns the points earned by a user
	function earned(address account) public view returns (uint256) {
		uint256 blockTime = block.timestamp;
		return
			points[account] + (
				blockTime - (lastUpdateTime[account]) * (1e18) / (86400) * (
					(balanceOf(account) * (25000)) / (1e18)
				)
			);
	}

  // Stakes some fungible tokens
	function stake(uint256 amount) public updateReward(msg.sender) {
		require(tokensContract.balanceOf(msg.sender, 0) >= 0, "Need some fungible tokens to stake");

    // Transfer the fungible tokens from the user to the contract
    tokensContract.safeTransferFrom(msg.sender, address(this), 0, amount, "0x0");
    // Make sure the amount is removed from the staking
    stakers[msg.sender] += amount;

		emit Staked(msg.sender, amount);
	}

  // Withdraws staked fungible tokens
	function withdraw(uint256 amount) public updateReward(msg.sender) {
		require(amount > 0, "Cannot withdraw 0");
    require(amount <= stakers[msg.sender], "Amount staked isn't enough");

    // Transfer the fungible tokens from the contract to the user
    tokensContract.safeTransferFrom(address(this), msg.sender, 0, amount, "0x0");
    // Make sure the amount is removed from the staking
    stakers[msg.sender] -= amount;

		emit Withdrawn(msg.sender, amount);
	}

  // Withdraws all the staked fungible tokens of a user
	function exit() external {
		withdraw(stakers[msg.sender]);
	}

  // Redeems an NFT with the acrued points
	function redeem(uint256 nft_id) public updateReward(msg.sender) {
		require(nft_id < tokensContract.nft_ids, "The id is a valid nft id");
    require(nft_id != 0, "The id is the fungible token id");
    require(nft_id != 1, "The id isn't the governance token id");
		require(points[msg.sender] >= nft_cost[nft_id], "Not enough points to redeem NFT");
		require(tokensContract.balanceOf(owner, nft_id) > 0, "Max cards minted");

    // Remove the points and transfer the token from the 
    // owner of the contract (since he/she will have the token) to the redeemer
		points[msg.sender] -= nft_cost[nft_id];
    tokensContract.safeTransferFrom(address(this), msg.sender, nft_id, 1, "0x0");

		emit Redeemed(msg.sender, cards[card]);
	}
}



  
