// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./libraries/HellishTransfers.sol";
import "./AuctionHouseIndexer.sol";
import "./libraries/HellishBlocks.sol";

contract AuctionHouse is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    using HellishTransfers for address;
    using HellishTransfers for address payable;
    using HellishBlocks for uint;

    struct Auction {
        // Auction Details
        uint id;
        // Token address being offered. If this value is set to the zero address 0x0000000000.... the network currency will be used.
        address auctionedTokenAddress;
        // Total amount of tokens offered for this Auction.
        uint auctionedAmount;
        // Address of the token used to place bids and buyouts. If this value is set to the zero address 0x0000000000.... the network currency will be used.
        address payingTokenAddress;
        // Starting price of the Auction, this is the minimum value that users can bid at the start of the auction.
        uint startingPrice;
        //  Buyout price of the Auction, users who bid this amount or more will have won, ending the auction immediately. If this value is set to zero, the Auction will only end by reaching the endsAtBlock.
        uint buyoutPrice;
        // Block on which the auction ends.
        uint endsAtBlock;
        // Block on which this Auction was created
        uint createdAt;
        // Address of the creator of the Auction.
        address createdBy;
        // Status variables
        // Address of the Highest bidder, It'll be the zero address if there aren't any bids set in place.
        address highestBidder;
        // Highest bid value
        uint highestBid;
        // Counter of all bids received.
        uint totalBids;
        // Indicates if the winner (Highest bidder until the auction ends) withdrawn his funds.
        bool rewardsWithdrawnByWinner;
        // Indicates if the Auction creator withdrawn his corresponding funds.
        bool fundsOrRewardsWithdrawnByCreator;
        // Added on responses only, displays how much the msg.sender bid.
        uint yourBid;
        // Treasury fees agreed upon in the creation of the auction.
        uint16 auctionHouseFee;
    }
    //////////////////////////////////////////////////////////////////////////
    // Total Amount of Auctions created
    uint public _totalAuctions;
    // ID => auction, IDs are assigned based on the total auctions + 1.
    mapping(uint => Auction) _auctions;
    // Stores all the bids made to any specific auction auction.id => user address => amount bid
    mapping(uint => mapping(address => uint)) public _auctionBids;
    ///////////////////////////////////////////////////////////////////////////////////////////
    uint16 public _auctionHouseFee;
    address payable private _hellTreasuryAddress;
    uint32 public _minimumAuctionLength;
    uint32 public _maximumAuctionLength;
    ///////////////////////////////////////////////////////////////////////////////////////////
    address private _indexerAddress;
    AuctionHouseIndexer private _indexer;
    ////////////////////////////////////////////////////////////////////
    // External functions                                           ////
    ////////////////////////////////////////////////////////////////////
    function createAuction(address auctionedTokenAddress, uint auctionedAmount, address payingTokenAddress, uint startingPrice, uint buyoutPrice, uint endsAtBlock) external payable nonReentrant {
        if (buyoutPrice > 0) {
            // "The buyout price must be higher or equal to the starting price"
           require(startingPrice <= buyoutPrice , "CA1");
        }
        // "The minimum Auction length should be of least _minimumAuctionLength blocks";
        require(block.number.lowerThan(endsAtBlock) && (endsAtBlock - block.number) >= _minimumAuctionLength, "CA2");
        // "The auction length should be equal or lower to the _maximumAuctionLength";
        require((endsAtBlock - block.number) <= _maximumAuctionLength, "CA5");
        // "The auctioned token address and the selling token address cannot be the same";
        require(auctionedTokenAddress != payingTokenAddress, "CA3");
        // "The Auctioned amount and the Starting price must be higher than 0"
        require(0 < auctionedAmount && 0 < startingPrice, "CA4");
        // Deposit user funds in the Auction House Contract
        address(this).safeDepositAsset(auctionedTokenAddress, auctionedAmount);

        _totalAuctions += 1;
        // Create and Store the Auction
        Auction memory auction;
        auction.id = _totalAuctions;
        auction.auctionedTokenAddress = auctionedTokenAddress;
        auction.auctionedAmount = auctionedAmount;
        auction.payingTokenAddress = payingTokenAddress;
        auction.startingPrice = startingPrice;
        auction.buyoutPrice = buyoutPrice;
        auction.createdBy = msg.sender;
        auction.endsAtBlock = endsAtBlock;
        auction.createdAt = block.number;
        auction.auctionHouseFee = _auctionHouseFee;
        _auctions[auction.id] = auction;

        // Register Auction Indexes
        _indexer._registerNewAuctionCreation(auction.id, auction.createdBy, auction.auctionedTokenAddress, auction.payingTokenAddress);

        // Emit information
        emit AuctionCreated(auction.createdBy, auction.auctionedTokenAddress, auction.payingTokenAddress, auction.id, auction.auctionedAmount, auction.startingPrice, auction.buyoutPrice, auction.endsAtBlock);
    }

    function increaseBid(uint auctionId, uint amount) external payable nonReentrant {
        Auction memory auction = _auctions[auctionId];
        // "Auction not found"
        require(auction.id != 0, "IB1");
        // "This Auction has already finished"
        require(auction.endsAtBlock.notElapsed(), "IB2");
        // "The amount cannot be empty";
        require(amount > 0, "IB3");
        // You cannot place bids on your own auction
        require(msg.sender != auction.createdBy, "IB4");
        uint userTotalBid = _auctionBids[auctionId][msg.sender] + amount;
        // "Your total bid amount cannot be lower than the highest bid"
        require(userTotalBid > auction.highestBid, "IB5");
        // "You cannot bid less than the starting price"
        require(auction.startingPrice <= userTotalBid, "IB6");
        // Deposit user funds in the Auction House Contract
        address(this).safeDepositAsset(auction.payingTokenAddress, amount);

        auction.totalBids += 1;
        auction.highestBid = userTotalBid;
        auction.highestBidder = msg.sender;
        _auctionBids[auctionId][msg.sender] = userTotalBid;

        // Mark the user as auction participant if it isn't already
        _indexer._registerUserParticipation(auctionId, msg.sender);

        if (0 < auction.buyoutPrice && (userTotalBid >= auction.buyoutPrice)) {
            auction.endsAtBlock = block.number; // END The auction right away
            emit Buyout(auctionId, msg.sender, amount, userTotalBid);
        } else {
            emit BidIncreased(auctionId, msg.sender, amount, userTotalBid);
        }
        _auctions[auctionId] = auction;
    }

    // While the auction is in progress, only bidders that lost against another higher bidder will be able to withdraw their funds
    function claimFunds(uint auctionId) public nonReentrant {
        if(msg.sender == _auctions[auctionId].highestBidder || msg.sender == _auctions[auctionId].createdBy) {
            // If the Auction ended the highest bidder and the creator of the Auction will be able to withdraw their funds
            if (_auctions[auctionId].endsAtBlock.elapsedOrEqualToCurrentBlock()) {
                // if the user is the winner of the auction
                if (msg.sender == _auctions[auctionId].highestBidder) {
                    // ACF1: "You already claimed this auction rewards"
                    require(_auctions[auctionId].rewardsWithdrawnByWinner == false, "ACF1");
                    // Set winner rewards as withdrawn
                    _auctions[auctionId].rewardsWithdrawnByWinner = true;
                    // Register Auction as Won
                    _indexer._registerAuctionWon(auctionId, msg.sender);
                    // Set user bids back to 0, these funds are going now to the creator of the Auction
                    _auctionBids[auctionId][msg.sender] = 0;
                    // Send the earned tokens to the winner and a pay the small fee agreed upon the auction creation.
                    (uint userReceives, uint feePaid) = payable(msg.sender).safeTransferAssetAndPayFee(_auctions[auctionId].auctionedTokenAddress, _auctions[auctionId].auctionedAmount, _hellTreasuryAddress, _auctions[auctionId].auctionHouseFee);
                    emit ClaimWonAuctionRewards(auctionId, msg.sender, _auctions[auctionId].auctionedTokenAddress, userReceives, feePaid);
                }
                // if the user is the creator of the auction
                if (msg.sender == _auctions[auctionId].createdBy) {
                    // ACF1: "You already claimed this auction rewards"
                    require(_auctions[auctionId].fundsOrRewardsWithdrawnByCreator == false, "ACF1");
                    // Set creator rewards as withdrawn
                    _auctions[auctionId].fundsOrRewardsWithdrawnByCreator = true;
                    // If there was a HighestBidder, send the Highest bid to the creator
                    if(_auctions[auctionId].highestBid > 0 && _auctions[auctionId].totalBids > 0) {
                        // Register auction as sold
                        _indexer._registerAuctionSold(auctionId, msg.sender);
                        (uint userReceives, uint feePaid) = payable(msg.sender).safeTransferAssetAndPayFee(_auctions[auctionId].payingTokenAddress, _auctions[auctionId].highestBid, _hellTreasuryAddress, _auctions[auctionId].auctionHouseFee);
                        emit ClaimSoldAuctionRewards(auctionId, msg.sender, _auctions[auctionId].payingTokenAddress, userReceives, feePaid);
                    } else {
                        // If the Auction didn't sell, pay fees and send funds back to his creator
                        (uint userReceives, uint feePaid) = payable(msg.sender).safeTransferAssetAndPayFee(_auctions[auctionId].auctionedTokenAddress, _auctions[auctionId].auctionedAmount, _hellTreasuryAddress, _auctions[auctionId].auctionHouseFee);
                        emit ClaimUnsoldAuctionFunds(auctionId, msg.sender, _auctions[auctionId].auctionedTokenAddress, userReceives, feePaid);
                    }
                }
            } else {
                // ACF2: This Auction is still in progress.
                revert("ACF2");
            }
        // If the user is not the Highest bidder or the creator of the Auction
        } else {
            // We get the User bids and then proceed to check if the user has bids available to claim
            uint userBids = _auctionBids[auctionId][msg.sender];
            // ACF3: "You have no leftover bids available to claim from this auction."
            require(userBids > 0, "ACF3");
            // if it does have funds, set them back to 0
            _auctionBids[auctionId][msg.sender] = 0;
            // Send the user his lost bids
            payable(msg.sender).safeTransferAsset(_auctions[auctionId].payingTokenAddress, userBids);
            emit ClaimLostBids(auctionId, msg.sender, _auctions[auctionId].payingTokenAddress, userBids);
        }
    }
    ////////////////////////////////////////////////////////////////////
    // Views                                                        ////
    ////////////////////////////////////////////////////////////////////
    function getAuctions(uint[] memory ids) external view returns(Auction[] memory) {
        Auction[] memory auctions = new Auction[](ids.length);
        for(uint i = 0; i < ids.length; i++) {
            auctions[i] = _auctions[ids[i]];
            auctions[i].yourBid = _auctionBids[ids[i]][msg.sender];
        }
        return auctions;
    }

    ////////////////////////////////////////////////////////////////////
    // Only Owner                                                   ////
    ////////////////////////////////////////////////////////////////////
    function initialize(uint32 minimumAuctionLength, uint32 maximumAuctionLength, address payable treasuryAddress, uint16 auctionHouseFee) initializer public {
        __Ownable_init();
        __UUPSUpgradeable_init();
        _setMinimumAndMaximumAuctionLength(minimumAuctionLength, maximumAuctionLength);
        _setTreasuryAddressAndFees(treasuryAddress, auctionHouseFee);
    }
    function _setMinimumAndMaximumAuctionLength(uint32 newMinimumLength, uint32 newMaximumLength) public onlyOwner {
        _minimumAuctionLength = newMinimumLength;
        _maximumAuctionLength = newMaximumLength;
        emit MinimumAndMaximumAuctionLengthUpdated(newMinimumLength, newMaximumLength);
    }
    function _authorizeUpgrade(address) internal override onlyOwner {}
    function _setTreasuryAddressAndFees(address payable treasuryAddress, uint16 newFee) public onlyOwner {
        _hellTreasuryAddress = treasuryAddress;
        _auctionHouseFee = newFee;
        emit TreasuryAddressAndFeesUpdated(treasuryAddress, newFee);
    }
    function _setIndexer(address indexerAddress) external onlyOwner {
        _indexerAddress = indexerAddress;
        _indexer = AuctionHouseIndexer(indexerAddress);
        emit AuctionHouseIndexerUpdated(indexerAddress);
    }
    function _forceEndAuction(uint auctionId) external onlyOwner {
        _auctions[auctionId].endsAtBlock = block.number;
        emit AuctionClosedByAdmin(auctionId);
    }
    ////////////////////////////////////////////////////////////////////
    // Events                                                       ////
    ////////////////////////////////////////////////////////////////////
    event AuctionCreated(address indexed createdBy, address indexed auctionedTokenAddress, address indexed payingTokenAddress, uint auctionId, uint auctionedAmount, uint startingPrice, uint buyoutPrice, uint endsAtBlock);
    event AuctionClosedByAdmin(uint auctionId);
    event BidIncreased(uint indexed auctionId, address indexed bidder, uint indexed amount, uint userTotalBid);
    event Buyout(uint indexed auctionId, address indexed bidder, uint indexed amount, uint userTotalBid);
    event AuctionHouseIndexerUpdated(address newIndexerAddress);
    event TreasuryAddressAndFeesUpdated(address indexed treasuryAddress, uint16 newFee);
    event ClaimLostBids(uint indexed auctionId, address indexed userAddress, address tokenAddress, uint userReceives);
    event ClaimUnsoldAuctionFunds(uint indexed auctionId, address indexed userAddress, address tokenAddress, uint userReceives, uint feePaid);
    event ClaimWonAuctionRewards(uint indexed auctionId, address indexed userAddress, address tokenAddress, uint userReceives, uint feePaid);
    event ClaimSoldAuctionRewards(uint indexed auctionId, address indexed userAddress, address tokenAddress, uint userReceives, uint feePaid);
    event MinimumAndMaximumAuctionLengthUpdated(uint32 newMinimumLength, uint32 newMaximumLength);
}
