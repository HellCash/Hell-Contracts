// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./libraries/HellishTransfers.sol";
import "./libraries/HellishBlocks.sol";
import "./GreedStarterIndexer.sol";

contract GreedStarter is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    using HellishTransfers for address;
    using HellishTransfers for address payable;
    using HellishBlocks for uint;

    GreedStarterIndexer private _indexer;
    address public _indexerAddress;

    uint public _totalProjects;
    mapping(uint => Project) public _projects;
    mapping(uint => mapping(address => uint)) public _paidAmount;
    mapping(uint => mapping(address => uint)) public _pendingRewards;

    address payable private _hellTreasuryAddress;
    uint16 public _hellTreasuryFee;

    struct Project {
        // Unique identifier for this project
        uint id;
        // Token address being offered, this is what users will receive after investing
        address payable tokenAddress;
        // Token address used to invest, this is what users will have to pay in order to invest
        address payable paidWith;
        // Time frames in which the project will be available for investments
        uint startingBlock;
        uint endsAtBlock;
        // Defines how much 1 unit of the token costs against the paidWith asset
        uint pricePerToken;
        // Total amount of tokens available for sale on this project
        uint totalTokens;
        // Amount of tokens that were sold, from the totalTokens
        uint totalSold;
        // Minimum amount that any address is allowed to purchase
        uint minimumPurchase;
        // Maximum amount that any address is allowed to purchase
        uint maximumPurchase;
        // Address of the creator of the project
        address createdBy;
        // Boolean to verify if the Project creator has withdrawn his rewards or leftover tokens
        bool fundsOrRewardsWithdrawnByCreator;
    }

    function createProject(
        address payable tokenAddress,
        address payable paidWith,
        uint totalTokens,
        uint startingBlock,
        uint endsAtBlock,
        uint pricePerToken,
        uint minimumPurchase,
        uint maximumPurchase
    ) external nonReentrant {
        // CP1: Cannot create a project of the network currency
        require(tokenAddress != address(0), "CP1");
        // CP2: Cannot create a project and sell it for the same currency
        require(tokenAddress != paidWith, "CP2");
        // CP3: The minimum length should be of least 1000 blocks
        // TODO: Increase minimum block length, Should be set to 5000 at least
        require(block.number.lowerThan(endsAtBlock) && endsAtBlock - block.number >= 100, "CP3");
        // CP4: The startingBlock should be higher than the current block and lower than the end block
        require(startingBlock.notElapsedOrEqualToCurrentBlock() && startingBlock.lowerThan(endsAtBlock), "CP4");
        // CP5: The minimum and maximum purchase must be higher than 0.0001
        // we'll verify that it has at least 14 decimals // TODO: Verify for 6 decimals, we need to support at least mwei 10^6
        require(1e14 <= minimumPurchase  && 1e14 <= maximumPurchase, "CP5");
        // CP6: The minimumPurchase should be lower or equal to the maximumPurchase
        require(minimumPurchase <= maximumPurchase, "CP6");
        // CP7: The minimumPrice per token should be higher than 0.01
        require(1e16 <= pricePerToken, "CP7");
        // CP8: The Total Tokens cannot be lower than the maximum or minimumPurchase
        require(minimumPurchase <= totalTokens &&  maximumPurchase <= totalTokens, "CP8");
        // safeDepositAsset: Validates for enough: balance, allowance and if the GreedStarter Contract received the expected amount
        payable(address(this)).safeDepositAsset(tokenAddress, totalTokens);

        // Increase the total projects, this value will be used as our next project id
        _totalProjects += 1;
        // Create a new Project and fill it
        Project memory project;
        project.id = _totalProjects;
        project.tokenAddress = tokenAddress;
        project.paidWith = paidWith;
        project.totalTokens = totalTokens;
        project.startingBlock = startingBlock;
        project.endsAtBlock = endsAtBlock;
        project.pricePerToken = pricePerToken;
        project.createdBy = msg.sender;
        project.minimumPurchase = minimumPurchase;
        project.maximumPurchase = maximumPurchase;
        // Save the project
        _projects[_totalProjects] = project;
        // If the Contract owner is the msg.sender, mark the Project as trusted
        if(owner() == msg.sender) {
            _indexer._registerTrustedProject(project.id);
        }
        // Logs a ProjectCreated event
        emit ProjectCreated(project.id, project.tokenAddress, project.paidWith, project.totalTokens, project.startingBlock, project.endsAtBlock, project.pricePerToken);
     }

     function invest(uint projectId, uint amountToBuy) external payable nonReentrant {
         Project storage project = _projects[projectId];
         // IP1: This project doesn't exists
         require(project.id != 0, "IP1");
         // IP2: "You can't invest in your your own project"
         require(msg.sender != project.createdBy, "IP2");
         // IP3: This project already finished
         require(project.endsAtBlock.notElapsed(), "IP3");
         // IP4: This project hasn't started yet
         require(project.startingBlock.elapsedOrEqualToCurrentBlock(), "IP4");
         // IP5: Not enough tokens available to perform this investment;
         require((project.totalTokens - project.totalSold) >= amountToBuy, "IP5");
         // IP6: You can't purchase less than the minimum amount
         require(amountToBuy >= project.minimumPurchase, "IP6");
         // IP7: You can't purchase more than the maximum allowed
         require(_pendingRewards[projectId][msg.sender] + amountToBuy <= project.maximumPurchase, "IP7");
         // Calculate the amount that the user has to pay for this investment
         uint amountToPay = (project.pricePerToken * amountToBuy) / 1 ether;
         // Transfer user funds to the Greed Starter Contract
         // safeDepositAsset: Validates for enough: balance, allowance and if the GreedStarter Contract received the expected amount
         payable(address(this)).safeDepositAsset(project.paidWith, amountToPay);
         // Save changes
         _paidAmount[projectId][msg.sender] += amountToPay;
         project.totalSold += amountToBuy;
         _pendingRewards[projectId][msg.sender] += amountToBuy;
         // Logs an InvestedInProject event
         emit InvestedInProject(projectId, msg.sender, amountToPay, amountToBuy, _paidAmount[projectId][msg.sender], _pendingRewards[projectId][msg.sender]);
     }

    function claimFunds(uint projectId) external nonReentrant {
        Project storage project = _projects[projectId];
        // WR1: "This project is still in progress"
        require(project.endsAtBlock.elapsed(), "WR1");

        uint rewardedAmount;
        if(msg.sender == project.createdBy) {
            require(project.fundsOrRewardsWithdrawnByCreator == false, "WR2");
            project.fundsOrRewardsWithdrawnByCreator = true;
            uint userReceives;
            uint feePaid;
            if (project.totalSold > 0) {
                rewardedAmount = project.totalSold * project.pricePerToken;
                (userReceives, feePaid) = payable(project.createdBy).safeTransferAssetAndPayFee(project.paidWith, rewardedAmount, _hellTreasuryAddress, _hellTreasuryFee);
            }
            uint unsoldAmount = project.totalTokens - project.totalSold;
            if (unsoldAmount > 0) {
                payable(project.createdBy).safeTransferAsset(project.tokenAddress, unsoldAmount);
            }
            emit CreatorWithdrawnFunds(projectId, msg.sender, rewardedAmount, feePaid, userReceives, unsoldAmount);
        } else {
            rewardedAmount = _pendingRewards[projectId][msg.sender];
            // "You don't have any reward to claim"
            require(_pendingRewards[projectId][msg.sender] > 0, "WR3");
            _pendingRewards[projectId][msg.sender] = 0;
            payable(msg.sender).safeTransferAsset(project.tokenAddress, rewardedAmount);
            emit RewardsClaimed(projectId, msg.sender, rewardedAmount);
        }
    }
    ////////////////////////////////////////////////////////////////////
    // Views                                                        ////
    ////////////////////////////////////////////////////////////////////
    function getProjects(uint[] memory ids) external view returns(Project[] memory) {
        require(ids.length <= 30, "GP"); // You can request 30 projects at once
        Project[] memory projects = new Project[](ids.length);
        for(uint i = 0; i < ids.length; i++) {
            projects[i] = _projects[ids[i]];
        }
        return projects;
    }
    ////////////////////////////////////////////////////////////////////
    // Only Owner                                                   ////
    ////////////////////////////////////////////////////////////////////
    function _authorizeUpgrade(address) internal override onlyOwner {}
    function initialize(address payable treasuryAddress, uint16 treasuryFee) initializer public {
        __Ownable_init();
        __UUPSUpgradeable_init();
        _setTreasuryAddressAndFees(treasuryAddress, treasuryFee);
    }

    function _setTreasuryAddressAndFees(address payable treasuryAddress, uint16 newFee) public onlyOwner {
        _hellTreasuryAddress = treasuryAddress;
        _hellTreasuryFee = newFee;
        emit TreasuryAddressAndFeesUpdated(treasuryAddress, newFee);
    }

    function _setIndexer(address indexerAddress) external onlyOwner {
        _indexerAddress = indexerAddress;
        _indexer = GreedStarterIndexer(indexerAddress);
        emit GreedStarterIndexerUpdated(indexerAddress);
    }

    event ProjectCreated(uint indexed projectId, address payable tokenAddress, address payable paidWith, uint totalAvailable, uint startingBlock, uint endsAtBlock, uint pricePerToken);
    event InvestedInProject(uint indexed projectId, address user, uint amountPaid, uint amountRewarded, uint totalPaid, uint totalRewarded);
    event CreatorWithdrawnFunds(uint indexed projectId, address creatorAddress, uint amountRewarded, uint paidFees, uint amountRewardedAfterFees, uint amountRecovered);
    event RewardsClaimed(uint indexed projectId, address user, uint amountClaimed);
    event TreasuryAddressAndFeesUpdated(address indexed treasuryAddress, uint16 newFee);
    event GreedStarterIndexerUpdated(address newIndexerAddress);

}
