import { useEffect, useState } from 'react'
import ChatMessage from '../../components/ChatMessage'
import ChatInput from '../../components/ChatInput'
import { api } from '../../services/api'

const welcomeMessage = { text: 'Hello! I am your HealthBook AI doctor. Ask me about general health information, symptoms, medicines, or preparing for an appointment.', user: false }

export default function AIAssistant() {
	const [messages, setMessages] = useState([welcomeMessage])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	useEffect(() => {
		api.get('/ai/history')
			.then(data => {
				if (data.messages?.length) setMessages(data.messages.map(message => ({ text: message.content, user: message.role === 'user' })))
			})
			.catch(() => setError('Sign in to use your private AI doctor chat.'))
	}, [])

	const send = async text => {
		setError('')
		setMessages(current => [...current, { text, user: true }])
		setLoading(true)
		try {
			const data = await api.post('/ai/chat', { message: text })
			if (data.reply) setMessages(current => [...current, { text: data.reply, user: false }])
		} catch (requestError) {
			setError(requestError.message || 'Your AI doctor could not answer right now.')
		} finally {
			setLoading(false)
		}
	}

	return <section className="page chat-layout"><div className="chat-head"><p className="eyebrow">PRIVATE & SECURE</p><h2>AI health doctor</h2><p>Ask questions and get general health guidance. For emergencies, contact local emergency services.</p></div><div className="messages">{messages.map((message, index) => <ChatMessage key={index} user={message.user}>{message.text}</ChatMessage>)}{loading && <ChatMessage>Thinking...</ChatMessage>}</div>{error && <p className="chat-error" role="alert">{error}</p>}<ChatInput onSend={send} disabled={loading} /></section>
}
