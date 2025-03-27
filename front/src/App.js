import useWeb3 from './hooks/useWeb3'
import { useState, useEffect } from 'react'
import { CONTACT_ABI, CONTACT_ADDRESS } from './config'
import "./App.css"

function App() {
    const [account, web3] = useWeb3()
    const [isLogin, setIsLogin] = useState(false)
    const [balance, setBalance] = useState(0)
    const [isOwner, setIsOwner] = useState(false)
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [dpps, setDPPs] = useState([])
    const [editDPPId, setEditDPPId] = useState(null)
    const [editForm, setEditForm] = useState({ onnx: "", model: "", aasx: "", pt: "" })
    const [createForm, setCreateForm] = useState({ onnx: "", model: "", aasx: "", pt: "" })
    const [logs, setLogs] = useState([]) // 트랜잭션 로그 상태
    const [showLogs, setShowLogs] = useState(false) // 로그 모달 표시 상태
    const [modifierAddress, setModifierAddress] = useState("")

    useEffect(() => {
        const init = async () => {
            if (account && web3) {
                const balance = await web3.eth.getBalance(account)
                setBalance(Number(balance) / 10 ** 18)
                setIsLogin(true)

                const contract = new web3.eth.Contract(CONTACT_ABI, CONTACT_ADDRESS)
                const owner = await contract.methods.owner().call()
                setIsOwner(owner.toLowerCase() === account.toLowerCase())

                const authorized = await contract.methods.modifiers(account).call()
                setIsAuthorized(authorized)

                // DPP 정보 불러오기
                const dppCount = await contract.methods.count().call()
                const dppArray = []
                for (let i = 1; i <= dppCount; i++) {
                    const dpp = await contract.methods.contacts(i).call()
                    dppArray.push({ id: i, ...dpp })
                }
                setDPPs(dppArray)
            }
        }
        init()
    }, [account, web3])

    const createDPP = async (onnx, model, aasx, pt) => {
        if (!isAuthorized && !isOwner) return alert("DPP 생성 권한이 없습니다.")
        const confirmation = window.confirm("DPP를 생성하시겠습니까?")
        if (!confirmation) return

        const contract = new web3.eth.Contract(CONTACT_ABI, CONTACT_ADDRESS)
        await contract.methods.createContact(onnx, model, aasx, pt).send({ from: account })
        alert("DPP가 생성되었습니다.")
        setCreateForm({ onnx: "", model: "", aasx: "", pt: "" })
    }

    const updateDPP = async (id, onnx, model, aasx, pt) => {
        if (!isAuthorized && !isOwner) return alert("DPP 수정 권한이 없습니다.")
        const confirmation = window.confirm("DPP를 수정하시겠습니까?")
        if (!confirmation) return

        const contract = new web3.eth.Contract(CONTACT_ABI, CONTACT_ADDRESS)
        await contract.methods.updateContact(id, onnx, model, aasx, pt).send({ from: account })
        alert("DPP가 수정되었습니다.")
        setEditDPPId(null)
    }

    const deleteDPP = async (id) => {
        if (!isOwner) return alert("DPP 삭제 권한이 없습니다.");
        const confirmation = window.confirm("DPP를 삭제하시겠습니까?");
        if (!confirmation) return;
    
        const contract = new web3.eth.Contract(CONTACT_ABI, CONTACT_ADDRESS);
        await contract.methods.deleteContact(id).send({ from: account });
        alert("DPP가 삭제되었습니다.");
    
        // DPP 상태에서 삭제된 DPP를 제거
        setDPPs((prevDpps) => prevDpps.filter(dpp => dpp.id !== id));
    };

    const handleEditClick = (dpp) => {
        setEditDPPId(dpp.id)
        setEditForm({ onnx: dpp.onnx, model: dpp.model, aasx: dpp.aasx, pt: dpp.pt })
    }

    const handleInputChange = (e, setForm) => {
        const { name, value } = e.target
        setForm((prevForm) => ({ ...prevForm, [name]: value }))
    }

    // 트랜잭션 로그 해독 함수
    const fetchLogs = async () => {
        const contract = new web3.eth.Contract(CONTACT_ABI, CONTACT_ADDRESS)
        const events = await contract.getPastEvents('allEvents', {
            fromBlock: 0,
            toBlock: 'latest'
        })
        const decodedLogs = events.map(event => {
            const { event: eventType, returnValues } = event
            let message = ''
            if (eventType === 'ContactCreated') {
                message = `[DPP 생성]\nID: ${returnValues.id}\nONNX: ${returnValues.onnx}\nModel: ${returnValues.model}\nAASX: ${returnValues.aasx}\nPT: ${returnValues.pt}`;
            } else if (eventType === 'ContactUpdated') {
                message = `[DPP 수정]\nID: ${returnValues.id}\nONNX: ${returnValues.onnx}\nModel: ${returnValues.model}\nAASX: ${returnValues.aasx}\nPT: ${returnValues.pt}`;
            } else if (eventType === 'ContactDeleted') {
                message = `[DPP 삭제]\nID: ${returnValues.id}\nONNX: ${returnValues.onnx}\nModel: ${returnValues.model}\nAASX: ${returnValues.aasx}\nPT: ${returnValues.pt}`;
            }
            return { timestamp: new Date(Number(returnValues.timestamp) * 1000), message }
        })
        setLogs(decodedLogs)
        setShowLogs(true)
    }

    const closeLogs = () => setShowLogs(false)

    const renderDPPs = () => {
        return dpps
            .filter(dpp => dpp.onnx) // Product Name이 존재하는 경우에만 필터링
            .map((dpp) => (
                <div key={dpp.id} className="dpp-card">
                    {/* 콘텐츠 영역 */}
                    <div className="dpp-content">
                        <p><strong>Product Name:</strong> {dpp.onnx}</p>
                        <p><strong>Raw Materials:</strong> {dpp.model}</p>
                        <p><strong>Regulation:</strong> {dpp.aasx}</p>
                        {(isOwner || isAuthorized) && (
                            <a href={dpp.pt} target="_blank" rel="noopener noreferrer" className="pt-button">PT Download</a>
                        )}
                    </div>
    
                    {/* 버튼 영역 */}
                    {(isOwner || isAuthorized) && (
                        <div className="button-group dpp-actions">
                            {editDPPId === dpp.id ? (
                                <div className="edit-form">
                                    <input type="text" name="onnx" value={editForm.onnx} onChange={(e) => handleInputChange(e, setEditForm)} placeholder="Product Name" required />
                                    <input type="text" name="model" value={editForm.model} onChange={(e) => handleInputChange(e, setEditForm)} placeholder="Raw Materials" required />
                                    <input type="text" name="aasx" value={editForm.aasx} onChange={(e) => handleInputChange(e, setEditForm)} placeholder="Regulation" required />
                                    <input type="text" name="pt" value={editForm.pt} onChange={(e) => handleInputChange(e, setEditForm)} placeholder="PT Download" required />
                                    <div className="button-group">
                                        <button onClick={() => updateDPP(dpp.id, editForm.onnx, editForm.model, editForm.aasx, editForm.pt)}>완료</button>
                                        <button onClick={() => setEditDPPId(null)}>취소</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <button onClick={() => handleEditClick(dpp)}>수정</button>
                                    {isOwner && <button onClick={() => deleteDPP(dpp.id)}>삭제</button>}
                                </>
                            )}
                        </div>
                    )}
                </div>
            ));
    };
    
        // onlyAuthorized 권한 부여 함수 (onlyOwner만 사용 가능)
        const addModifier = async (modifierAddress) => {
            if (!isOwner) return alert("권한 부여 권한이 없습니다.")
            const confirmation = window.confirm("이 계정에 권한을 부여하시겠습니까?")
            if (!confirmation) return
    
            const contract = new web3.eth.Contract(CONTACT_ABI, CONTACT_ADDRESS)
            await contract.methods.addModifier(modifierAddress).send({ from: account })
            alert(`${modifierAddress} 계정에 권한이 부여되었습니다.`)
            setModifierAddress("") // 입력 초기화
        }
    
        // onlyAuthorized 권한 제거 함수 (onlyOwner만 사용 가능)
        const removeModifier = async (modifierAddress) => {
            if (!isOwner) return alert("권한 제거 권한이 없습니다.")
            const confirmation = window.confirm("이 계정의 권한을 제거하시겠습니까?")
            if (!confirmation) return
    
            const contract = new web3.eth.Contract(CONTACT_ABI, CONTACT_ADDRESS)
            await contract.methods.removeModifier(modifierAddress).send({ from: account })
            alert(`${modifierAddress} 계정의 권한이 제거되었습니다.`)
            setModifierAddress("") // 입력 초기화
        }
    

    return (
        <div>
            <header className="app-header">
                <h1>DPP Gallery</h1>
            </header>

            <div className="welcome-section">
                <h2>Welcome!! {account}</h2>
                <div>Balance: {balance} ETH</div>
                <div className="user-status">
                    {isOwner ? "Owner" : isAuthorized ? "Client" : "Guest"}
                </div>
            </div>
            {isOwner && (
                <div className="create-section">
                    <h3>Granting and Removing Permissions</h3>
                    <form >
                    <input
                        type="text"
                        value={modifierAddress}
                        onChange={(e) => setModifierAddress(e.target.value)}
                        placeholder="Address"
                        required
                    />
                    </form>
                    <button  onClick={() => addModifier(modifierAddress)}>Add</button>
                    <button  onClick={() => removeModifier(modifierAddress)}>Remove</button>
                </div>
            )}
            {(isOwner || isAuthorized) && (
                <div className="create-section">
                    <h3>Create DPP</h3>
                    <form onSubmit={(e) => {
                        e.preventDefault()
                        createDPP(createForm.onnx, createForm.model, createForm.aasx, createForm.pt)
                    }}>
                        <input type="text" name="onnx" value={createForm.onnx} onChange={(e) => handleInputChange(e, setCreateForm)} placeholder="Product Name" required />
                        <input type="text" name="model" value={createForm.model} onChange={(e) => handleInputChange(e, setCreateForm)} placeholder="Raw Materials" required />
                        <input type="text" name="aasx" value={createForm.aasx} onChange={(e) => handleInputChange(e, setCreateForm)} placeholder="Regulation" required />
                        <input type="text" name="pt" value={createForm.pt} onChange={(e) => handleInputChange(e, setCreateForm)} placeholder="PT Download" required />
                        <button type="submit">Create DPP</button>
                    </form>
                </div>
            )}

            <div className="dpp-gallery">
                {renderDPPs()}
            </div>
            
            {/* 권한이 있는 사용자만 트랜잭션 로그 보기 가능 */}
            {(isOwner || isAuthorized) && (
                <div className="log-button-container">
                    <button onClick={fetchLogs}>View Transaction Logs</button>
                </div>
            )}

            {/* 로그 모달 */}
            {showLogs && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Transaction Logs</h3>
                        <button className="close-button" onClick={closeLogs}>Close</button>
                        <ul>
                            {logs.map((log, index) => (
                                <li key={index} className="log-entry">
                                    <p><strong>{log.timestamp.toLocaleString()}</strong></p>
                                    <p>{log.message}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    )
}

export default App
