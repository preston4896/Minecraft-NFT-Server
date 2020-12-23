// Contract for voting for the governance proposals of this project

pragma solidity ^0.6.0;

import "./Tokens.sol";

contract Governance {
  Tokens public tokensContract;
  uint256 proposal_ids;

  struct Proposal {
    uint256 votes_against; // Keep track of votes against
    uint256 votes_for; // Keep track of votes for
    bytes32 description; // An optional description for the proposal (Note: Not using array for now as a temporary fix)
    uint256 start_date; // Start date of the proposal
    uint256 end_date; // End date of the proposal
  }

  // Mapping proposal ids to Proposal
  mapping(uint256 => Proposal) public proposals;

  // Keep track of addresses to their proposal ids to verify votes.
  mapping(address => mapping(uint256 => bool)) private proposal_voted;

  // A proposal was created by a user owning > 100 governance tokens
  event ProposalCreated(uint256 proposal_id);
  // A user has voted on a proposal
  event Vote(uint256 proposal_id, address voter);

  constructor(address _address) public {
    tokensContract = Tokens(_address);
    proposal_ids = 0;
  }

  // Babylonian method of square root computation
  // https://ethereum.stackexchange.com/questions/2910/can-i-square-root-in-solidity
  function sqrt(uint256 x) public pure returns (uint256 y) {
    uint256 z = (x + 1) / 2;
    y = x;
    while (z < y) {
      y = z;
      z = (x / z + z) / 2;
    }
  }

  function createProposal(uint256 end_date, bytes32 description) public returns(uint256) {
    // Find out a way to require that the proposal creator has the most amount of tokens
    // Currently requires that the user has a governance token balance >= 100
    require(tokensContract.balanceOf(msg.sender, 3) >= 100, "Insufficient Governance tokens");

    // Get the proposal id
    uint256 proposal_id = proposal_ids;

    // Create a new proposal
    Proposal memory newProposal = Proposal(0, 0, description, now, end_date);

    proposals[proposal_id] = newProposal;

    // Increment proposal ids count
    proposal_ids++;

    // Emit Proposal Creation event
    emit ProposalCreated(proposal_id);
    return proposal_id;
  }

  function voteAgainstProposal(uint256 proposal_id) public returns (bool) {
    // Require the proposal is still open for voting
    require(proposals[proposal_id].end_date > now, "Too late to vote.");
    // Voter governance token balance should be greater than or equal to 1
    require(tokensContract.balanceOf(msg.sender, 3) >= 1, "Voter balance too low");
    // Voters cannot vote twice.
    require(!proposal_voted[msg.sender][proposal_id], "Voter can not vote twice.");

    // Assign votes to the proposal
    Proposal storage proposal = proposals[proposal_id];
    proposal.votes_against = sqrt(tokensContract.balanceOf(msg.sender, 3));

    // voted.
    proposal_voted[msg.sender][proposal_id] = true;

    // Emit the voting event
    emit Vote(proposal_id, msg.sender);
    return true;
  }

  function voteForProposal(uint256 proposal_id) public returns (bool) {
    // Require the proposal is still open for voting
    require(proposals[proposal_id].end_date > now, "Too late to vote.");
    // Voter governance token balance should be greater than or equal to 1
    require(tokensContract.balanceOf(msg.sender, 3) >= 1, "Voter balance too low");
    // Voters cannot vote twice.
    require(!proposal_voted[msg.sender][proposal_id], "Voter can not vote twice.");

    // Assign votes to the proposal
    Proposal storage proposal = proposals[proposal_id];
    proposal.votes_for = sqrt(tokensContract.balanceOf(msg.sender, 3));
    
    // voted.
    proposal_voted[msg.sender][proposal_id] = true;

    // Emit the voting event
    emit Vote(proposal_id, msg.sender);
    return true;
  }

  // work around to get a mapping value stored in the parent mapping
  function verify_votes(address addr, uint256 id) external view returns(bool) {
    return proposal_voted[addr][id];
  }
}