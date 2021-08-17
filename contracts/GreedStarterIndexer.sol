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
        require(indexes.length <= _maximumPageSize, "PAG"); // Pagination limit exceeded
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

    function initialize(address greedStarterAddress) initializer public {
        __Ownable_init();
        __UUPSUpgradeable_init();
        _maximumPageSize = 30;
        _totalTrustedProjects = 0;
        _setGreedStarterContract(greedStarterAddress);
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
    function _setGreedStarterContract(address contractAddress) public onlyOwner {
        _greedStarterAddress = contractAddress;
        _greedStarterContract = GreedStarter(contractAddress);
        emit GreedStarterContractUpdated(contractAddress);
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
    event GreedStarterContractUpdated(address newContractAddress);
    event ProjectRegisteredAsTrusted(uint indexed projectId);
    event ProjectRemovedFromTrustedProjects(uint indexed projectId, uint indexed projectIndex);

}
