// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {

    /* =====================================================
                        ENUMS
    ===================================================== */
    enum Status {
        UPCOMING,
        ACTIVE,
        ENDED,
        CANCELLED
    }

    /* =====================================================
                        STRUCTS
    ===================================================== */
    struct Candidate {
        string name;
        uint256 voteCount;
    }

    struct Election {
        uint256 id;
        string title;
        string code;

        uint256 startTime;
        uint256 endTime;

        bool resultsHidden;
        bool allowMultiple;
        bool isCancelled;

        address creator; // chi ha creato l'elezione

        Candidate[] candidates;
        bool deleted;
    }

    Election[] public elections;
    
    uint256 public nextElectionId = 0;


    /* =====================================================
                        VOTING STATE
    ===================================================== */
    mapping(uint256 => mapping(address => mapping(uint256 => bool))) public hasVotedForCandidate;
    mapping(uint256 => mapping(address => bool)) public hasParticipated;

    /* =====================================================
                        CODE MAPPING
    ===================================================== */
    mapping(string => uint256) private codeToElection;
    mapping(uint256 => uint256) private idToIndex; // election.id => indice array

    /* =====================================================
                            EVENTS
    ===================================================== */
    event ElectionCreated(uint256 indexed electionId, string title, string code);
    event VoteCast(uint256 indexed electionId, uint256 indexed candidateId, address voter);
    event ElectionCancelled(uint256 indexed electionId);

    /* =====================================================
                        CREATE ELECTION
    ===================================================== */
    function createElection(
        string memory _id,
        string memory _title,
        string[] memory _candidateNames,
        bool _resultsHidden,
        bool _allowMultiple
    ) external {
        require(_candidateNames.length > 1, "Minimo 2 candidati");

        Election storage e = elections.push();
        
        e.id = nextElectionId;           // assegna ID crescente
        idToIndex[nextElectionId] = elections.length - 1;

        nextElectionId++;                // incrementa per la prossima elezione
        e.title = _title;
        e.resultsHidden = _resultsHidden;
        e.allowMultiple = _allowMultiple;
        e.isCancelled = false;
        e.creator = msg.sender;

        delete e.candidates;
        for (uint256 i = 0; i < _candidateNames.length; i++) {
            e.candidates.push(Candidate({name: _candidateNames[i], voteCount: 0}));
        }

        e.code = _generateCode(e.id, block.timestamp);
        codeToElection[e.code] = e.id;

        emit ElectionCreated(e.id, _title, e.code);
    }

    /* =====================================================
                                VOTE
    ===================================================== */
    function vote(uint256 _electionId, uint256 _candidateId) external {
        uint256 index = idToIndex[_electionId];
        require(index < elections.length, "Elezione inesistente");

        Election storage e = elections[index];

        // resto della funzione uguale
    }
    function voteMultiple(uint256 _electionId, uint256[] calldata _candidateIds) external {
        require(_electionId < elections.length, "Elezione inesistente");

        uint256 index = idToIndex[_electionId];
        Election storage e = elections[index];

        require(!e.isCancelled, "Elezione annullata");

        if (e.startTime > 0) {
            require(block.timestamp >= e.startTime, "Non iniziata");
        }

        if (e.endTime > 0) {
            require(block.timestamp <= e.endTime, "Scaduta");
        }

        require(e.allowMultiple, "Voto multiplo non consentito");

        for (uint256 i = 0; i < _candidateIds.length; i++) {
            uint256 candidateId = _candidateIds[i];

            require(candidateId < e.candidates.length, "Candidato inesistente");

            require(
                !hasVotedForCandidate[_electionId][msg.sender][candidateId],
                "Gia' votato questo candidato"
            );

            hasVotedForCandidate[_electionId][msg.sender][candidateId] = true;
            e.candidates[candidateId].voteCount++;

            emit VoteCast(_electionId, candidateId, msg.sender);
        }

        hasParticipated[_electionId][msg.sender] = true;
    }

    /* =====================================================
                    DELETE ELECTION
    ===================================================== */
    function deleteElection(uint256 _electionId) external { 
        uint256 index = idToIndex[_electionId];
        require(index < elections.length, "Elezione inesistente");

        Election storage e = elections[index];

        require(!e.isCancelled, "Gia' annullata");
        require(e.startTime == 0 || block.timestamp < e.startTime, "Gia' iniziata");
        require(msg.sender == e.creator, "Non sei il creatore dell'elezione");

        e.isCancelled = true;

        emit ElectionCancelled(_electionId);
    }



    /* =====================================================
                        STATUS LOGIC
    ===================================================== */
    function getElectionStatus(uint256 _id) public view returns (Status) {
        require(_id < elections.length, "Elezione inesistente");

        uint256 index = idToIndex[_id];
        Election storage e = elections[index];
        if (e.isCancelled) return Status.CANCELLED;
        if (e.startTime > 0 && block.timestamp < e.startTime) return Status.UPCOMING;
        if (e.endTime > 0 && block.timestamp > e.endTime) return Status.ENDED;

        return Status.ACTIVE;
    }

    /* =====================================================
                        GET ELECTION
    ===================================================== */
    function getElection(uint256 _electionId)
        external
        view
        returns (
            string memory title,
            Candidate[] memory candidates,
            bool resultsHidden,
            bool allowMultiple,
            Status status,
            string memory code,
            bool isCancelled
        )
    {
        uint256 index = idToIndex[_electionId];
        require(index < elections.length, "Elezione inesistente");
        Election storage e = elections[index];
        
        Status currentStatus = getElectionStatus(_electionId);

        return (
            e.title,
            e.candidates,
            e.resultsHidden,
            e.allowMultiple,
            currentStatus,
            e.code,
            e.isCancelled
        );
    }
    function getAllElectionIds() external view returns (uint256[] memory) {
        uint256[] memory ids = new uint256[](elections.length);
        for (uint256 i = 0; i < elections.length; i++) {
            ids[i] = elections[i].id;
        }
        return ids;
    }
    function getElectionCount() external view returns (uint256) {
        return elections.length; // conta tutte le elezioni, anche cancellate
    }

    function getElectionByCode(string memory _code)
        external
        view
        returns (uint256)
    {
        require(bytes(_code).length > 0, "Codice vuoto");
        uint256 id = codeToElection[_code];
        require(idToIndex[id] < elections.length, "Codice non valido");
        return id;
    }

    function getElectionMeta(uint256 _id)
        external
        view
        returns (
            uint256 id,
            address creator,
            bool isCancelled
        )
    {
        require(_id < elections.length, "Elezione inesistente");
        uint256 index = idToIndex[_id];
        Election storage e = elections[index];
        return (e.id, e.creator, e.isCancelled);
    }

    /* =====================================================
                            INTERNAL
    ===================================================== */
    function _generateCode(uint256 id, uint256 timestamp)
        internal
        pure
        returns (string memory)
    {
        bytes32 hash = keccak256(abi.encodePacked(id, timestamp));
        bytes memory chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        bytes memory code = new bytes(6);

        for (uint256 i = 0; i < 6; i++) {
            code[i] = chars[uint8(hash[i]) % chars.length];
        }

        return string(code);
    }
}