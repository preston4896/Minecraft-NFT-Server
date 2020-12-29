// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract Tokens is ERC1155 {
    // Token ids
    uint256 token_ids;

    // Constant Token ids
    // Emeralds is the fungible tokens to be used
    uint256 public constant EMERALDS = 0;  
     // Governance token of the project
    uint256 public constant GOVERNANCE = 1;

    // Total Supply
    uint256 public EMERALDS_total_supply = 10**13;
    uint256 public GOVERNANCE_total_supply = 10**5;

    constructor() public ERC1155("http://localhost:8000/item/{id}/") {
        // Minting Fungible token
        _mint(msg.sender, EMERALDS, EMERALDS_total_supply, ""); 
        // Minting Governance token
        _mint(msg.sender, GOVERNANCE, GOVERNANCE_total_supply, ""); 

        token_ids = 2;
    }

    // Wrapper around the ERC 1155 minting function. Mints an NFT token and assigns an ID to it
    function mint(uint256 total_supply) public returns (uint256) {
        // Get the current available id
        uint256 nft_id = token_ids; 
        // Minting the token
        _mint(msg.sender, nft_id, total_supply, ""); 

        token_ids++;
        return nft_id;
    }
}