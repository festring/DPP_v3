// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Contacts {
    uint public count = 0; // 연락처의 총 개수
    address public owner; // 계약 배포자의 주소를 저장하는 변수
    mapping(address => bool) public modifiers; // 데이터 수정 권한이 있는 주소

    struct Contact {
        uint id;
        string onnx;
        string model;
        string aasx;
        string pt;
    }

    mapping(uint => Contact) public contacts;

    // 이벤트 정의 (이벤트 로그를 통한 상태 기록)
    event ContactCreated(uint indexed id, string onnx, string model, string aasx, string pt);
    event ContactUpdated(uint indexed id, string onnx, string model, string aasx, string pt, uint timestamp);
    event ContactDeleted(uint indexed id, uint timestamp);
    event ModifierAdded(address indexed account);
    event ModifierRemoved(address indexed account);

    // 계약 배포 시 owner를 설정하고, 첫 번째 연락처를 생성합니다.
    constructor() public {
        owner = msg.sender; // 계약 배포자를 owner로 설정
        createContact(
            'https://ipfs.io/ipfs/QmWwDtubC632R6mdRet5YL4uxMz6NCZuPusaZnyM7aK7wr?filename=GripperAction.onnx',
            'https://ipfs.io/ipfs/QmP2hV9dod9sE4cqHLnzG1RCWainquDGKqNGUtecUnGZu6?filename=DeltaRobot_detection_model.engine',
            'https://ipfs.io/ipfs/QmTVDd8SMw2atDWXPdp4UkpqaxcGk2dWrCeN72FJMmqsCa?filename=DeltaRobotDPP_information.aasx',
            'https://ipfs.io/ipfs/QmRKRnnES4NMmiAZW18Z1tifcVeKp3WBiDQTwxqZyFL8aB?filename=DeltaRobot_Part_Detection.pt'
        );
    }

    // 접근 제한을 위한 modifier
    modifier onlyOwner() {
        require(msg.sender == owner, "Access denied: Only owner can perform this action.");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == owner || modifiers[msg.sender], "Access denied: Only authorized users can perform this action.");
        _;
    }

    // 수정자를 추가하는 함수 (onlyOwner 권한 필요)
    function addModifier(address _account) public onlyOwner {
        require(!modifiers[_account], "Account is already a modifier.");
        modifiers[_account] = true;
        emit ModifierAdded(_account);
    }

    // 수정자를 제거하는 함수 (onlyOwner 권한 필요)
    function removeModifier(address _account) public onlyOwner {
        require(modifiers[_account], "Account is not a modifier.");
        modifiers[_account] = false;
        emit ModifierRemoved(_account);
    }

    // 연락처 생성 함수 (onlyAuthorized 권한 필요)
    function createContact(
        string memory _onnx,
        string memory _model,
        string memory _aasx,
        string memory _pt
    ) public onlyAuthorized {
        count++;
        contacts[count] = Contact(count, _onnx, _model, _aasx, _pt);
        emit ContactCreated(count, _onnx, _model, _aasx, _pt);
    }

    // 연락처 수정 함수 (onlyAuthorized 권한 필요)
    function updateContact(
        uint _id,
        string memory _onnx,
        string memory _model,
        string memory _aasx,
        string memory _pt
    ) public onlyAuthorized {
        require(_id > 0 && _id <= count, "Contact ID does not exist.");

        // 연락처 업데이트
        contacts[_id] = Contact(_id, _onnx, _model, _aasx, _pt);
        emit ContactUpdated(_id, _onnx, _model, _aasx, _pt, block.timestamp);
    }

    // 연락처 삭제 함수 (onlyAuthorized 권한 필요)
    function deleteContact(uint _id) public onlyAuthorized {
        require(_id > 0 && _id <= count, "Contact ID does not exist.");
        
        // 연락처 삭제
        delete contacts[_id];
        emit ContactDeleted(_id, block.timestamp);
    }

    // 연락처 조회 함수 (모든 사용자 가능)
    function getContact(uint _id) public view returns (uint, string memory, string memory, string memory, string memory) {
        require(_id > 0 && _id <= count, "Contact ID does not exist.");
        Contact memory contact = contacts[_id];
        return (contact.id, contact.onnx, contact.model, contact.aasx, contact.pt);
    }
}
