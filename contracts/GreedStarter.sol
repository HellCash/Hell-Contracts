// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
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
    // Used to verify if the Project creator has withdrawn his rewards or leftover tokens (projectId => bool)
    mapping(uint => bool) public _projectFundsOrRewardsWithdrawnByCreator;
    mapping(uint => mapping(address => uint)) public _paidAmount;
    mapping(uint => mapping(address => uint)) public _pendingRewards;

    address payable private _hellTreasuryAddress;
    uint16 public _hellTreasuryFee;
    uint _minimumProjectLength;

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
        // Rewards Collected, total amount of the paidWith currency that the project has collected.
        uint rewardsCollected;
        // Minimum amount that any address is allowed to purchase
        uint minimumPurchase;
        // Maximum amount that any address is allowed to purchase
        uint maximumPurchase;
        // Address of the creator of the project
        address createdBy;
    }
    ////////////////////////////////////////////////////////////////////
    // External functions                                           ////
    ////////////////////////////////////////////////////////////////////
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
        // CP3: The Project Token must have 18 decimals of precision
        require(IERC20Metadata(tokenAddress).decimals() == 18, "CP3");
        // CP4: The minimum length should be of least _minimumProjectLength blocks
        require(block.number.lowerThan(endsAtBlock) && (endsAtBlock - block.number) >= _minimumProjectLength, "CP4");
        // CP5: The startingBlock should be higher or equal to the current block and lower than the ending block
        require(startingBlock.notElapsedOrEqualToCurrentBlock() && startingBlock.lowerThan(endsAtBlock), "CP5");
        // CP6: The minimum and maximum purchase must be higher or equal to 0.01, (1e16 wei)
        // We enforce this to ensure enough precision on price calculations
        require(1e16 <= minimumPurchase  && 1e16 <= maximumPurchase, "CP6");
        // CP7: The minimumPurchase must be lower or equal to the maximumPurchase
        require(minimumPurchase <= maximumPurchase, "CP7");
        // CP8: The pricePerToken per token must be higher or equal to 1e6 wei (Like on USDT or USDC)
        require(1e6 <= pricePerToken, "CP8");
        // CP9: The Total Tokens cannot be lower than the maximum or minimumPurchase
        // Since we already tested for minimumPurchase and maximumPurchase we can assume that the totalTokens are also higher or equal than 1e16
        require(minimumPurchase <= totalTokens && maximumPurchase <= totalTokens, "CP9");
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
        // Logs a ProjectCreated event
        emit ProjectCreated(project.id, project.tokenAddress, project.paidWith, project.totalTokens, project.startingBlock, project.endsAtBlock, project.pricePerToken);
     }

     function invest(uint projectId, uint amountToBuy) external payable nonReentrant {
         Project storage project = _projects[projectId];
         // I1: This project doesn't exists
         require(project.id != 0, "I1");
         // I2: "You can't invest in your your own project"
         require(msg.sender != project.createdBy, "I2");
         // I3: This project already finished
         require(project.endsAtBlock.notElapsed(), "I3");
         // I4: This project hasn't started yet
         require(project.startingBlock.elapsedOrEqualToCurrentBlock(), "I4");
         // I5: Not enough tokens available to perform this investment;
         require((project.totalTokens - project.totalSold) >= amountToBuy, "I5");
         // I6: You can't purchase less than the minimum amount
         require(amountToBuy >= project.minimumPurchase, "I6");
         // I7: You can't purchase more than the maximum allowed
         require(_pendingRewards[projectId][msg.sender] + amountToBuy <= project.maximumPurchase, "I7");
         // Calculate the amount that the user has to pay for this investment
         uint amountToPay = (project.pricePerToken * amountToBuy) / 1 ether;
         // Transfer user funds to the Greed Starter Contract
         // safeDepositAsset: Validates for enough: balance, allowance and if the GreedStarter Contract received the expected amount
         payable(address(this)).safeDepositAsset(project.paidWith, amountToPay);
         // Register user participation
         _indexer._registerUserParticipation(projectId, msg.sender);
         // Save changes
         // If the project is being paid with the Network currency, we can safely pass msg.value to avoid negligible leftovers.
         // safeDepositAsset already verified that the amountToPay was higher or equal to msg.value.
         if(project.paidWith == address(0)) {
             // Update the amount the user has invested in this project
             _paidAmount[projectId][msg.sender] += msg.value;
             // Update the total investments the project has collected
             project.rewardsCollected += msg.value;
         // Else if we are paying with a ERC20 compliant token.
         } else {
             // Update the amount the user has invested in this project
             _paidAmount[projectId][msg.sender] += amountToPay;
             // Update the total investments the project has collected
             project.rewardsCollected += amountToPay;
         }
         // Update the total amount that this project has sold
         project.totalSold += amountToBuy;
         // Update the amount of rewards that will be available for the investor once the project ends.
         _pendingRewards[projectId][msg.sender] += amountToBuy;
         // Logs an InvestedInProject event
         emit InvestedInProject(projectId, msg.sender, amountToPay, amountToBuy, _paidAmount[projectId][msg.sender], _pendingRewards[projectId][msg.sender]);
     }

    function claimFunds(uint projectId) external nonReentrant {
        Project storage project = _projects[projectId];
        // CF1: "This project is still in progress"
        require(project.endsAtBlock.elapsed(), "CF1");
        // If the msg.sender is the project creator
        if(msg.sender == project.createdBy) {
            // CF2: You already withdrawn your rewards and leftover tokens
            require(_projectFundsOrRewardsWithdrawnByCreator[projectId] == false, "CF2");
            // Mark his project rewards as claimed
            _projectFundsOrRewardsWithdrawnByCreator[projectId] = true;
            uint userReceives;
            uint feePaid;
            // If the project collected more than 0 rewards, transfer the earned rewards to the project creator and pay treasury fees.
            if (project.rewardsCollected > 0) {
                (userReceives, feePaid) = payable(project.createdBy).safeTransferAssetAndPayFee(project.paidWith, project.rewardsCollected, _hellTreasuryAddress, _hellTreasuryFee);
            }
            // Calculate if there were leftover tokens
            uint unsoldAmount = project.totalTokens - project.totalSold;
            if (unsoldAmount > 0) {
                // Transfer leftover tokens back to the project creator
                payable(project.createdBy).safeTransferAsset(project.tokenAddress, unsoldAmount);
            }
            // Logs a CreatorWithdrawnFunds event.
            emit CreatorWithdrawnFunds(projectId, msg.sender, project.rewardsCollected, feePaid, userReceives, unsoldAmount);
        // If the msg.sender isn't the project creator.
        } else {
            uint rewardedAmount = _pendingRewards[projectId][msg.sender];
            // CF3: "You don't have any reward to claim"
            require(_pendingRewards[projectId][msg.sender] > 0, "CF3");
            // Set user pendingRewards back to 0
            _pendingRewards[projectId][msg.sender] = 0;
            // Send the user his earned rewards
            payable(msg.sender).safeTransferAsset(project.tokenAddress, rewardedAmount);
            // Logs a RewardsClaimed event.
            emit RewardsClaimed(projectId, msg.sender, rewardedAmount);
        }
    }
    ////////////////////////////////////////////////////////////////////
    // Views                                                        ////
    ////////////////////////////////////////////////////////////////////
    function getProjects(uint[] memory ids) external view returns(Project[] memory) {
        require(ids.length <= 30, "PAG"); // PAG: Pagination limit exceeded
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
    function initialize(uint minimumProjectLength, address payable treasuryAddress, uint16 treasuryFee) initializer public {
        __Ownable_init();
        __UUPSUpgradeable_init();
        _setMinimumProjectLength(minimumProjectLength);
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

    function _setMinimumProjectLength(uint newLength) public onlyOwner {
        _minimumProjectLength = newLength;
        emit MinimumProjectLengthUpdated(newLength);
    }
    ////////////////////////////////////////////////////////////////////
    // Events                                                       ////
    ////////////////////////////////////////////////////////////////////
    event ProjectCreated(uint indexed projectId, address payable tokenAddress, address payable paidWith, uint totalAvailable, uint startingBlock, uint endsAtBlock, uint pricePerToken);
    event InvestedInProject(uint indexed projectId, address userAddress, uint amountPaid, uint amountRewarded, uint totalPaid, uint totalRewarded);
    event CreatorWithdrawnFunds(uint indexed projectId, address creatorAddress, uint amountRewarded, uint paidFees, uint amountRewardedAfterFees, uint amountRecovered);
    event RewardsClaimed(uint indexed projectId, address userAddress, uint amountRewarded);
    event TreasuryAddressAndFeesUpdated(address indexed treasuryAddress, uint16 newFee);
    event GreedStarterIndexerUpdated(address newIndexerAddress);
    event MinimumProjectLengthUpdated(uint newLength);
}
