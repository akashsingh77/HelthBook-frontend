import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { api } from '../services/api'
import './Chat.css'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const socketUrl = apiUrl.replace(/\/api\/?$/, '')

function otherUser(conversation, role) {
  return role === 'doctor' ? conversation.patient : conversation.doctor
}

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'HB'
}

function formatTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function Chat({ role }) {
  const [conversations, setConversations] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [messages, setMessages] = useState([])
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [typing, setTyping] = useState(false)
  const [otherOnline, setOtherOnline] = useState(false)
  const [socketConnected, setSocketConnected] = useState(false)
  const [error, setError] = useState('')
  const socketRef = useRef(null)
  const typingTimer = useRef(null)
  const bottomRef = useRef(null)
  const selected = conversations.find(conversation => conversation._id === selectedId)
  const other = selected && otherUser(selected, role)

  useEffect(() => {
    const socket = io(socketUrl, { auth: { token: localStorage.getItem('healthbook_token') } })
    socketRef.current = socket
    socket.on('connect', () => setSocketConnected(true))
    socket.on('disconnect', () => setSocketConnected(false))
    socket.on('connect_error', connectionError => setError(connectionError.message))
    socket.on('message:new', incoming => {
      if (incoming.conversation === selectedId) {
        setMessages(current => current.some(item => item._id === incoming._id) ? current : [...current, incoming])
        socket.emit('message:read', selectedId)
      }
      setConversations(current => current.map(item => item._id === incoming.conversation ? { ...item, lastMessage: incoming.content, lastMessageAt: incoming.createdAt, ...(item._id !== selectedId ? (role === 'doctor' ? { unreadForDoctor: (item.unreadForDoctor || 0) + 1 } : { unreadForPatient: (item.unreadForPatient || 0) + 1 }) : {}) } : item).sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0)))
    })
    socket.on('typing:update', data => { if (data.userId === other?._id) setTyping(data.typing) })
    socket.on('presence:update', data => { if (data.userId === other?._id) setOtherOnline(data.online) })
    socket.on('message:read', data => { if (data.userId !== other?._id) setMessages(current => current.map(item => item.sender?._id === data.userId ? { ...item, readAt: item.readAt || new Date().toISOString() } : item)) })
    return () => { socket.disconnect(); clearTimeout(typingTimer.current) }
  }, [selectedId, other?._id, role])

  useEffect(() => {
    Promise.all([
      api.get('/chat/conversations'),
      api.get(role === 'doctor' ? '/patients' : '/doctors')
    ]).then(([conversationData, people]) => {
      setConversations(conversationData)
      setParticipants(role === 'doctor' ? people : people.map(item => item.user).filter(Boolean))
      if (conversationData[0]) { setMessagesLoading(true); setSelectedId(conversationData[0]._id) }
    }).catch(loadError => setError(loadError.message)).finally(() => setLoading(false))
  }, [role])

  useEffect(() => {
    if (!selectedId) return
    api.get(`/chat/conversations/${selectedId}/messages`)
      .then(data => { setMessages(data.messages); socketRef.current?.emit('conversation:join', selectedId); socketRef.current?.emit('message:read', selectedId) })
      .catch(loadError => setError(loadError.message))
      .finally(() => setMessagesLoading(false))
  }, [selectedId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typing])

  const beginConversation = async event => {
    const userId = event.target.value
    if (!userId) return
    setError('')
    try {
      const conversation = await api.post('/chat/conversations', { userId })
      setConversations(current => current.some(item => item._id === conversation._id) ? current : [conversation, ...current])
      setMessagesLoading(true)
      setSelectedId(conversation._id)
    } catch (conversationError) { setError(conversationError.message) }
    event.target.value = ''
  }

  const selectConversation = id => { setError(''); setMessagesLoading(true); setSelectedId(id) }

  const sendMessage = event => {
    event.preventDefault()
    const content = message.trim()
    if (!content || !selectedId || !socketRef.current?.connected) return
    socketRef.current.emit('message:send', { conversationId: selectedId, content }, response => { if (!response.ok) setError(response.message) })
    setMessage('')
    socketRef.current.emit('typing:update', { conversationId: selectedId, typing: false })
  }

  const updateTyping = event => {
    setMessage(event.target.value)
    if (!selectedId || !socketRef.current?.connected) return
    socketRef.current.emit('typing:update', { conversationId: selectedId, typing: true })
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => socketRef.current?.emit('typing:update', { conversationId: selectedId, typing: false }), 900)
  }

  if (loading) return <section className="page chat-page"><div className="chat-loading">Loading conversations...</div></section>

  return <section className="page chat-page">
    <div className="page-heading chat-heading"><div><p className="eyebrow">SECURE CARE</p><h1>Messages</h1><p>Connect directly with your care team.</p></div><select className="new-chat" onChange={beginConversation} defaultValue=""><option value="">+ New conversation</option>{participants.map(person => <option value={person._id} key={person._id}>{person.name} · {role === 'doctor' ? 'Patient' : 'Doctor'}</option>)}</select></div>
    {error && <div className="chat-alert" role="alert">{error}</div>}
    <div className="chat-window">
      <aside className="conversation-panel"><div className="conversation-header"><strong>Conversations</strong><span>{conversations.length}</span></div><div className="conversation-list">{conversations.length ? conversations.map(conversation => { const person = otherUser(conversation, role); const unread = role === 'doctor' ? conversation.unreadForDoctor : conversation.unreadForPatient; return <button className={`conversation-item ${conversation._id === selectedId ? 'active' : ''}`} key={conversation._id} onClick={() => selectConversation(conversation._id)}><span className="chat-avatar">{initials(person?.name)}</span><span className="conversation-copy"><strong>{person?.name || 'Unknown user'}</strong><small>{conversation.lastMessage || 'Start a conversation'}</small></span><span className="conversation-meta"><small>{formatTime(conversation.lastMessageAt)}</small>{unread > 0 && <b>{unread}</b>}</span></button> }) : <p className="chat-empty">No conversations yet. Start one above.</p>}</div></aside>
      <main className="message-panel">{selected && other ? <><header className="message-header"><span className="chat-avatar large">{initials(other.name)}</span><div><h2>{other.name}</h2><p className={otherOnline ? 'online' : ''}>{otherOnline ? 'Online now' : 'Offline'}</p></div></header><div className="message-list">{messagesLoading ? <p className="chat-empty">Loading messages...</p> : messages.length ? messages.map(item => { const mine = item.sender?._id !== other._id; return <div className={`message-row ${mine ? 'mine' : ''}`} key={item._id}><div className="message-bubble"><p>{item.content}</p><small>{formatTime(item.createdAt)} {mine && <span className={item.readAt ? 'read' : ''}>{item.readAt ? '✓✓' : '✓'}</span>}</small></div></div> }) : <div className="empty-chat"><span>✦</span><h3>Start the conversation</h3><p>Send a message to {other.name}.</p></div>}{typing && <p className="typing-indicator">{other.name} is typing...</p>}<div ref={bottomRef} /></div><form className="message-composer" onSubmit={sendMessage}><input value={message} onChange={updateTyping} placeholder="Write a message..." maxLength="4000" aria-label="Message" /><button className="send-button" type="submit" disabled={!message.trim() || !socketConnected} aria-label="Send message">➤</button></form></> : <div className="empty-chat"><span>✦</span><h3>Your secure inbox</h3><p>Select a conversation or start a new one.</p></div>}</main>
    </div>
  </section>
}
