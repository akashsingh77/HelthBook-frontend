import { useEffect, useMemo, useState } from 'react'
import { api } from '../../services/api'
import './Patients.css'

const patientStatus = patient => {
	const latest = patient.appointments?.[0]?.status
	return latest === 'Confirmed' ? 'Accepted' : latest || 'Pending'
}
const age = date => {
	if (!date) return 'Not provided'
	const birthDate = new Date(date)
	const today = new Date()
	let years = today.getFullYear() - birthDate.getFullYear()
	if (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())) years -= 1
	return `${years} years`
}
const dateTime = date => new Date(date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })

export default function Patients() {
	const [patients, setPatients] = useState([])
	const [selectedId, setSelectedId] = useState('')
	const [details, setDetails] = useState(null)
	const [search, setSearch] = useState('')
	const [filter, setFilter] = useState('All')
	const [loading, setLoading] = useState(true)
	const [detailsLoading, setDetailsLoading] = useState(false)
	const [error, setError] = useState('')

	useEffect(() => {
		api.get('/patients/doctor')
			.then(data => { setPatients(data); if (data[0]) setSelectedId(data[0].patient._id) })
			.catch(requestError => setError(requestError.message))
			.finally(() => setLoading(false))
	}, [])

	useEffect(() => {
		if (!selectedId) return
		api.get(`/patients/doctor/${selectedId}`)
			.then(setDetails)
			.catch(requestError => setError(requestError.message))
			.finally(() => setDetailsLoading(false))
	}, [selectedId])

	const selectPatient = id => { setDetailsLoading(true); setSelectedId(id) }

	const visiblePatients = useMemo(() => patients.filter(item => {
		const name = item.patient?.name || ''
		const matchesSearch = `${name} ${item.patient?.email || ''} ${item.patient?.phone || ''}`.toLowerCase().includes(search.toLowerCase())
		return matchesSearch && (filter === 'All' || patientStatus(item) === filter)
	}), [patients, search, filter])

	const selectedSummary = patients.find(item => item.patient?._id === selectedId)
	const patient = details?.patient || selectedSummary?.patient

	 return <section className="page patients-page">
		<div className="page-heading"><div><p className="eyebrow">YOUR PRACTICE</p><h1>My patients</h1><p>Patients who have appointments with you.</p></div><div className="patient-count"><strong>{patients.length}</strong><span>patients</span></div></div>
		{error && <p className="form-error" role="alert">{error}</p>}
		<div className="patients-layout">
			<div className="patients-list-card card"><div className="patient-tools"><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search patients..." aria-label="Search patients" /><select value={filter} onChange={event => setFilter(event.target.value)} aria-label="Filter patients"><option>All</option><option>Pending</option><option>Accepted</option><option>Completed</option><option>Cancelled</option></select></div>{loading ? <p className="patients-empty">Loading patients...</p> : visiblePatients.length === 0 ? <p className="patients-empty">No patients match your search.</p> : <div className="patient-list">{visiblePatients.map(item => { const itemPatient = item.patient; return <button className={`patient-list-item ${itemPatient._id === selectedId ? 'active' : ''}`} key={itemPatient._id} onClick={() => setSelectedId(itemPatient._id)}><span className="patient-avatar">{(itemPatient.name || 'P').slice(0, 1).toUpperCase()}</span><span className="patient-list-copy"><strong>{itemPatient.name}</strong><small>{itemPatient.email}</small></span><span className="patient-list-meta"><small>{item.appointments.length} visit{item.appointments.length === 1 ? '' : 's'}</small><b className={`patient-status ${patientStatus(item).toLowerCase()}`}>{patientStatus(item)}</b></span></button> })}</div>}</div>
			<div className="patient-detail-card card">{detailsLoading ? <p className="patients-empty">Loading patient details...</p> : patient ? <><header className="patient-detail-header"><span className="patient-avatar large">{(patient.name || 'P').slice(0, 1).toUpperCase()}</span><div><h2>{patient.name}</h2><p>{patient.email}</p></div></header><div className="patient-facts"><div><span>Phone</span><strong>{patient.phone || 'Not provided'}</strong></div><div><span>Age</span><strong>{age(patient.dateOfBirth)}</strong></div><div><span>Gender</span><strong>{patient.gender || 'Not provided'}</strong></div></div><div className="patient-section"><h3>Appointment history <span>{details?.appointments?.length || selectedSummary?.appointments?.length || 0}</span></h3><div className="history-list">{(details?.appointments || selectedSummary?.appointments || []).map(appointment => <div className="history-row" key={appointment._id}><div><strong>{dateTime(appointment.date)}</strong><small>{appointment.reason || 'No reason provided'}</small></div><b className={`patient-status ${appointment.status.toLowerCase()}`}>{appointment.status === 'Confirmed' ? 'Accepted' : appointment.status}</b></div>)}</div></div>{details && <div className="patient-section linked-data"><h3>Health information</h3><div className="data-grid"><DataBlock label="Medical records" items={details.records} empty="No medical records" render={item => <><strong>{item.title}</strong><small>{item.description || 'No description'}</small></>} /><DataBlock label="Prescriptions" items={details.prescriptions} empty="No prescriptions" render={item => <><strong>{item.diagnosis || 'Prescription'}</strong><small>{item.medicines?.map(medicine => medicine.name).join(', ') || 'No medicines listed'}</small></>} /><DataBlock label="Medicines" items={details.medicines} empty="No medicines" render={item => <><strong>{item.medicineName}</strong><small>{item.dosage} · {item.frequency}</small></>} /><DataBlock label="Reports" items={details.reports} empty="No reports" render={item => <><strong>{item.title}</strong><small>{item.summary || item.status}</small></>} /></div></div>}</> : <div className="patients-empty"><span>◉</span><h2>Select a patient</h2><p>Choose a patient to view their care history.</p></div>}</div>
		</div>
	</section>
}

function DataBlock({ label, items, empty, render }) { return <article className="data-block"><h4>{label}<span>{items?.length || 0}</span></h4>{items?.length ? items.slice(0, 4).map(item => <div className="data-item" key={item._id}>{render(item)}</div>) : <p>{empty}</p>}</article> }
