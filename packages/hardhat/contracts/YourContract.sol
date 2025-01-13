// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract ElectionManager {
    struct Nominee {
        string name;
        uint256 votesReceived;
    }

    struct Poll {
        string title;
        uint256 startTimestamp;
        uint256 endTimestamp;
        mapping(address => bool) hasVoted;
        Nominee[] nominees;
        bool isActive;
    }

    address public administrator;
    uint256 public totalPolls = 0;
    mapping(uint256 => Poll) public polls;

    modifier onlyAdministrator() {
        require(msg.sender == administrator, "Caller is not the administrator");
        _;
    }

    modifier pollExists(uint256 pollId) {
        require(polls[pollId].isActive, "Poll does not exist");
        _;
    }

    modifier duringPoll(uint256 pollId) {
        require(
            block.timestamp >= polls[pollId].startTimestamp &&
            block.timestamp <= polls[pollId].endTimestamp,
            "Poll is not currently active"
        );
        _;
    }

    modifier hasNotVotedInPoll(uint256 pollId) {
        require(!polls[pollId].hasVoted[msg.sender], "You have already cast your vote");
        _;
    }

    constructor() {
        administrator = msg.sender;
    }

    event PollCreated(uint256 indexed pollId, string title, uint256 startTimestamp, uint256 endTimestamp);
    event VoteSubmitted(uint256 indexed pollId, address indexed voter, uint256 nomineeIndex);

    function getAdministrator() public view returns (address) {
        return administrator;
    }

    function changeAdministrator(address newAdmin) public onlyAdministrator {
        require(newAdmin != address(0), "New administrator is the zero address");
        administrator = newAdmin;
    }

    function createPoll(
        string memory _title,
        string[] memory _nomineeNames,
        uint256 _startTimestamp,
        uint256 _endTimestamp
    ) public onlyAdministrator {
        require(_startTimestamp < _endTimestamp, "Invalid time range");

        Poll storage newPoll = polls[totalPolls];
        newPoll.title = _title;
        newPoll.startTimestamp = _startTimestamp;
        newPoll.endTimestamp = _endTimestamp;
        newPoll.isActive = true;

        for (uint256 i = 0; i < _nomineeNames.length; i++) {
            newPoll.nominees.push(Nominee({name: _nomineeNames[i], votesReceived: 0}));
        }

        emit PollCreated(totalPolls, _title, _startTimestamp, _endTimestamp);
        totalPolls++;
    }

    function castVote(uint256 pollId, uint256 nomineeIndex)
        public
        pollExists(pollId)
        duringPoll(pollId)
        hasNotVotedInPoll(pollId)
    {
        Poll storage currentPoll = polls[pollId];

        require(nomineeIndex < currentPoll.nominees.length, "Invalid nominee index");

        currentPoll.nominees[nomineeIndex].votesReceived++;
        currentPoll.hasVoted[msg.sender] = true;

        emit VoteSubmitted(pollId, msg.sender, nomineeIndex);
    }

    function getPollResults(uint256 pollId)
        public
        view
        pollExists(pollId)
        returns (string[] memory, uint256[] memory)
    {
        Poll storage currentPoll = polls[pollId];
        uint256 nomineeCount = currentPoll.nominees.length;

        string[] memory nomineeNames = new string[](nomineeCount);
        uint256[] memory voteCounts = new uint256[](nomineeCount);

        for (uint256 i = 0; i < nomineeCount; i++) {
            nomineeNames[i] = currentPoll.nominees[i].name;
            voteCounts[i] = currentPoll.nominees[i].votesReceived;
        }

        return (nomineeNames, voteCounts);
    }
}