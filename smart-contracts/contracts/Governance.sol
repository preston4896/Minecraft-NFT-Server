// Contract for voting for the governance proposals of this project

pragma solidity ^0.6.0;

import "./Tokens.sol";

contract Governance {
  Tokens public tokensContract;
  uint256 proposal_ids;

  struct Proposal {
    mapping(address => uint256) => votes_against; // Mapping user address to votes against
    mapping(address => uint256) votes_for; // Mapping user address to votes for
    bytes32[140] description; // An optional description for the proposal

    uint256 start_date; // Start date of the proposal
    uint256 end_date; // End date of the proposal
  }

  // Mapping proposal ids to Proposal
  mapping(uint256 => Proposal) proposals;

  // A proposal was created by a user owning > 100 governance tokens
  event ProposalCreated(uint256 proposal_id);
  // A user has voted on a proposal
  event Vote(uint256 proposal_id, address voter);

  constructor Governance(address _address) public {
    tokensContract = Tokens(_address);
    proposal_ids = 0;
  }

  // Babylonian method of square root computation
  // https://ethereum.stackexchange.com/questions/2910/can-i-square-root-in-solidity
  function sqrt(uint256 x) returns (uint256 y) {
    uint256 z = (x + 1) / 2;
    y = x;
    while (z < y) {
      y = z;
      z = (x / z + z) / 2;
    }
  }

  function createProposal(uint256 end_date, bytes32[] description) public returns(uint256) {
    // Find out a way to require that the proposal creator has the most amount of tokens
    // Currently requires that the user has a governance token balance >= 100
    require(tokensContract.balanceOf(msg.sender, 3) < 100, "Insufficient Governance tokens");

    // Get the proposal id
    uint256 proposal_id = proposal_ids;

    // Create a new proposal
    proposals[proposal_id] = Proposal({
      start_date: now,
      end_date: end_date,
      description: description
    });

    // Increment proposal ids count
    proposal_ids++;

    // Emit Proposal Creation event
    emit ProposalCreated(proposal_id);
    return proposal_id;
  }

  function voteAgainstProposal(uint256 proposal_id) public returns (bool) {
    // Require the proposal is still open for voting
    require(proposals[proposal_id].end_time > now);
    // Voter governance token balance should be greater than or equal to 1
    require(tokensContract.balanceOf(msg.sender, 3) >= 1, "Voter balance too low");
    // Voter cannot revote if he has voted for "for proposal"
    require(proposals[proposal_id].votes_for[msg.sender] == uint256(0))
    // Voter cannot revote if he has voter for "against proposal"
    require(proposals[proposal_id].votes_against[msg.sender] == uint256(0))

    // Assign votes to the proposal
    proposals[proposal_id].votes_against[msg.sender] = sqrt(tokensContract.balanceOf(msg.sender, 3));

    // Emit the voting event
    emit Vote(proposal_id, msg.sender);
    return true;
  }

  function voteForProposal(uint256 proposal_id) public returns (bool) {
    // Require the proposal is still open for voting
    require(proposals[proposal_id].end_time > now);
    // Voter governance token balance should be greater than or equal to 1
    require(tokensContract.balanceOf(msg.sender, 3) >= 1, "Voter balance too low");
    // Voter cannot revote if he has voted for "for proposal"
    require(proposals[proposal_id].votes_for[msg.sender] == uint256(0))
    // Voter cannot revote if he has voter for "against proposal"
    require(proposals[proposal_id].votes_against[msg.sender] == uint256(0))

    // Assign votes to the proposal
    proposals[proposal_id].votes_for[msg.sender] = sqrt(tokensContract.balanceOf(msg.sender, 3));

    // Emit the voting event
    emit Vote(proposal_id, msg.sender);
    return true;
  }

}