// Contract allowing Lending of Fungible token in exchange for an NFT

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155Holder.sol";
import "./Tokens.sol";

contract DeFi is ERC1155Holder {
  uint256 trade_ids;
  Tokens public tokensContract;

  // Trade data struct 
  struct Trade {
    uint256 nft_id; // NFT id
    address lender; // The lender of the NFT
    address borrower; // The borrower of the NFT
    uint256 borrowing_amount; // The amount needed to be borrowed
    uint256 apy; // The rate of interest of lending of the NFT
    uint256 start_time;
    uint256 paid_back_amount; // The amount paid back to the escrow
    State state;
  }

  enum State {
    OPEN,
    FINANCED,
    LIQUIDATED,
    CLOSED
  }
  
  // List of trades
  mapping(uint256 => Trade) public trades;

  // A trade was opened by a borrower
  event OpenedTrade(uint256 trade_id);
  // A lender has lended money and the trade is now in operation
  event TradeFinanced(uint256 trade_id);
  // A trade was closed
  event ClosedTrade(uint256 trade_id);
  // Interest paid
  event PaidInterest(uint256 trade_id, uint256 amount);
  // Trade Liquidated
  event LiquidatedTrade(uint256 trade_id);

  constructor(address _address) public {
    tokensContract = Tokens(_address);
    trade_ids = 0;
  }

  function openTrade(uint256 nft_id, address borrower, uint256 borrowing_amount, uint256 apy) public returns (uint256) {
    // verify borrower.
    require(msg.sender == borrower, "Unauthorized Function Call.");
    // Check if the borrower has atleast one of NFT
    require(tokensContract.balanceOf(borrower, nft_id) >= 1, "Insufficient NFT balance");
    
    // Create a trade with the current avaiable trade id
    uint256 trade_id = trade_ids;
    trades[trade_id] = Trade(nft_id, address(0x0), borrower, borrowing_amount, apy, 0, 0, State.OPEN);
    trade_ids++; // Increase the trade id by 1 for the next trade

    // Give the contract permission to transfer the borrowers NFT tokens
    // NOTE: Code for this is temporary and for testing-only
    // tokensContract.setApprovalForAll(address(this), true);

    // Transfer the NFT from the borrower to this contract
    tokensContract.safeTransferFrom(msg.sender, address(this), nft_id, 1, "0x0");
    onERC1155Received(msg.sender, borrower, nft_id, 1, "0x0");

    // Emit that a trade has been opened
    emit OpenedTrade(trade_id); 
    return trade_id;
  }

  function lendToTrade(uint256 trade_id) public returns (bool) {
    // Check if the trade is still open
    require(trades[trade_id].state == State.OPEN, "Trade not open.");
    // // Check if the borrower still has the NFT
    // require(tokensContract.balanceOf(trades[trade_id].borrower, trades[trade_id].nft_id) >= 1, "Borrower does not have collatoral.");
    // Check if the lender has that much Fungible tokens
    require(tokensContract.balanceOf(msg.sender, 0) >= trades[trade_id].borrowing_amount, "Lender does not have sufficient fundings.");

    // Assign the lender, set the state of the trade to FINANCED and start the time
    trades[trade_id].lender = msg.sender;
    trades[trade_id].state = State.FINANCED;
    trades[trade_id].start_time = now;

    // // Give the contract permission to transfer the lenders fungible tokens
    // // NOTE: Code for this is temporary and for testing-only
    // tokensContract.setApprovalForAll(address(this), true);

    // Transfer the Fungible tokens from the lender to this contract
    tokensContract.safeTransferFrom(msg.sender, address(this), 0, trades[trade_id].borrowing_amount, "0x0");

    // Emit that the trade has been financed
    emit TradeFinanced(trade_id);
    return true;
  }

  function payInterest(uint256 trade_id, uint256 amount) public returns (bool) {
    // Make sure the state of the trade is FINANCED
    require(trades[trade_id].state == State.FINANCED, "Caller is not currently on a FINANCED state.");
    // Make sure the caller is the trade's borrower
    require(msg.sender == trades[trade_id].borrower, "Caller is not the borrower.");
    // Make sure the borrower has enough funds
    require(tokensContract.balanceOf(msg.sender, 0) >= amount, "Caller has insufficient balance.");

    // Add the interest to the total amount paid back
    trades[trade_id].paid_back_amount += amount;

    tokensContract.safeTransferFrom(msg.sender, address(this), 0, amount, "0x0");
    emit PaidInterest(trade_id, amount);

    // Only if the amount paid back is more than the principal could the transaction be complete
    // Thus we check only if that is the case
    if (trades[trade_id].paid_back_amount >= trades[trade_id].borrowing_amount) {
      uint256 seconds_since_start = now - trades[trade_id].start_time;
      // Formula for Continous compound interest
      // https://www.investopedia.com/terms/c/continuouscompounding.asp#:~:text=Calculating%20the%20limit%20of%20this,mathematical%20constant%20approximated%20as%202.7183.
      uint256 amount_to_be_paid = trades[trade_id].borrowing_amount * (uint256(3) ** ((seconds_since_start/31556952) 
        * trades[trade_id].apy));
      

      if (trades[trade_id].paid_back_amount >= amount_to_be_paid) {
        completeTrade(trade_id);
      }
    }

    return true;
  }

  function completeTrade(uint256 trade_id) private returns (bool) {
    // Makes sure the contract still has the NFT and the money - Theoretically always true
    require(tokensContract.balanceOf(address(this), trades[trade_id].nft_id) >= 1, "Contract does not have sufficient NFT.");
    require(tokensContract.balanceOf(address(this), 0) >= trades[trade_id].paid_back_amount, "Contract does not have sufficient fungible tokens.");

    // Transfer the NFT and fungible tokens from the contract to the borrower and lender respectively
    tokensContract.safeTransferFrom(address(this), trades[trade_id].borrower, trades[trade_id].nft_id, 1, "0x0");  
    tokensContract.safeTransferFrom(address(this), trades[trade_id].lender, 0, trades[trade_id].paid_back_amount, "0x0");  

    // Set trade to close state
    trades[trade_id].state = State.CLOSED;

    // Emit the close trade event
    emit ClosedTrade(trade_id);
    return true;
  }

  function liquidateTrade(uint256 trade_id) public returns (bool) {
    require(msg.sender == trades[trade_id].lender);

    // Amount to be paid by the borrower to the lender
    uint256 seconds_since_start = now - trades[trade_id].start_time;
    uint256 amount_to_be_paid = (trades[trade_id].borrowing_amount * (uint256(3) ** ((seconds_since_start/31556952) 
      * trades[trade_id].apy)) - trades[trade_id].paid_back_amount);

    // Condition for liquidity is if the amount to be paid exceeds the amount + monthly interest, the trade can be liquidated

    bool can_be_liquidated = amount_to_be_paid > (trades[trade_id].borrowing_amount * trades[trade_id].apy/12) + trades[trade_id].borrowing_amount  ;

    if (can_be_liquidated) {
      // Makes sure the contract still has the NFT and the money - Theoretically always true
      require(tokensContract.balanceOf(address(this), trades[trade_id].nft_id) >= 1);
      require(tokensContract.balanceOf(address(this), 0) >= trades[trade_id].paid_back_amount);

      // Transfer the tokens to the lender
      tokensContract.safeTransferFrom(address(this), trades[trade_id].lender, trades[trade_id].nft_id, 1, "0x0");  
      tokensContract.safeTransferFrom(address(this), trades[trade_id].lender, 0, trades[trade_id].paid_back_amount, "0x0");  

      // Set trade to close state
      trades[trade_id].state = State.LIQUIDATED;

      // Emit the liquidate trade event
      emit LiquidatedTrade(trade_id);
    } else {
      return false;
    }
  } 
}