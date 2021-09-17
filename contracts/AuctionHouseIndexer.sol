// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./AuctionHouse.sol";
import "./abstract/HellGoverned.sol";

contract AuctionHouseIndexer is Initializable, UUPSUpgradeable, OwnableUpgradeable, HellGoverned {
    AuctionHouse private _auctionHouseContract;
    address public _auctionHouseAddress;
    //////////////////////////////////////////////////////////////////////////
    // Total Trusted token auctions
    uint public _totalTrustedTokenAuctions;
    // Holds the ids of the trusted Auctions ( index => auctionId )
    mapping(uint => uint) public _trustedTokenAuctions;
    //////////////////////////////////////////////////////////////////////////
    // Total auctions made for a specific token
    mapping(address => uint) public _totalTokenAuctions;
    // Auctions created for the specific token address (Token Address => index => auction.id);
    mapping(address => mapping(uint => uint)) public _tokenAuctions;
    //////////////////////////////////////////////////////////////////////////
    // Holds the number of auctions the user has created
    mapping(address => uint) public _userTotalAuctions;
    // Auctions created by the specified user ( User address => index => auction.id)
    mapping(address => mapping(uint => uint)) public _userAuctions;
    //////////////////////////////////////////////////////////////////////////
    // Holds the amount of auctions where the user has participated by making bids or buyouts
    // UserAddress => totalParticipatedAuctions
    mapping(address => uint) public _userTotalParticipatedAuctions;
    // Holds the auction ids of all the auctions where the user participated
    // UserAddress => index => AuctionId
    mapping(address => mapping(uint => uint)) public _userParticipatedAuctions;
    // Holds a boolean to let know if the user has participated on a specific auction
    mapping(address => mapping(uint => bool)) public _userParticipatedInAuction;
    //////////////////////////////////////////////////////////////////////////
    // Total Auctions by paying currency
    mapping(address => uint) public _totalPaidWithTokenAuctions;
    // Auctions sold for the specific token address (Token Address => index => auction.id);
    mapping(address => mapping(uint => uint)) public _paidWithTokenAuctions;
    ////////////////////////////////////////////////////////////////////////
    // Total Auctions won by User Address
    mapping(address => uint) public _userTotalAuctionsWon;
    // Holds a boolean to let know if the user won a specific Auction
    mapping(address => mapping(uint => bool)) public _userWonTheAuction;
    ////////////////////////////////////////////////////////////////////////
    // Total Auctions sold by User Address
    mapping(address => uint) public _userTotalAuctionsSold;
    // Holds a boolean to let know if the user managed to sell a specific Auction
    mapping(address => mapping(uint => bool)) public _userSoldAuction;
    ////////////////////////////////////////////////////////////////////
    // Public Views                                                 ////
    ////////////////////////////////////////////////////////////////////
    function getAuctionIdsCreatedByAddress(address creatorAddress, uint[] memory indexes) external view returns(uint[] memory) {
        // PAG: Exceeds pagination limit
        require(indexes.length <= _hellGovernmentContract._generalPaginationLimit(), "PAG");
        uint[] memory auctionIds = new uint[](indexes.length);
        for(uint i = 0; i < indexes.length; i++) {
            auctionIds[i] = _userAuctions[creatorAddress][indexes[i]];
        }
        return auctionIds;
    }

    function getAuctionIdsParticipatedByAddress(address participatingAddress, uint[] memory indexes) external view returns(uint[] memory) {
        // PAG: Exceeds pagination limit
        require(indexes.length <= _hellGovernmentContract._generalPaginationLimit(), "PAG");
        uint[] memory auctionIds = new uint[](indexes.length);
        for(uint i = 0; i < indexes.length; i++) {
            auctionIds[i] = _userParticipatedAuctions[participatingAddress][indexes[i]];
        }
        return auctionIds;
    }

    function getAuctionIdsByAuctionedTokenAddress(address auctionedTokenAddress, uint[] memory indexes) external view returns(uint[] memory) {
        // PAG: Exceeds pagination limit
        require(indexes.length <= _hellGovernmentContract._generalPaginationLimit(), "PAG");
        uint[] memory auctionIds = new uint[](indexes.length);
        for(uint i = 0; i < indexes.length; i++) {
            auctionIds[i] = _tokenAuctions[auctionedTokenAddress][indexes[i]];
        }
        return auctionIds;
    }

    function getAuctionIdsPaidWithTokenAddress(address paidWithTokenAddress, uint[] memory indexes) external view returns(uint[] memory) {
        // PAG: Exceeds pagination limit
        require(indexes.length <= _hellGovernmentContract._generalPaginationLimit(), "PAG");
        uint[] memory auctionIds = new uint[](indexes.length);
        for(uint i = 0; i < indexes.length; i++) {
            auctionIds[i] = _paidWithTokenAuctions[paidWithTokenAddress][indexes[i]];
        }
        return auctionIds;
    }

    function getTrustedAuctionIds(uint[] memory indexes) external view returns(uint[] memory) {
        // PAG: Exceeds pagination limit
        require(indexes.length <= _hellGovernmentContract._generalPaginationLimit(), "PAG");
        uint[] memory auctionIds = new uint[](indexes.length);
        for(uint i = 0; i < indexes.length; i++) {
            auctionIds[i] = _trustedTokenAuctions[indexes[i]];
        }
        return auctionIds;
    }

    struct AuctionHouseUserStats {
        uint totalCreatedAuctions;
        uint totalParticipatedAuctions;
        uint totalAuctionsSold;
        uint totalAuctionsWon;
    }

    function getUserStats(address userAddress) external view returns(AuctionHouseUserStats memory) {
        AuctionHouseUserStats memory stats;
        stats.totalCreatedAuctions = _userTotalAuctions[userAddress];
        stats.totalParticipatedAuctions = _userTotalParticipatedAuctions[userAddress];
        stats.totalAuctionsSold = _userTotalAuctionsSold[userAddress];
        stats.totalAuctionsWon = _userTotalAuctionsWon[userAddress];
        return stats;
    }

    ////////////////////////////////////////////////////////////////////
    // Only Auction House                                           ////
    ////////////////////////////////////////////////////////////////////
    modifier onlyAuctionHouse() {
        require(_auctionHouseAddress == msg.sender, "Forbidden");
        _;
    }

    function _registerNewAuctionCreation(uint auctionId, address creatorAddress, address auctionedTokenAddress, address paidWithTokenAddress) external onlyAuctionHouse returns(bool) {
        // Register the token auction Index
        _totalTokenAuctions[auctionedTokenAddress] += 1;
        _tokenAuctions[auctionedTokenAddress][_totalTokenAuctions[auctionedTokenAddress]] = auctionId;
        // Register the auctions sold for this token
        _totalPaidWithTokenAuctions[paidWithTokenAddress] += 1;
        _paidWithTokenAuctions[paidWithTokenAddress][_totalPaidWithTokenAuctions[paidWithTokenAddress]] = auctionId;
        // Register the AuctionIndex for the User
        _userTotalAuctions[creatorAddress] += 1;
        _userAuctions[creatorAddress][_userTotalAuctions[creatorAddress]] = auctionId;
        // If both tokens are trusted, this Auction will be stored on the list of trusted Auctions
        if(_hellGovernmentContract._tokenIsTrusted(auctionedTokenAddress) && _hellGovernmentContract._tokenIsTrusted(paidWithTokenAddress)) {
            _totalTrustedTokenAuctions += 1;
            _trustedTokenAuctions[_totalTrustedTokenAuctions] = auctionId;
        }
        return true;
    }

    function _registerUserParticipation(uint auctionId, address userAddress) onlyAuctionHouse external returns(bool){
        if (_userParticipatedInAuction[userAddress][auctionId] == false) {
            _userParticipatedInAuction[userAddress][auctionId] = true;
            _userTotalParticipatedAuctions[userAddress] += 1;
            _userParticipatedAuctions[userAddress][_userTotalParticipatedAuctions[userAddress]] = auctionId;
        }
        return true;
    }

    function _registerAuctionSold(uint auctionId, address creatorAddress) onlyAuctionHouse external returns(bool) {
        if(_userSoldAuction[creatorAddress][auctionId] == false) {
            _userSoldAuction[creatorAddress][auctionId] = true;
            _userTotalAuctionsSold[creatorAddress] += 1;
        }
        return true;
    }

    function _registerAuctionWon(uint auctionId, address winnerAddress) onlyAuctionHouse external returns(bool) {
        if(_userWonTheAuction[winnerAddress][auctionId] == false) {
            _userWonTheAuction[winnerAddress][auctionId] = true;
            _userTotalAuctionsWon[winnerAddress] += 1;
        }
        return true;
    }

    ////////////////////////////////////////////////////////////////////
    // Only Owner                                                   ////
    ////////////////////////////////////////////////////////////////////
    function initialize(address hellGovernmentAddress, address auctionHouseAddress) initializer public {
        __Ownable_init();
        _setHellGovernmentContract(hellGovernmentAddress);
        _setAuctionHouseContract(auctionHouseAddress);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
    function _setAuctionHouseContract(address contractAddress) public onlyOwner {
        _auctionHouseAddress = contractAddress;
        _auctionHouseContract = AuctionHouse(contractAddress);
        emit AuctionHouseContractUpdated(contractAddress);
    }
    ////////////////////////////////////////////////////////////////////
    // Events                                                       ////
    ////////////////////////////////////////////////////////////////////
    event AuctionHouseContractUpdated(address newAuctionHouseContractAddress);
}
