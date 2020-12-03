// Contract allowing Lending of Fungible token in exchange for an NFT

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155Holder.sol";

contract DeFi is ERC1155Reciever{
  uint256 trade_ids;

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

  constructor() public {
    trade_ids = 0;
  }

  function openTrade(uint256 nft_id, address borrower, uint256 borrowing_amount, uint256 apy) public returns (uint256) {
    // Check if the borrower has atleast one of NFT
    require(balanceOf(borrower, uid) >= 1);
    
    // Create a trade with the current avaiable trade id
    uint256 trade_id = trade_ids;
    trades[trade_id] = Trade(nft_id, 0x0, borrower, borrowing_amount, apy, 0, 0, State.OPEN);
    trade_ids++; // Increase the trade id by 1 for the next trade

    // Emit that a trade has been opened
    emit OpenedTrade(trade_id); 
    return trade_id;
  }

  function lendToTrade(uint256 trade_id) public returns bool {
    // Check if the trade is still open
    require(trades[trade_id].state == State.OPEN);
    // Check if the borrower still has the NFT
    require(balanceOf(trades[trade_id].borrower, trades[trade_id].nft_id) >= 1);
    // Check if the lender has that much Fungible tokens
    require(balanceOf(msg.sender, 0) >= trades[trade_id].borrowing_amount);

    // Assign the lender, set the state of the trade to FINANCED and start the time
    trades[trade_id].lender = msg.sender;
    trades[trade_id].state = State.FINANCED;
    trades[trade_id].start_time = now;

    // Transfer the NFT from the borrower to this contract
    safeTransfer(trades[trade_id].borrower, address(this), trades[trade_id].nft_id, 1, "0x0");
    // Transfer the Fungible tokens from the lender to this contract
    safeTransfer(trades[trade_id].lender, address(this), 0, trades[trade_id].amount, "0x0");

    // Emit that the trade has been financed
    emit TradeFinanced(trade_id);
    return true;
  }

  function payInterest(uint256 trade_id, uint256 amount) public returns bool {
    // Make sure the state of the trade is FINANCED
    require(trades[trade_id].state == State.FINANCED);
    // Make sure the caller is the trade's borrower
    require(msg.sender == trades[trade_id].borrower);
    // Make sure the borrower has enough funds
    require(balanceOf(msg.sender, 0) >= amount);

    trades[trade_id].amount_paid_back += amount
    safeTransfer(msg.sender, address(this), 0, amount, "0x0");
    emit InterestPaid(trade_id, amount);

    // Only if the amount paid back is more than the principal could the transaction be complete
    // Thus we check only if that is the case
    if (trades[trade_id].amount_paid_back >= trades[trade_id].amount_borrowed) {
      uint256 seconds_since_start = now - trades[trade_id].start_time;
      // Formula for Continous compound interest
      // https://www.investopedia.com/terms/c/continuouscompounding.asp#:~:text=Calculating%20the%20limit%20of%20this,mathematical%20constant%20approximated%20as%202.7183.
      uint256 amount_to_be_paid = trades[trade_id].amount_borrowed * (2.7183 ** ((seconds_since_start/31556952) 
        * trades[trade_id].apy));
      

      if (trades[trade_id].amount_paid_back >= amount_to_be_paid) {
        completeTrade(trade_id);
      }
    }

    return true;
  }

  function completeTrade(uint256 trade_id) private returns bool {
    // Makes sure the contract still has the NFT and the money - Theoretically always true
    require(balanceOf(address(this), trades[trade_id].nft_id) >= 1);
    require(balanceOf(address(this), 0) >= trades[trade_id].amount_paid_back);

    // Transfer the NFT and fungible tokens from the contract to the borrower and lender respectively
    safeTransfer(address(this), trades[trade_id].borrower, trades[trade_id].nft_id, 1, "0x0");  
    safeTransfer(address(this), trades[trade_id].lender, 0, amount, "0x0");  

    // Set trade to close state
    trades[trade_id].state = State.CLOSED;

    // Emit the close trade event
    emit ClosedTrade(trade_id);
    return true;
  }

  function liquidateTrade(uint256 trade_id) public returns bool {
    require(msg.sender == trades[trade_id].lender)

    // Amount to be paid by the borrower to the lender
    uint256 amount_to_be_paid = trades[trade_id].amount_borrowed * (2.7183 ** ((seconds_since_start/31556952) 
      * trades[trade_id].apy));

    // Condition for liquidity still not determined. For the purpose of initial testing, trade can be liquidated any time.
    // Later on we need to make so after x amount of interest is acrued, then the contract can be liquidated

    bool can_be_liquidated = true

    if (can_be_liquidated) {
      // Makes sure the contract still has the NFT and the money - Theoretically always true
      require(balanceOf(address(this), trades[trade_id].nft_id) >= 1);
      require(balanceOf(address(this), 0) >= trades[trade_id].amount_paid_back);

      safeTransfer(address(this), trades[trade_id].lender, trades[trade_id].nft_id, 1, "0x0");  
      safeTransfer(address(this), trades[trade_id].lender, 0, trades[trade_id].amount_paid_back, "0x0");  

      emit LiquidatedTrade(trade_id);
    } else {
      return false;
    }
  } 
}