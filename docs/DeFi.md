# Overview
Contract allowing lending of Fungible token in exchange for an NFT. Basically a loan against a crypto asset.

# Variables

| Name           | Type                      | Description                           |
| -------------- | ------------------------- | ------------------------------------- |
| trade_ids      | uint256                   | Count of trade ids in the project     |
| tokensContract | Tokens                    | An instance of the Token.sol contract |
| trades         | mapping(uint256 => Trade) | Mapping of trade id to trade          |

# Structs

## Trade

### Overview
A structure that encompasses a DeFi NFT trade.

### Fields
| Name             | Type    | Description                               |
| ---------------- | ------- | ----------------------------------------- |
| nft_id           | uint256 | The id of the NFT to borrow against       |
| lender           | address | The wallet address of the lender          |
| borrower         | address | The wallet address of the borrower        |
| borrowing_amount | uint256 | The amount the borrower wishes to borrow  |
| apy              | uint256 | The rate the borrower wishes to borrow at |
| start_time       | uint256 | The starting timestamp of the trade       |
| paid_back_amount | uint256 | The amount paid back by the borrower      |
| state            | State   | The state of the trade                    |

# Enums

## State

### Overview
An enumeration describing the state of a particular trade

### Constants
| Name       | Description         |
| ---------- | ------------------- |
| OPEN       | Trade is open       |
| FINANCED   | Trade is financed   |
| LIQUIDATED | Trade is liquidated |
| CLOSED     | Trade is closed     |

# Events

## OpenedTrade

### Overview
Emitted when a trade is opened by a borrower.

### Parameters
| Name     | Type     | Description                    |
| -------- | -------- | ------------------------------ |
| trade_id | uint256  | Trade id of the opened trade   |

## TradeFinanced

### Overview
Emitted when a lender has lended money and the trade is put into operation.

### Parameters
| Name     | Type     | Description                    |
| -------- | -------- | ------------------------------ |
| trade_id | uint256  | Trade id of the financed trade |

## ClosedTrade

### Overview
Emitted when a trade is closed.

### Parameters
| Name     | Type     | Description                    |
| -------- | -------- | ------------------------------ |
| trade_id | uint256  | Trade id of the closed trade   |

## PaidInterest

### Overview
Emitted when a borrower pays interest on a particular trade.

### Parameters
| Name     | Type     | Description                                         |
| -------- | -------- | --------------------------------------------------- |
| trade_id | uint256  | Trade id of the trade on which the interest is paid |
| amount   | uint256  | Amount of interest paid                             |

## LiquidatedTrade

### Overview
Emitted when a trade is liquidated by a lender.

### Parameters
| Name     | Type     | Description                        |
| -------- | -------- | ---------------------------------- |
| trade_id | uint256  | Trade id of the liquidated trade   |

# Functions

## Constructor

### Overview
Instantiates the token contract with the passed in address.

### Parameters
| Name     | Type     | Description                     |
| -------- | -------- | ------------------------------- |
| _address | address  | Address of the token contract   |

## openTrade

### Overview
Allows a borrower to open (post) a trade to be seen by potential lenders. Returns the trade id.

### Parameters
| Name             | Type    | Description                               |
| ---------------- | ------- | ----------------------------------------- |
| nft_id           | uint256 | The id of the NFT to borrow against       |
| borrower         | address | The wallet address of the borrower        |
| borrowing_amount | uint256 | The amount the borrower wishes to borrow  |
| apy              | uint256 | The rate the borrower wishes to borrow at |

## lendToTrade

### Overview
Allows a lender to lend to an open trade.

### Parameters
| Name     | Type     | Description                  |
| -------- | -------- | ---------------------------- |
| trade_id | uint256  | Trade id of the open trade   |

## payInterest

### Overview
Allows a borrower to pay interest on his/her financed trade.

### Parameters
| Name     | Type     | Description                                               |
| -------- | -------- | --------------------------------------------------------- |
| trade_id | uint256  | Trade id of the trade on which the interest is to be paid |
| amount   | uint256  | Amount of interest to be paid                             |

## completeTrade

### Overview
Allows a trade to be completed. Typically called by the payInterest function when sufficient money has been paid back to the borrower.

### Parameters
| Name     | Type     | Description                            |
| -------- | -------- | -------------------------------------- |
| trade_id | uint256  | Trade id of the trade to be completed  |

## liquidateTrade

### Overview
Allows the lender to liquidate a trade on non-payment of sufficient interest by the borrower.

### Parameters
| Name     | Type     | Description                              |
| -------- | -------- | ---------------------------------------- |
| trade_id | uint256  | Trade id of the trade to be liquidated   |
