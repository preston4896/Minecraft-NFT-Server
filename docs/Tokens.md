# Overview
Contract comprising the tokens of the project. Mints the fungible and governance tokens as well as allowing the minting of NFT tokens by the Staking contract.

# Variables

| Name                      | Type        | Description                                                |
| ------------------------- | ----------- | ---------------------------------------------------------- |
| token_ids                 | uint256     | Count of token ids in the project                          |
| EMERALDS                  | uint256     | Token id of the fungible token of the project              |
| GOVERNANCE                | uint256     | Token id of the governance token of the project            |
| EMERALDS_total_supply     | uint256     | Total supply of the fungible token of the project          |
| GOVERNANCE_total_supply   | uint256     | Total supply of the governance token of the project        |

# Functions

## Constructor

### Overview
Mints the fungible (token id 0) and governance token (token id 1) of the project and initializes the token_ids variable to 2 to allow the NFTs of the project to have ids >= 2. It also initializes the NFT information API by passing in the appropriate URI.

### Parameters
N/A

## mint

### Overview
Wrapper around the ERC 1155 minting function. Mints an NFT token and assigns an ID to it

### Parameters
| Name         | Type    | Description                                |
| ------------ | ------- | ------------------------------------------ |
| total_supply | uint256 | Total supply of the nft token to be minted |

