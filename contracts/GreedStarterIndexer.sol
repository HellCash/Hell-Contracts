// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.6;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./GreedStarter.sol";

contract GreedStarterIndexer is Initializable, UUPSUpgradeable, OwnableUpgradeable{
    uint16 _maximumPageSize;
    GreedStarter private _greedStarterContract;
    address public _greedStarterAddress;

    //////////////////////////////////////////////////////////////////////////
    uint public _totalTrustedProjects;
    mapping(uint => uint) public _trustedProjects;
    //////////////////////////////////////////////////////////////////////////
    // Holds the number of projects the user has created
    mapping(address => uint) public _userTotalProjects;
    // Projects created by the specified user ( User address => index => project.id)
    mapping(address => mapping(uint => uint)) _userProjects;
    //////////////////////////////////////////////////////////////////////////
    // Holds the amount of projects where the user has participated
    // UserAddress => totalParticipatedProjects
    mapping(address => uint) public _userTotalParticipatedProjects;
    // Holds the Project ids where the user participated
    // UserAddress => index => projectId
    mapping(address => mapping(uint => uint)) _userParticipatedProjects;

    function getTrustedProjectIds(uint[] memory indexes) external view returns(uint[] memory) {
        require(indexes.length <= _maximumPageSize, "GT"); // You can request 30 ids at once
        uint[] memory trustedProjectIds = new uint[](indexes.length);
        for(uint i = 0; i < indexes.length; i++) {
            trustedProjectIds[i] = _trustedProjects[indexes[i]];
        }
        return trustedProjectIds;
    }


    ////////////////////////////////////////////////////////////////////
    // Greed Starter                                                ////
    ////////////////////////////////////////////////////////////////////

    function _registerTrustedProject(uint projectId) external onlyOwnerOrGreedStarter {
        _totalTrustedProjects += 1;
        _trustedProjects[_totalTrustedProjects] = projectId;
        emit ProjectRegisteredAsTrusted(projectId);
    }

    ////////////////////////////////////////////////////////////////////
    // Only Owner                                                   ////
    ////////////////////////////////////////////////////////////////////
    function initialize(address greedStarterAddress) initializer public {
        __Ownable_init();
        __UUPSUpgradeable_init();
        _maximumPageSize = 30;
        _setGreedStarterContract(greedStarterAddress);
    }

    function _removeFromTrustedProjects(uint projectIndex) external onlyOwner {
        uint projectId = _trustedProjects[projectIndex];
        _trustedProjects[projectIndex] = 0;
        emit ProjectRemovedFromTrustedProjects(projectId, projectIndex);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
    function _setGreedStarterContract(address contractAddress) public onlyOwner {
        _greedStarterAddress = contractAddress;
        _greedStarterContract = GreedStarter(contractAddress);
        emit GreedStarterContractUpdated(contractAddress);
    }
    ////////////////////////////////////////////////////////////////////
    // Modifiers                                                    ////
    ////////////////////////////////////////////////////////////////////
    modifier onlyOwnerOrGreedStarter() {
        require(owner() == msg.sender || _greedStarterAddress == msg.sender, "Forbidden");
        _;
    }
    modifier onlyGreedStarter() {
        require(_greedStarterAddress == msg.sender, "Forbidden");
        _;
    }
    ////////////////////////////////////////////////////////////////////
    // Events                                                       ////
    ////////////////////////////////////////////////////////////////////
    event GreedStarterContractUpdated(address newContractAddress);
    event ProjectRegisteredAsTrusted(uint indexed projectId);
    event ProjectRemovedFromTrustedProjects(uint indexed projectId, uint indexed projectIndex);

}
