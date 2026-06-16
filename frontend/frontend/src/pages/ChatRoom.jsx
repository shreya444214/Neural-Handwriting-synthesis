import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { io } from 'socket.io-client';
import {
  Send, Plus, Users, User, Search, MessageSquare,
  X, FileText, Share2, Hash
} from 'lucide-react';

const SOCKET_URL = 'http://127.0.0.1:5000';

export default function ChatRoom() {
  const { user, api, addToast } = useAuth();
  const [socket, setSocket] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [typing, setTyping] = useState('');
  const [userFiles, setUserFiles] = useState([]);
  const [showShareFile, setShowShareFile] = useState(false);
  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Socket Connection
  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    setSocket(s);

    s.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    s.on('user_typing', (data) => {
      setTyping(data.user_name + ' is typing...');
    });

    s.on('user_stop_typing', () => {
      setTyping('');
    });

    return () => s.disconnect();
  }, []);

  // Load rooms
  useEffect(() => { fetchRooms(); }, []);

  // Scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchRooms = async () => {
    try {
      const res = await api.get('/chat/rooms');
      setRooms(res.data.rooms);
    } catch {}
  };

  const openRoom = async (room) => {
    setActiveRoom(room);
    try {
      const res = await api.get(`/chat/rooms/${room.id}/messages`);
      setMessages(res.data.messages);
    } catch {}
    socket?.emit('join_room', { room_id: room.id, user_id: user.id });
  };

  const sendMessage = () => {
    if (!input.trim() || !activeRoom) return;
    socket?.emit('send_message', {
      room_id: activeRoom.id,
      sender_id: user.id,
      content: input.trim(),
      message_type: 'text',
    });
    setInput('');
    socket?.emit('stop_typing', { room_id: activeRoom.id });
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (!activeRoom) return;
    socket?.emit('typing', { room_id: activeRoom.id, user_name: user.name });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit('stop_typing', { room_id: activeRoom.id });
    }, 2000);
  };

  const searchUsers = async (q) => {
    setSearchQuery(q);
    if (q.length < 1) { setSearchResults([]); return; }
    try {
      const res = await api.get(`/chat/users?q=${q}`);
      setSearchResults(res.data.users);
    } catch {}
  };

  const startChat = async (otherUser) => {
    try {
      const res = await api.post('/chat/rooms', {
        type: 'individual',
        members: [otherUser.id],
      });
      setShowNewChat(false);
      setSearchQuery('');
      setSearchResults([]);
      fetchRooms();
      openRoom(res.data.room);
      addToast(`Chat started with ${otherUser.name}`, 'success');
    } catch {}
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      addToast('Enter a group name', 'warning');
      return;
    }
    if (selectedMembers.length === 0) {
      addToast('Add at least one member', 'warning');
      return;
    }
    try {
      const res = await api.post('/chat/rooms', {
        type: 'group',
        name: groupName,
        members: selectedMembers.map(m => m.id),
      });
      setShowNewGroup(false);
      setGroupName('');
      setSelectedMembers([]);
      fetchRooms();
      openRoom(res.data.room);
      addToast('Group created!', 'success');
    } catch {}
  };

  const shareFile = async (fileId) => {
    if (!activeRoom) return;
    try {
      await api.post(`/chat/rooms/${activeRoom.id}/share-file`, { file_id: fileId });
      setShowShareFile(false);
      addToast('File shared!', 'success');
    } catch {
      addToast('Failed to share file', 'error');
    }
  };

  const loadUserFiles = async () => {
    try {
      const res = await api.get('/files');
      setUserFiles(res.data.files);
      setShowShareFile(true);
    } catch {}
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    const utcIso = iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z';
    return new Date(utcIso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <div style={styles.layout}>
        <Sidebar />
        <div style={styles.chatLayout}>
          {/* Rooms Sidebar */}
          <div style={styles.roomsSidebar}>
            <div style={styles.roomsHeader}>
              <h3 style={styles.roomsTitle}>Chats</h3>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setShowNewChat(true)} style={styles.iconBtn} title="New Chat">
                  <User size={16} />
                </button>
                <button onClick={() => setShowNewGroup(true)} style={styles.iconBtn} title="New Group">
                  <Users size={16} />
                </button>
              </div>
            </div>

            {/* New Chat Search */}
            {showNewChat && (
              <div style={styles.searchPanel}>
                <div style={styles.searchHeader}>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>New Chat</span>
                  <button onClick={() => setShowNewChat(false)} style={styles.closeSmall}><X size={14} /></button>
                </div>
                <input
                  value={searchQuery}
                  onChange={(e) => searchUsers(e.target.value)}
                  placeholder="Search users..."
                  className="input-field"
                  style={{ fontSize: '0.85rem' }}
                />
                {searchResults.map(u => (
                  <button key={u.id} onClick={() => startChat(u)} style={styles.userBtn}>
                    <div style={styles.userAvatar}>{u.name.charAt(0)}</div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>{u.name}</p>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>@{u.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* New Group */}
            {showNewGroup && (
              <div style={styles.searchPanel}>
                <div style={styles.searchHeader}>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>New Group</span>
                  <button onClick={() => setShowNewGroup(false)} style={styles.closeSmall}><X size={14} /></button>
                </div>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name"
                  className="input-field"
                  style={{ fontSize: '0.85rem', marginBottom: '8px' }}
                />
                <input
                  value={searchQuery}
                  onChange={(e) => searchUsers(e.target.value)}
                  placeholder="Add members..."
                  className="input-field"
                  style={{ fontSize: '0.85rem' }}
                />
                {selectedMembers.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                    {selectedMembers.map(m => (
                      <span key={m.id} className="badge badge-info" style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedMembers(prev => prev.filter(p => p.id !== m.id))}>
                        {m.name} ×
                      </span>
                    ))}
                  </div>
                )}
                {searchResults.map(u => (
                  <button key={u.id} onClick={() => {
                    if (!selectedMembers.find(m => m.id === u.id)) {
                      setSelectedMembers(prev => [...prev, u]);
                    }
                  }} style={styles.userBtn}>
                    <div style={styles.userAvatar}>{u.name.charAt(0)}</div>
                    <span style={{ fontSize: '0.85rem' }}>{u.name}</span>
                  </button>
                ))}
                <button onClick={createGroup} className="btn btn-primary btn-sm btn-full" style={{ marginTop: '8px' }}>
                  Create Group
                </button>
              </div>
            )}

            {/* Room List */}
            <div style={styles.roomsList}>
              {rooms.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                  <MessageSquare size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
                  <p style={{ fontSize: '0.85rem' }}>No chats yet</p>
                  <p style={{ fontSize: '0.78rem' }}>Start a new conversation!</p>
                </div>
              ) : (
                rooms.map(room => (
                  <button
                    key={room.id}
                    onClick={() => openRoom(room)}
                    style={{
                      ...styles.roomItem,
                      background: activeRoom?.id === room.id ? 'rgba(255,215,0,0.06)' : 'transparent',
                      borderLeft: activeRoom?.id === room.id ? '3px solid var(--accent-gold)' : '3px solid transparent',
                    }}
                  >
                    <div style={styles.roomAvatar}>
                      {room.room_type === 'group' ? <Hash size={16} /> : (room.display_name?.charAt(0) || '?')}
                    </div>
                    <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.88rem' }}>
                        {room.display_name || room.name || 'Chat'}
                      </p>
                      {room.last_message && (
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {room.last_message.content}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div style={styles.chatArea}>
            {!activeRoom ? (
              <div style={styles.emptyChat}>
                <MessageSquare size={56} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '16px' }} />
                <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>Select a conversation</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  Choose a chat from the sidebar or start a new one
                </p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div style={styles.chatHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={styles.roomAvatar}>
                      {activeRoom.room_type === 'group' ? <Hash size={16} /> : (activeRoom.display_name?.charAt(0) || '?')}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700 }}>{activeRoom.display_name || activeRoom.name}</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--accent-green)' }}>
                        {activeRoom.room_type === 'group' ? `${activeRoom.members?.length || 0} members` : 'Online'}
                      </p>
                    </div>
                  </div>
                  <button onClick={loadUserFiles} className="btn btn-secondary btn-sm">
                    <Share2 size={14} /> Share File
                  </button>
                </div>

                {/* Messages */}
                <div style={styles.messagesArea}>
                  {messages.map((msg, i) => {
                    const isMine = msg.sender_id === user.id;
                    return (
                      <div key={i} style={{
                        ...styles.msgRow,
                        justifyContent: isMine ? 'flex-end' : 'flex-start',
                      }}>
                        {!isMine && (
                          <div style={styles.msgAvatar}>{msg.sender_name?.charAt(0) || '?'}</div>
                        )}
                        <div style={{
                          ...styles.msgBubble,
                          ...(isMine ? styles.myBubble : styles.theirBubble),
                        }}>
                          {!isMine && activeRoom.room_type === 'group' && (
                            <p style={styles.senderName}>{msg.sender_name}</p>
                          )}
                          {msg.message_type === 'file' ? (
                            <div style={styles.fileMsg}>
                              <FileText size={16} />
                              <span>{msg.file_name || 'Shared file'}</span>
                            </div>
                          ) : (
                            <p style={{ margin: 0 }}>{msg.content}</p>
                          )}
                          <span style={styles.msgTime}>{formatTime(msg.created_at)}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* Typing indicator */}
                {typing && (
                  <div style={styles.typingBar}>
                    <span style={{ animation: 'pulse 1.5s infinite' }}>{typing}</span>
                  </div>
                )}

                {/* Input */}
                <div style={styles.inputBar}>
                  <input
                    value={input}
                    onChange={handleTyping}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="input-field"
                    style={{ borderRadius: 'var(--radius-full)' }}
                  />
                  <button onClick={sendMessage} style={styles.sendBtn}>
                    <Send size={18} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Share File Modal */}
      {showShareFile && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontWeight: 700 }}>Share File</h3>
              <button onClick={() => setShowShareFile(false)} style={styles.closeSmall}><X size={18} /></button>
            </div>
            {userFiles.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No files to share</p>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {userFiles.map(f => (
                  <button key={f.id} onClick={() => shareFile(f.id)} style={styles.fileItem}>
                    <FileText size={16} style={{ color: 'var(--accent-blue)' }} />
                    <span style={{ flex: 1 }}>{f.original_name}</span>
                    <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{f.file_type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  layout: { display: 'flex', minHeight: 'calc(100vh - var(--nav-height))' },
  chatLayout: { flex: 1, display: 'flex', overflow: 'hidden' },
  roomsSidebar: {
    width: '320px', borderRight: '1px solid var(--border-subtle)',
    display: 'flex', flexDirection: 'column', background: 'rgba(8,10,18,0.5)',
  },
  roomsHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)',
  },
  roomsTitle: { margin: 0, fontSize: '1.1rem', fontWeight: 700 },
  iconBtn: {
    background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--text-secondary)',
    borderRadius: 'var(--radius-sm)', width: '32px', height: '32px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },
  searchPanel: {
    padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)',
    display: 'flex', flexDirection: 'column', gap: '8px',
  },
  searchHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeSmall: {
    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px',
  },
  userBtn: {
    display: 'flex', alignItems: 'center', gap: '10px', padding: '8px',
    background: 'none', border: 'none', color: 'var(--text-primary)',
    borderRadius: 'var(--radius-sm)', cursor: 'pointer', width: '100%',
    transition: 'background 0.15s',
  },
  userAvatar: {
    width: '32px', height: '32px', borderRadius: '50%',
    background: 'var(--gradient-blue)', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: '0.78rem', color: 'white', flexShrink: 0,
  },
  roomsList: { flex: 1, overflowY: 'auto' },
  roomItem: {
    display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
    width: '100%', border: 'none', color: 'var(--text-primary)',
    cursor: 'pointer', transition: 'background 0.15s',
  },
  roomAvatar: {
    width: '40px', height: '40px', borderRadius: '50%',
    background: 'var(--gradient-blue)', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, color: 'white', flexShrink: 0,
  },
  chatArea: {
    flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(5,7,10,0.5)',
  },
  emptyChat: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
  },
  chatHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)',
    background: 'rgba(0,0,0,0.2)',
  },
  messagesArea: {
    flex: 1, overflowY: 'auto', padding: '20px',
    display: 'flex', flexDirection: 'column', gap: '10px',
  },
  msgRow: { display: 'flex', gap: '8px', alignItems: 'flex-end' },
  msgAvatar: {
    width: '28px', height: '28px', borderRadius: '50%',
    background: 'var(--gradient-blue)', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: '0.7rem', color: 'white', flexShrink: 0,
  },
  msgBubble: {
    maxWidth: '65%', padding: '10px 14px', borderRadius: '14px',
    fontSize: '0.88rem', lineHeight: 1.5, position: 'relative',
  },
  myBubble: {
    background: 'rgba(99,140,255,0.2)', borderBottomRightRadius: '4px',
  },
  theirBubble: {
    background: 'rgba(255,255,255,0.06)', borderBottomLeftRadius: '4px',
  },
  senderName: {
    margin: '0 0 4px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-gold)',
  },
  fileMsg: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '6px 10px', background: 'rgba(255,255,255,0.06)',
    borderRadius: 'var(--radius-sm)',
  },
  msgTime: {
    display: 'block', textAlign: 'right', fontSize: '0.65rem',
    color: 'var(--text-muted)', marginTop: '4px',
  },
  typingBar: {
    padding: '4px 20px', fontSize: '0.78rem', color: 'var(--text-muted)',
  },
  inputBar: {
    display: 'flex', gap: '10px', padding: '14px 20px',
    borderTop: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)',
  },
  sendBtn: {
    width: '44px', height: '44px', borderRadius: '50%',
    background: 'var(--gradient-gold)', border: 'none', color: '#0a0a0a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0,
  },
  modal: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
  },
  modalContent: {
    width: '400px', maxWidth: '90%', background: 'var(--bg-card)',
    border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)',
  },
  fileItem: {
    display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px',
    width: '100%', background: 'none', border: 'none', color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer',
    fontSize: '0.88rem', textAlign: 'left',
  },
};
