let socket;
let localStream;
let peers = {};
let isMuted = false;
let username;
let roomId;

const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

function joinRoom() {
    username = document.getElementById('username').value.trim();
    roomId = document.getElementById('roomId').value.trim();
    
    if (!username || !roomId) {
        alert('请输入昵称和房间ID');
        return;
    }

    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('call-screen').classList.remove('hidden');
    document.getElementById('current-room').textContent = roomId;

    initializeSocket();
    initializeMedia();
}

function leaveRoom() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    
    Object.values(peers).forEach(peer => {
        if (peer.connection) {
            peer.connection.close();
        }
    });
    
    if (socket) {
        socket.disconnect();
    }
    
    document.getElementById('call-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('participants-grid').innerHTML = '';
    
    peers = {};
}

function initializeSocket() {
    socket = io();

    socket.on('connect', () => {
        socket.emit('join-room', { roomId, username });
    });

    socket.on('room-users', (users) => {
        users.forEach(user => {
            if (user.id !== socket.id) {
                createPeerConnection(user.id, user.username);
            }
        });
    });

    socket.on('user-joined', ({ userId, username }) => {
        createPeerConnection(userId, username);
        createOffer(userId);
    });

    socket.on('user-left', ({ userId, username }) => {
        removeParticipant(userId);
        if (peers[userId]) {
            peers[userId].connection.close();
            delete peers[userId];
        }
    });

    socket.on('offer', async ({ offer, senderId, username }) => {
        if (!peers[senderId]) {
            createPeerConnection(senderId, username);
        }
        
        try {
            await peers[senderId].connection.setRemoteDescription(offer);
            const answer = await peers[senderId].connection.createAnswer();
            await peers[senderId].connection.setLocalDescription(answer);
            
            socket.emit('answer', {
                answer,
                targetId: senderId
            });
        } catch (error) {
            console.error('处理offer时出错:', error);
        }
    });

    socket.on('answer', async ({ answer, senderId }) => {
        try {
            await peers[senderId].connection.setRemoteDescription(answer);
        } catch (error) {
            console.error('处理answer时出错:', error);
        }
    });

    socket.on('ice-candidate', async ({ candidate, senderId }) => {
        try {
            await peers[senderId].connection.addIceCandidate(candidate);
        } catch (error) {
            console.error('添加ICE候选时出错:', error);
        }
    });

    socket.on('user-muted', ({ userId, isMuted }) => {
        updateParticipantStatus(userId, isMuted);
    });
}

async function initializeMedia() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            },
            video: false 
        });
        
        addParticipant(socket.id, username, localStream);
    } catch (error) {
        console.error('获取媒体权限失败:', error);
        alert('无法访问麦克风，请检查权限设置');
    }
}

function createPeerConnection(userId, username) {
    const connection = new RTCPeerConnection(configuration);
    
    peers[userId] = {
        connection,
        username,
        stream: null
    };

    connection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                candidate: event.candidate,
                targetId: userId
            });
        }
    };

    connection.ontrack = (event) => {
        peers[userId].stream = event.streams[0];
        addParticipant(userId, username, event.streams[0]);
    };

    if (localStream) {
        localStream.getTracks().forEach(track => {
            connection.addTrack(track, localStream);
        });
    }
}

async function createOffer(userId) {
    try {
        const offer = await peers[userId].connection.createOffer();
        await peers[userId].connection.setLocalDescription(offer);
        
        socket.emit('offer', {
            offer,
            targetId: userId
        });
    } catch (error) {
        console.error('创建offer时出错:', error);
    }
}

function addParticipant(userId, username, stream) {
    const participantsGrid = document.getElementById('participants-grid');
    
    if (document.getElementById(`participant-${userId}`)) {
        return;
    }

    const participantDiv = document.createElement('div');
    participantDiv.className = 'participant';
    participantDiv.id = `participant-${userId}`;
    
    participantDiv.innerHTML = `
        <div class="participant-avatar">${username.charAt(0).toUpperCase()}</div>
        <div class="participant-name">${username}</div>
        <div class="participant-status">
            <span>${userId === socket.id ? '你' : '在线'}</span>
            <span id="mute-status-${userId}"></span>
        </div>
        <audio autoplay ${userId === socket.id ? 'muted' : ''}></audio>
    `;

    participantsGrid.appendChild(participantDiv);

    if (stream && userId !== socket.id) {
        const audio = participantDiv.querySelector('audio');
        audio.srcObject = stream;
    }
}

function removeParticipant(userId) {
    const participant = document.getElementById(`participant-${userId}`);
    if (participant) {
        participant.remove();
    }
}

function updateParticipantStatus(userId, isMuted) {
    const muteStatus = document.getElementById(`mute-status-${userId}`);
    if (muteStatus) {
        muteStatus.textContent = isMuted ? '🔇' : '🎤';
        muteStatus.classList.toggle('muted', isMuted);
    }
}

function toggleMute() {
    if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            isMuted = !audioTrack.enabled;
            
            const muteBtn = document.getElementById('mute-btn');
            const muteIcon = document.getElementById('mute-icon');
            
            if (isMuted) {
                muteIcon.textContent = '🔇';
                muteBtn.querySelector('span:last-child').textContent = '取消静音';
            } else {
                muteIcon.textContent = '🎤';
                muteBtn.querySelector('span:last-child').textContent = '静音';
            }
            
            socket.emit('mute-audio', { isMuted });
        }
    }
}

function shareRoom() {
    const url = `${window.location.origin}?room=${roomId}`;
    if (navigator.share) {
        navigator.share({
            title: '群语音通话',
            text: `加入我的语音房间: ${roomId}`,
            url: url
        });
    } else {
        navigator.clipboard.writeText(url);
        alert('房间链接已复制到剪贴板');
    }
}

// 处理URL参数
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
        document.getElementById('roomId').value = roomParam;
    }
});