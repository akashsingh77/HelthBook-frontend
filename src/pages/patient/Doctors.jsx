import { useEffect, useState } from 'react'
import DoctorCard from '../../components/DoctorCard'
import { api } from '../../services/api'

const colors = ['#4e927b', '#6d87ad', '#ba8771', '#9e8bbb', '#b17c8d', '#718d87']
const initials = name => name.split(' ').filter(Boolean).slice(-2).map(part => part[0]).join('').toUpperCase()

export default function Doctors({ onNavigate, onDoctorSelect }) {
	const [doctors, setDoctors] = useState([])
	const [search, setSearch] = useState('')
	const [error, setError] = useState('')
	useEffect(() => { api.get('/doctors').then(data => setDoctors(Array.isArray(data) ? data : data.doctors || [])).catch(requestError => setError(requestError.message)) }, [])
	const visibleDoctors = doctors.filter(doctor => `${doctor.user?.name || doctor.name} ${doctor.specialization || ''}`.toLowerCase().includes(search.toLowerCase()))
	return <section className="page"><div className="page-heading"><div><p className="eyebrow">YOUR CARE TEAM</p><h1>Find a doctor</h1><p>Browse trusted specialists and book a time that works for you.</p></div></div><div className="filters"><input className="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by doctor or specialty"/><button className="filter">All specialties ▾</button><button className="filter">Available this week ▾</button></div>{error && <p className="form-error">{error}</p>}<div className="grid doctor-grid">{visibleDoctors.map((doctor, index) => { const name = doctor.user?.name || doctor.name || 'HealthBook doctor'; const selected = { ...doctor, id: doctor.user?._id || doctor.user || doctor._id, name, specialty: doctor.specialization || 'General physician' }; return <DoctorCard key={selected.id || name} name={name} specialty={selected.specialty} initials={initials(name)} color={colors[index % colors.length]} rating={doctor.ratingAverage} reviewCount={doctor.ratingCount} experience={doctor.experience} onView={() => onDoctorSelect(selected)} onBook={() => onNavigate('book appointment')} /> })}</div></section>
}
