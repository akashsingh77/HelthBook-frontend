import { useState } from 'react'

export default function ChatInput({ onSend, disabled = false }) {
	const [value, setValue] = useState('')
	const send = () => {
		const question = value.trim()
		if (!question || disabled) return
		onSend(question)
		setValue('')
	}

	return <div className="chat-input"><input value={value} disabled={disabled} onChange={event => setValue(event.target.value)} onKeyDown={event => event.key === 'Enter' && send()} placeholder={disabled ? 'Your AI doctor is thinking...' : 'Ask about your health...'} aria-label="Question for your AI doctor"/><button className="send" disabled={disabled || !value.trim()} onClick={send}>{disabled ? 'Thinking...' : 'Send ↑'}</button></div>
}
