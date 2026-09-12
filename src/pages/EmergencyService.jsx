import { useEffect, useState } from 'react'
import { api } from '../services/api'
import './EmergencyService.css'

const emptyLocation = { latitude: null, longitude: null, accuracy: null }

function formatDate(value) {
  return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

export default function EmergencyService({ role = 'patient' }) {
  const isPatient = role === 'patient'
  const [requests, setRequests] = useState([])
  const [profile, setProfile] = useState(null)
  const [location, setLocation] = useState(emptyLocation)
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [locating, setLocating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [form, setForm] = useState({ assistanceType: 'Ambulance', description: '', contactName: '', contactPhone: '' })

  const loadRequests = () => api.get('/emergency-requests').then(data => setRequests(data.requests || []))

  useEffect(() => {
    Promise.all([loadRequests(), isPatient ? api.get('/auth/me').then(data => setProfile(data.user)) : Promise.resolve()])
      .catch(error => setMessage({ type: 'error', text: error.message }))
      .finally(() => setLoading(false))
    if (!isPatient) {
      const refreshTimer = window.setInterval(() => loadRequests().catch(() => {}), 15000)
      return () => window.clearInterval(refreshTimer)
    }
  }, [isPatient])

  const findLocation = () => {
    if (!navigator.geolocation) return setMessage({ type: 'error', text: 'Location is not supported by this browser.' })
    setLocating(true)
    setMessage({ type: '', text: '' })
    navigator.geolocation.getCurrentPosition(async position => {
      const nextLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy }
      setLocation(nextLocation)
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&dedupe=1&q=hospital&lat=${nextLocation.latitude}&lon=${nextLocation.longitude}`)
        setHospitals(await response.json())
        setMessage({ type: 'success', text: 'Location shared for this session. Nearby care centers loaded.' })
      } catch { setMessage({ type: 'success', text: 'Location shared for this session.' }) }
      finally { setLocating(false) }
    }, () => { setLocating(false); setMessage({ type: 'error', text: 'Location permission is needed to request assistance.' }) }, { enableHighAccuracy: true, timeout: 10000 })
  }

  const requestAssistance = async event => {
    event.preventDefault()
    if (location.latitude === null || location.longitude === null) return setMessage({ type: 'error', text: 'Share your current location before requesting assistance.' })
    setSubmitting(true)
    setMessage({ type: '', text: '' })
    try {
      await api.post('/emergency-requests', { assistanceType: form.assistanceType, description: form.description, emergencyContact: { name: form.contactName, phone: form.contactPhone }, location })
      setForm({ assistanceType: 'Ambulance', description: '', contactName: '', contactPhone: '' })
      await loadRequests()
      setMessage({ type: 'success', text: 'Emergency request sent. Stay on the line and follow dispatcher instructions.' })
    } catch (error) { setMessage({ type: 'error', text: error.message }) }
    finally { setSubmitting(false) }
  }

  const updateStatus = async (id, status) => {
    try { const data = await api.patch(`/emergency-requests/${id}/status`, { status }); setRequests(current => current.map(request => request._id === id ? data.request : request)) }
    catch (error) { setMessage({ type: 'error', text: error.message }) }
  }

  if (loading) return <section className="page emergency-page"><p className="emergency-loading">Loading emergency service...</p></section>

  return <section className="page emergency-page">
    <div className="emergency-heading page-heading"><div><p className="eyebrow">24/7 EMERGENCY SUPPORT</p><h1>Emergency service</h1><p>Get urgent help, share your location, and keep essential information close at hand.</p></div><a className="emergency-call" href="tel:911">☎ Call 911</a></div>
    {message.text && <div className={`emergency-alert ${message.type}`} role="status">{message.text}</div>}
    {isPatient ? <>
      <div className="emergency-grid">
        <article className="sos-panel"><div><span className="sos-pulse">SOS</span><div><p className="section-kicker">NEED HELP NOW?</p><h2>Request emergency assistance</h2><p>Share your location so our care team can respond quickly.</p></div></div><button className="sos-button" onClick={() => document.getElementById('assistance-form').scrollIntoView({ behavior: 'smooth' })}>Request help now <span>→</span></button></article>
        <article className="emergency-card"><p className="section-kicker">YOUR EMERGENCY INFO</p><h2>{profile?.name || 'Patient information'}</h2><dl><div><dt>Phone</dt><dd>{profile?.phone || 'Not added'}</dd></div><div><dt>Blood type</dt><dd>Not provided</dd></div><div><dt>Date of birth</dt><dd>{profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not added'}</dd></div></dl><p className="card-note">Keep your profile updated so responders have the right information.</p></article>
      </div>
      <div className="emergency-content-grid">
        <form id="assistance-form" className="card emergency-form" onSubmit={requestAssistance}><div className="card-heading"><div><p className="section-kicker">DISPATCH REQUEST</p><h2>Request assistance</h2></div><span className="secure-mark">✓</span></div><label>Help needed<select value={form.assistanceType} onChange={event => setForm({ ...form, assistanceType: event.target.value })}><option>Ambulance</option><option>Medical assistance</option><option>Emergency transport</option></select></label><label>What is happening?<textarea rows="3" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="Briefly describe the emergency" /></label><div className="emergency-form-grid"><label>Contact name<input value={form.contactName} onChange={event => setForm({ ...form, contactName: event.target.value })} placeholder="Optional" /></label><label>Contact phone<input type="tel" value={form.contactPhone} onChange={event => setForm({ ...form, contactPhone: event.target.value })} placeholder="Optional" /></label></div><div className={`location-status ${location.latitude ? 'ready' : ''}`}><span>⌖</span><div><strong>{location.latitude ? 'Location ready to share' : 'Location not shared'}</strong><small>{location.latitude ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Permission is requested only when you choose.'}</small></div><button type="button" onClick={findLocation} disabled={locating}>{locating ? 'Locating...' : location.latitude ? 'Update' : 'Share location'}</button></div><button className="btn primary emergency-submit" disabled={submitting}>{submitting ? 'Sending request...' : 'Send emergency request'}</button></form>
        <aside className="emergency-side"><div className="card contact-card"><p className="section-kicker">QUICK CONTACTS</p><h2>Talk to someone</h2><a href="tel:911"><span>☎</span><div><strong>Emergency services</strong><small>911 · Immediate response</small></div><b>→</b></a><a href={`tel:${profile?.phone || ''}`}><span>♧</span><div><strong>My emergency contact</strong><small>{profile?.phone || 'Add a contact in Profile'}</small></div><b>→</b></a></div><div className="card hospital-card"><div className="card-heading"><div><p className="section-kicker">NEARBY CARE</p><h2>Hospitals & centers</h2></div><button className="text-button" onClick={findLocation}>{locating ? '...' : 'Refresh'}</button></div>{hospitals.length ? hospitals.map(hospital => <a className="hospital-row" href={`https://www.google.com/maps/search/?api=1&query=${hospital.lat},${hospital.lon}`} target="_blank" rel="noreferrer" key={hospital.place_id}><span>＋</span><div><strong>{hospital.display_name.split(',')[0]}</strong><small>{hospital.display_name.split(',').slice(1, 3).join(',')}</small></div><b>↗</b></a>) : <p className="empty-state">Share your location to see nearby hospitals.</p>}</div></aside>
      </div>
      <RequestList requests={requests} patient />
    </> : <><div className="operations-banner"><div><p className="section-kicker">RESPONSE CENTER</p><h2>Emergency requests</h2><p>Review active requests and coordinate a fast response.</p></div><span>{requests.filter(request => request.status === 'Pending').length} pending</span></div><RequestList requests={requests} onStatusChange={updateStatus} /></>}
  </section>
}

function RequestList({ requests, patient, onStatusChange }) {
  return <div className="request-section"><div className="section-title"><h2>{patient ? 'My emergency requests' : 'Live response queue'}</h2><span>{requests.length} total</span></div>{requests.length ? <div className="request-list">{requests.map(request => <article className="request-row" key={request._id}><div className="request-icon">{request.status === 'Resolved' ? '✓' : '!'}</div><div className="request-main"><div className="request-title"><h3>{patient ? request.assistanceType : request.patient?.name || 'Patient'} </h3><span className={`status ${request.status.toLowerCase()}`}>{request.status}</span></div><p>{request.description || 'No description provided.'}</p><small>{formatDate(request.createdAt)} · {request.location.latitude.toFixed(4)}, {request.location.longitude.toFixed(4)}</small></div>{onStatusChange && <div className="request-actions">{request.status === 'Pending' && <button className="btn secondary" onClick={() => onStatusChange(request._id, 'Accepted')}>Accept</button>}{request.status === 'Accepted' && <button className="btn primary" onClick={() => onStatusChange(request._id, 'Resolved')}>Resolve</button>}</div>}</article>)}</div> : <div className="card empty-requests">No emergency requests yet.</div>}</div>
}