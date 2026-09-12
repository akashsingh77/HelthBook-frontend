import { useEffect, useMemo, useState } from 'react'
import { api } from '../../services/api'
import './Appointments.css'

const filters = ['All', 'Pending', 'Accepted', 'Completed', 'Cancelled']
const displayStatus = status => status === 'Confirmed' ? 'Accepted' : status
const formatDate = date => new Date(date).toLocaleDateString([], { dateStyle: 'medium' })
const formatTime = date => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

export default function DoctorAppointments() {
	const [appointments, setAppointments] = useState([])
	const [filter, setFilter] = useState('All')
	const [loading, setLoading] = useState(true)
	const [updatingId, setUpdatingId] = useState('')
	const [error, setError] = useState('')
	const [notice, setNotice] = useState('')

	const loadAppointments = () => {
		setLoading(true)
		setError('')
		api.get('/appointments/doctor')
			.then(data => setAppointments(data.appointments || []))
			.catch(requestError => setError(requestError.message))
			.finally(() => setLoading(false))
	}

	useEffect(() => {
		api.get('/appointments/doctor')
			.then(data => setAppointments(data.appointments || []))
			.catch(requestError => setError(requestError.message))
			.finally(() => setLoading(false))
	}, [])

	const visibleAppointments = useMemo(() => appointments.filter(appointment => filter === 'All' || displayStatus(appointment.status) === filter), [appointments, filter])

	const updateStatus = async (id, status) => {
		setUpdatingId(id)
		setError('')
		setNotice('')
		try {
			const data = await api.patch(`/appointments/${id}/status`, { status })
			setAppointments(current => current.map(appointment => appointment._id === id ? { ...appointment, ...data.appointment } : appointment))
			setNotice(`Appointment ${displayStatus(status).toLowerCase()}.`)
		} catch (requestError) { setError(requestError.message) }
		finally { setUpdatingId('') }
	}

	const counts = filters.reduce((result, item) => ({ ...result, [item]: item === 'All' ? appointments.length : appointments.filter(appointment => displayStatus(appointment.status) === item).length }), {})

	return <section className="page doctor-appointments-page">
		<div className="page-heading"><div><p className="eyebrow">YOUR CLINIC</p><h1>Appointments</h1><p>Review and manage visits booked with you.</p></div><button className="btn secondary refresh-button" onClick={loadAppointments} disabled={loading}>↻ Refresh</button></div>
		{error && <p className="form-error appointment-message" role="alert">{error}</p>}{notice && <p className="form-success appointment-message" role="status">{notice}</p>}
		<div className="appointment-filters" role="tablist" aria-label="Appointment status filters">{filters.map(item => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)} role="tab" aria-selected={filter === item}>{item}<span>{counts[item]}</span></button>)}</div>
		{loading ? <div className="empty-state"><h2>Loading appointments...</h2></div> : visibleAppointments.length === 0 ? <div className="empty-state"><span>◷</span><h2>No {filter === 'All' ? '' : filter.toLowerCase() + ' '}appointments</h2><p>Appointments assigned to your account will appear here.</p></div> : <div className="card doctor-appointment-table"><table className="appointments-table"><thead><tr><th>PATIENT</th><th>DATE & TIME</th><th>REASON</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{visibleAppointments.map(appointment => <tr key={appointment._id}><td><strong>{appointment.patient?.name || 'Patient'}</strong><small>{appointment.patient?.email || ''}</small></td><td><strong>{formatDate(appointment.date)}</strong><small>{formatTime(appointment.date)}</small></td><td className="reason-cell">{appointment.reason || 'No reason provided'}</td><td><span className={`badge ${appointment.status.toLowerCase()}`}>{displayStatus(appointment.status)}</span></td><td className="appointment-actions">{appointment.status === 'Pending' && <><button className="action-button accept" disabled={updatingId === appointment._id} onClick={() => updateStatus(appointment._id, 'Confirmed')}>Accept</button><button className="action-button reject" disabled={updatingId === appointment._id} onClick={() => updateStatus(appointment._id, 'Rejected')}>Reject</button></>}{appointment.status === 'Confirmed' && <button className="action-button complete" disabled={updatingId === appointment._id} onClick={() => updateStatus(appointment._id, 'Completed')}>Complete</button>}{['Completed', 'Cancelled', 'Rejected'].includes(appointment.status) && <span className="action-dash">-</span>}</td></tr>)}</tbody></table></div>}
	</section>
}
