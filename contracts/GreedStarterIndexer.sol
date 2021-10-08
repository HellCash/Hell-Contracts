// SPDX-License-Identifier: BUSL-1.1
// HellCash
// https://hell.cash
//////////////////////////////////////////

pragma solidity ^0.8.7;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./abstract/HellGoverned.sol";

contract GreedStarterIndexer is Initializable, UUPSUpgradeable, OwnableUpgradeable, HellGoverned {
    address public _greedStarterAddress;
    //////////////////////////////////////////////////////////////////////////
    uint public _totalTrustedProjects;
    mapping(uint => uint) public _trustedProjects;
    mapping(uint => bool) public _projectIsTrusted;
    //////////////////////////////////////////////////////////////////////////
    // Holds the number of projects the user has created
    mapping(address => uint) public _userTotalProjects;
    // Projects created by the specified user ( User address => index => project.id)
    mapping(address => mapping(uint => uint)) public _userProjects;
    //////////////////////////////////////////////////////////////////////////
    // Holds a boolean to let know if the user has participated on a specific project
    // userAddress => projectId => bool
    mapping(address => mapping(uint => bool)) public _userParticipatedInProject;
    // Holds the amount of projects where the user has participated
    // userAddress => totalParticipatedProjects
    mapping(address => uint) public _userTotalParticipatedProjects;
    // Holds the Project ids where the user participated
    // userAddress => index => projectId
    mapping(address => mapping(uint => uint)) public _userParticipatedProjects;
    ////////////////////////////////////////////////////////////////////
    // Public Views                                                 ////
    ////////////////////////////////////////////////////////////////////
    function getTrustedProjectIds(uint[] memory indexes) external view returns(uint[] memory) {
        require(indexes.length <= _hellGovernmentContract._generalPaginationLimit(), "PAG"); // Pagination limit exceeded
        uint[] memory trustedProjectIds = new uint[](indexes.length);
        for(uint i = 0; i < indexes.length; i++) {
            trustedProjectIds[i] = _trustedProjects[indexes[i]];
        }
        return trustedProjectIds;
    }
    ////////////////////////////////////////////////////////////////////
    // Greed Starter                                                ////
    ////////////////////////////////////////////////////////////////////

    function _registerUserParticipation(uint projectId, address userAddress) external onlyGreedStarter {
        if (_userParticipatedInProject[userAddress][projectId] == false) {
            _userParticipatedInProject[userAddress][projectId] = true;
            _userTotalParticipatedProjects[userAddress] += 1;
            _userParticipatedProjects[userAddress][_userTotalParticipatedProjects[userAddress]] = projectId;
        }
    }

    ////////////////////////////////////////////////////////////////////
    // Only Owner                                                   ////
    ////////////////////////////////////////////////////////////////////
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}
    function initialize(address hellGovernmentAddress, address greedStarterAddress) initializer public {
        __Ownable_init();
        __UUPSUpgradeable_init();
        _totalTrustedProjects = 0;
        _setHellGovernmentContract(hellGovernmentAddress);
        _setGreedStarterContractAddress(greedStarterAddress);
    }

    function _registerTrustedProject(uint projectId) external onlyOwner {
        _totalTrustedProjects += 1;
        _trustedProjects[_totalTrustedProjects] = projectId;
        _projectIsTrusted[projectId] = true;
        emit ProjectRegisteredAsTrusted(projectId);
    }

    function _removeFromTrustedProjects(uint projectIndex) external onlyOwner {
        uint projectId = _trustedProjects[projectIndex];
        _trustedProjects[projectIndex] = 0;
        _projectIsTrusted[projectId] = false;
        emit ProjectRemovedFromTrustedProjects(projectId, projectIndex);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
    function _setGreedStarterContractAddress(address contractAddress) public onlyOwner {
        _greedStarterAddress = contractAddress;
        emit GreedStarterContractAddressUpdated(contractAddress);
    }
    ////////////////////////////////////////////////////////////////////
    // Modifiers                                                    ////
    ////////////////////////////////////////////////////////////////////
    modifier onlyGreedStarter() {
        require(_greedStarterAddress == msg.sender, "Forbidden");
        _;
    }
    ////////////////////////////////////////////////////////////////////
    // Events                                                       ////
    ////////////////////////////////////////////////////////////////////
    event GreedStarterContractAddressUpdated(address newContractAddress);
    event ProjectRegisteredAsTrusted(uint indexed projectId);
    event ProjectRemovedFromTrustedProjects(uint indexed projectId, uint indexed projectIndex);

}
