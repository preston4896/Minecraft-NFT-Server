// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract Tokens is ERC1155 {
    // Token ids
    uint256 public constant EMERALDS = 0;  // Emeralds is the fungible tokens to be used
    uint256 public constant SWORD = 1; // Sword is an NFT
    uint256 public constant LUCKY_POTION = 2; // Lucky Potion is an NFT

    // Total Supply
    uint256 public EMERALDS_total_supply = 10**13;
    uint256 public SWORD_total_supply = 5;
    uint256 public LUCKY_POTION_total_supply = 2;

    constructor() public ERC1155("http://localhost:8000/item/{id}/") {
        _mint(msg.sender, EMERALDS, EMERALDS_total_supply, ""); // Value includes 8 decimals, thus total supply is currently 10^5
        _mint(msg.sender, SWORD, SWORD_total_supply, ""); // NFT token that has only 5 copies
        _mint(msg.sender, LUCKY_POTION, LUCKY_POTION_total_supply, ""); // NFT token that has only 2 copies
    }
}