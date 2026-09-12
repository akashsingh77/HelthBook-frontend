import { useEffect, useState } from 'react'
import { api } from '../../services/api'

const formatDate = date => new Date(date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })

export default function MyAppointments({ onNavigate }) {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/appointments/patient')
      .then(data => setAppointments(data.appointments || []))
      .catch(requestError => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [])

  const cancel = async id => {
    try {
      await api.patch(`/appointments/${id}/cancel`)
      setAppointments(current => current.map(appointment => appointment._id === id ? { ...appointment, status: 'Cancelled' } : appointment))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return <section className="page">
    <div className="page-heading"><div><p className="eyebrow">YOUR SCHEDULE</p><h1>My appointments</h1><p>Keep track of upcoming visits and your consultation history.</p></div><button className="btn btn-primary" onClick={() => onNavigate('book appointment')}>+ New appointment</button></div>
    {error && <p className="form-error">{error}</p>}
    {loading ? <div className="empty-state"><h2>Loading appointments...</h2></div> : appointments.length === 0 ? <div className="empty-state"><span>◷</span><h2>No appointments yet</h2><p>Book your first visit with a trusted doctor.</p><button className="btn btn-primary" onClick={() => onNavigate('book appointment')}>Book an appointment</button></div> : <div className="card table-card"><table className="appointments-table"><thead><tr><th>DOCTOR</th><th>DATE & TIME</th><th>TYPE</th><th>STATUS</th><th></th></tr></thead><tbody>{appointments.map(appointment => <tr key={appointment._id}><td>{appointment.doctor?.name || 'Doctor'}</td><td>{formatDate(appointment.date)}</td><td>{appointment.type}</td><td><span className={`badge ${appointment.status.toLowerCase()}`}>{appointment.status}</span></td><td>{['Pending', 'Confirmed'].includes(appointment.status) && <button className="text-link" onClick={() => cancel(appointment._id)}>Cancel</button>}</td></tr>)}</tbody></table></div>}
  </section>
}