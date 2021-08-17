// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./AuctionHouse.sol";

contract AuctionHouseIndexer is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    AuctionHouse private _auctionHouseContract;
    address _auctionHouseAddress;
    uint16 _maxPaginationSize;
    //////////////////////////////////////////////////////////////////////////
    // Total Trusted token auctions
    uint public _totalTrustedTokenAuctions;
    // Holds the ids of the trusted Auctions ( index => auctionId )
    mapping(uint => uint) _trustedTokenAuctions;
    // Help us know if a specific token address was marked as trusted or not.
    mapping(address => bool) _tokenIsTrusted;
    //////////////////////////////////////////////////////////////////////////
    // Total auctions made for a specific token
    mapping(address => uint) public _totalTokenAuctions;
    // Auctions created for the specific token address (Token Address => index => auction.id);
    mapping(address => mapping(uint => uint)) _tokenAuctions;
    //////////////////////////////////////////////////////////////////////////
    // Holds the number of auctions the user has created
    mapping(address => uint) public _userTotalAuctions;
    // Auctions created by the specified user ( User address => index => auction.id)
    mapping(address => mapping(uint => uint)) _userAuctions;
    //////////////////////////////////////////////////////////////////////////
    // Holds the amount of auctions where the user has participated by making bids or buyouts
    // UserAddress => totalParticipatedAuctions
    mapping(address => uint) public _userTotalParticipatedAuctions;
    // Holds the auction ids of all the auctions where the user participated
    // UserAddress => index => AuctionId
    mapping(address => mapping(uint => uint)) _userParticipatedAuctions;
    // Holds a boolean to let know if the user has participated on a specific auction
    mapping(address => mapping(uint => bool)) _userParticipatedInAuction;
    //////////////////////////////////////////////////////////////////////////
    // Total Auctions by paying currency
    mapping(address => uint) public _totalPaidWithTokenAuctions;
    // Auctions sold for the specific token address (Token Address => index => auction.id);
    mapping(address => mapping(uint => uint)) _paidWithTokenAuctions;
    ////////////////////////////////////////////////////////////////////////
    // Total Auctions won by User Address
    mapping(address => uint) public _userTotalAuctionsWon;
    // Holds a boolean to let know if the user won a specific Auction
    mapping(address => mapping(uint => bool)) _userWonTheAuction;
    ////////////////////////////////////////////////////////////////////////
    // Total Auctions sold by User Address
    mapping(address => uint) public _userTotalAuctionsSold;
    // Holds a boolean to let know if the user managed to sell a specific Auction
    mapping(address => mapping(uint => bool)) _userSoldTheAuction;
    ////////////////////////////////////////////////////////////////////
    // Public Views                                                 ////
    ////////////////////////////////////////////////////////////////////
    function getAuctionIdsCreatedByAddress(address creatorAddress, uint[] memory indexes) external view returns(uint[] memory) {
        // PAG: Exceeds pagination limit
        require(indexes.length <= _maxPaginationSize, "PAG");
        uint[] memory auctionIds = new uint[](indexes.length);
        for(uint i = 0; i < indexes.length; i++) {
            auctionIds[i] = _userAuctions[creatorAddress][indexes[i]];
        }
        return auctionIds;
    }

    function getAuctionIdsParticipatedByAddress(address participatingAddress, uint[] memory indexes) external view returns(uint[] memory) {
        // PAG: Exceeds pagination limit
        require(indexes.length <= _maxPaginationSize, "PAG");
        uint[] memory auctionIds = new uint[](indexes.length);
        for(uint i = 0; i < indexes.length; i++) {
            auctionIds[i] = _userParticipatedAuctions[participatingAddress][indexes[i]];
        }
        return auctionIds;
    }

    function getAuctionIdsByAuctionedTokenAddress(address auctionedTokenAddress, uint[] memory indexes) external view returns(uint[] memory) {
        // PAG: Exceeds pagination limit
        require(indexes.length <= _maxPaginationSize, "PAG");
        uint[] memory auctionIds = new uint[](indexes.length);
        for(uint i = 0; i < indexes.length; i++) {
            auctionIds[i] = _tokenAuctions[auctionedTokenAddress][indexes[i]];
        }
        return auctionIds;
    }

    function getAuctionIdsPaidWithTokenAddress(address paidWithTokenAddress, uint[] memory indexes) external view returns(uint[] memory) {
        // PAG: Exceeds pagination limit
        require(indexes.length <= _maxPaginationSize, "PAG");
        uint[] memory auctionIds = new uint[](indexes.length);
        for(uint i = 0; i < indexes.length; i++) {
            auctionIds[i] = _paidWithTokenAuctions[paidWithTokenAddress][indexes[i]];
        }
        return auctionIds;
    }

    function getTrustedAuctionIds(uint[] memory indexes) external view returns(uint[] memory) {
        // PAG: Exceeds pagination limit
        require(indexes.length <= _maxPaginationSize, "PAG");
        uint[] memory auctionIds = new uint[](indexes.length);
        for(uint i = 0; i < indexes.length; i++) {
            auctionIds[i] = _trustedTokenAuctions[indexes[i]];
        }
        return auctionIds;
    }

    ////////////////////////////////////////////////////////////////////
    // Only Auction House                                           ////
    ////////////////////////////////////////////////////////////////////
    modifier onlyAuctionHouse() {
        require(_auctionHouseAddress == msg.sender, "Forbidden");
        _;
    }

    function registerNewAuctionCreation(uint auctionId, address creatorAddress, address auctionedTokenAddress, address paidWithTokenAddress) external onlyAuctionHouse returns(bool) {
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
        if(_tokenIsTrusted[auctionedTokenAddress] && _tokenIsTrusted[paidWithTokenAddress]) {
            _totalTrustedTokenAuctions += 1;
            _trustedTokenAuctions[_totalTrustedTokenAuctions] = auctionId;
        }
        return true;
    }

    function registerUserParticipation(uint auctionId, address userAddress) onlyAuctionHouse external returns(bool){
        if (_userParticipatedInAuction[userAddress][auctionId] == false) {
            _userParticipatedInAuction[userAddress][auctionId] = true;
            _userTotalParticipatedAuctions[userAddress] += 1;
            _userParticipatedAuctions[userAddress][_userTotalParticipatedAuctions[userAddress]] = auctionId;
        }
        return true;
    }

    function registerAuctionSold(uint auctionId, address creatorAddress) onlyAuctionHouse external returns(bool) {
        if(_userSoldTheAuction[creatorAddress][auctionId] == false) {
            _userSoldTheAuction[creatorAddress][auctionId] = true;
            _userTotalAuctionsSold[creatorAddress] += 1;
        }
        return true;
    }

    function registerAuctionWon(uint auctionId, address winnerAddress) onlyAuctionHouse external returns(bool) {
        if(_userWonTheAuction[winnerAddress][auctionId] == false) {
            _userWonTheAuction[winnerAddress][auctionId] = true;
            _userTotalAuctionsWon[winnerAddress] += 1;
        }
        return true;
    }

    ////////////////////////////////////////////////////////////////////
    // Only Owner                                                   ////
    ////////////////////////////////////////////////////////////////////
    function initialize(address auctionHouseAddress) initializer public {
        __Ownable_init();
        _maxPaginationSize = 30;
        // By default the only trusted token will be the Network currency
        _tokenIsTrusted[address(0)] = true;
        _setAuctionHouseContract(auctionHouseAddress);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
    function _setAuctionHouseContract(address contractAddress) public onlyOwner {
        _auctionHouseAddress = contractAddress;
        _auctionHouseContract = AuctionHouse(contractAddress);
        emit AuctionHouseContractUpdated(contractAddress);
    }
    function _updateTokenTrust(address tokenAddress, bool isTrusted) external onlyOwner {
        _tokenIsTrusted[tokenAddress] = isTrusted;
        emit UpdatedTokenTrust(tokenAddress, isTrusted);
    }
    ////////////////////////////////////////////////////////////////////
    // Events                                                       ////
    ////////////////////////////////////////////////////////////////////
    event UpdatedTokenTrust(address tokenAddress, bool isTrusted);
    event AuctionHouseContractUpdated(address newContractAddress);
}
