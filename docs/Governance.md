# Overview
Contract comprising the governance protocol of the project, allowing owners of the governance tokens to vote and add proposals (if they have enough gov tokens)

# Variables

| Name           | Type                                         | Description                               |
| -------------- | -------------------------------------------- | ----------------------------------------- |
| proposal_ids   | uint256                                      | Count of proposal ids in the project      |
| tokensContract | Tokens                                       | An instance of the Token.sol contract     |
| proposals      | mapping(uint256 => Proposal)                 | Mapping of trade id to proposal           |
| proposal_voted | mapping(address => mapping(uint256 => bool)) | Keep track of user voting on proposal ids |

# Structs

## Proposal

### Overview
A structure that encompasses a project Proposal

### Fields
| Name          | Type    | Description                                                        |
| ------------- | ------- | ------------------------------------------------------------------ |
| votes_for     | uint256 | The count of votes for the proposal                                |
| votes_against | uint256 | The count of votes against the proposal                            |
| start_date    | uint256 | The starting timestamp of voting                                   |
| end_date      | uint256 | The ending timestamp of voting                                     |
| description   | bytes32 | A small description of the proposal to be stored on the blockchain |


# Events

## ProposalCreated

### Overview
Emitted when a proposal is created in the project.

### Parameters
| Name        | Type    | Description                           |
| ----------- | ------- | ------------------------------------- |
| proposal_id | uint256 | Proposal id of the created proposal   |

## Vote

### Overview
Emitted when a lender has lended money and the trade is put into operation.

### Parameters
| Name        | Type    | Description                                              |
| ----------- | ------- | -------------------------------------------------------- |
| proposal_id | uint256 | Proposal id of the proposal on which the voter has voted |
| voter       | address | Wallet address of the voter                              |

# Functions

## Constructor

### Overview
Instantiates the token contract with the passed in address.

### Parameters
| Name     | Type     | Description                     |
| -------- | -------- | ------------------------------- |
| _address | address  | Address of the token contract   |

## sqrt

### Overview
Returns the square root of a number by the babylonian method

### Parameters
| Name | Type     | Description                 |
| ---- | -------- | --------------------------- |
| x    | uint256  | Number to be square rooted  |


## createProposal

### Overview
Allows a user to create a proposal if he/she has greater than or equal to 100 governance tokens

### Parameters
| Name          | Type    | Description                          |
| ------------- | ------- | ------------------------------------ |
| end_date      | uint256 | The date on which voting should stop |
| description   | bytes32 | A small description of the proposal  |

## voteAgainstProposal

### Overview
Adds a vote against the proposal

### Parameters
| Name        | Type    | Description        |
| ----------- | ------- | ------------------ |
| proposal_id | uint256 | ID of the proposal |


## voteForProposal

### Overview
Adds a vote for the proposal

### Parameters
| Name        | Type    | Description        |
| ----------- | ------- | ------------------ |
| proposal_id | uint256 | ID of the proposal |

## verify_votes

### Overview
Verify the vote of a user for a particular proposal

### Parameters
| Name | Type    | Description                                              |
| ---- | ------- | -------------------------------------------------------- |
| id   | uint256 | Proposal id of the proposal on which the voter has voted |
| addr | address | Wallet address of the voter                              |