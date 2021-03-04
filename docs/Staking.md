# Overview
Contract comprising the staking mechanism for the fungible token as well as minting NFTs and redeeming points acrued from staking.

# Variables

| Name           | Type                         | Description                                |
| -------------- | ---------------------------- | ------------------------------------------ |
| points         | mapping (address => uint256) | Points acrued by a user                    |
| stakers        | mapping (address => uint256) | Tokens staked by a user                    |
| lastUpdateTime | mapping (address => uint256) | Last timestamp of updated tokens of a user |
| nft_cost       | mapping (uint256 => uint256) | Cost of a NFT type in points               |

# Events

## Staked

### Overview
Emitted when a user has staked his/her tokens.

### Parameters
| Name   | Type    | Description                |
| ------ | ------- | -------------------------- |
| user   | address | Wallet address of the user |
| amount | uint256 | Amount staked              |

## Withdrawn

### Overview
Emitted when an user has unstaked his/her tokens.

### Parameters
| Name   | Type    | Description                |
| ------ | ------- | -------------------------- |
| user   | address | Wallet address of the user |
| amount | uint256 | Amount withdrawn           |

## Redeemed

### Overview
Emitted when a NFT token is redeemed by the user.

### Parameters
| Name   | Type    | Description                |
| ------ | ------- | -------------------------- |
| user   | address | Wallet address of the user |
| nft_id | uint256 | Type of NFT Redeemed       |

## PaidInterest

### Overview
Emitted when a NFT token is added to the project.

### Parameters
| Name   | Type    | Description             |
| ------ | ------- | ----------------------- |
| nft_id | uint256 | Type of NFT Redeemed    |
| points | uint256 | Points cost of NFT type |


# Modifiers

## updateReward

### Overview
Updates the count of points rewarded to a user for staking.

### Parameters
| Name    | Type    | Description                           |
| ------- | ------- | ------------------------------------- |
| account | address | Account who's reward is to be updated |

## onlyOwner

### Overview
Checks if the function caller is the owner of the contract.

### Parameters
N/A


# Functions

## Constructor

### Overview
Instantiates the token contract with the passed in address.

### Parameters
| Name     | Type     | Description                     |
| -------- | -------- | ------------------------------- |
| _address | address  | Address of the token contract   |


## addNFT

### Overview
Adds an NFT to the project and returns the generated nft id.

### Parameters
| Name   | Type    | Description                                             |
| ------ | ------- | ------------------------------------------------------- |
| amount | uint256 | The total amount of NFT tokens of that type to be added |
| cost   | uint256 | The point cost of that type of NFT                      |


## earned

### Overview
Returns the points rewarded to an account.

### Parameters
| Name    | Type    | Description                            |
| ------- | ------- | -------------------------------------- |
| account | address | Account who's reward is to be returned |


## stake

### Overview
Stakes the specified amount of fungible tokens from the user's wallet.

### Parameters
| Name   | Type    | Description             |
| ------ | ------- | ----------------------- |
| amount | uint256 | Amount of tokens staked |


## withdraw

### Overview
Withdraws the specified amount of staked tokens by a user from the platform to the user's wallet.

### Parameters
| Name   | Type    | Description               |
| ------ | ------- | ------------------------- |
| amount | uint256 | Amount of tokens unstaked |


## exit

### Overview
Withdraws all the tokens staked by a user from the platform to the user's wallet.

### Parameters
N/A

## redeem

### Overview
Redeems a specified NFT type with the acrued points.

### Parameters
| Name   | Type    | Description                |
| ------ | ------- | -------------------------- |
| nft_id | uint256 | Type of NFT to be redeemed |