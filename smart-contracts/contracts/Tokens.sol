// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
// import "../lib/ERC 1155/ERC1155.sol";
// import "../erc-1155/contracts/ERC1155.sol";

contract Tokens is ERC1155 {
    // Token ids
    uint256 public constant EMERALDS = 0;  // Emeralds is the fungible tokens to be used
    uint256 public constant SWORD = 1; // Sword is an NFT
    uint256 public constant LUCKY_POTION = 2; // Lucky Potion is an NFT

    constructor() public ERC1155("http://localhost:8000/item/{id}/") {
        _mint(msg.sender, EMERALDS, 10**13, ""); // Value includes 8 decimals, thus total supply is currently 10^5
        _mint(msg.sender, SWORD, 5, ""); // NFT token that has only 5 copies
        _mint(msg.sender, LUCKY_POTION, 2, ""); // NFT token that has only 2 copies
    }
}