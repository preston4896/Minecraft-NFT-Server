// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
// import "../lib/ERC 1155/ERC1155.sol";
// import "../erc-1155/contracts/ERC1155.sol";

contract Tokens is ERC1155 {
    // Token ids
    uint256 public constant EMERALDS = 0;  // Emeralds is the fungible tokens to be used

    constructor() public ERC1155("https://game.example/api/item/{id}.json") {
        _mint(msg.sender, EMERALDS, 10**13, ""); // Value includes 8 decimals, thus total supply is currently 10^5
    }
}