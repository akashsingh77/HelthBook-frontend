import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import './DoctorDetails.css'

const fallbackDoctor = { id: '', name: 'Doctor profile', specialty: 'Healthcare professional', experience: 0, bio: 'Professional care focused on clear, practical support.' }

export default function DoctorDetails({ doctor: selectedDoctor, onNavigate }) {
	const doctor = selectedDoctor || fallbackDoctor
	const [summary, setSummary] = useState({ averageRating: 0, totalReviews: 0, distribution: [], reviews: [] })
	const [appointments, setAppointments] = useState([])
	const [user, setUser] = useState(null)
	const [form, setForm] = useState({ appointment: '', rating: 5, comment: '' })
	const [editing, setEditing] = useState(null)
	const [message, setMessage] = useState({ type: '', text: '' })

	useEffect(() => {
		if (!doctor.id) return
		Promise.all([api.get(`/reviews/doctor/${doctor.id}`), api.get(`/reviews/eligible/${doctor.id}`), api.get('/auth/me')])
			.then(([reviewData, eligibleData, me]) => { setSummary(reviewData); setAppointments(eligibleData.appointments || []); setUser(me.user) })
			.catch(error => setMessage({ type: 'error', text: error.message }))
	}, [doctor.id])

	const submitReview = async event => {
		event.preventDefault()
		try {
			if (editing) {
				const data = await api.patch(`/reviews/${editing._id}`, { rating: form.rating, comment: form.comment })
				setSummary(current => ({ ...current, reviews: current.reviews.map(review => review._id === editing._id ? data.review : review) }))
			} else {
				const data = await api.post('/reviews', { doctor: doctor.id, appointment: form.appointment, rating: form.rating, comment: form.comment })
				setSummary(current => ({ ...current, reviews: [data.review, ...current.reviews], totalReviews: current.totalReviews + 1, averageRating: current.totalReviews ? ((current.averageRating * current.totalReviews + form.rating) / (current.totalReviews + 1)) : form.rating }))
				setAppointments(current => current.filter(appointment => appointment._id !== form.appointment))
			}
			setEditing(null); setForm({ appointment: '', rating: 5, comment: '' }); setMessage({ type: 'success', text: editing ? 'Your review was updated.' : 'Thank you for sharing your experience.' })
		} catch (error) { setMessage({ type: 'error', text: error.message }) }
	}

	const editReview = review => { setEditing(review); setForm({ appointment: review.appointment, rating: review.rating, comment: review.comment || '' }); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }) }
	const deleteReview = async review => { try { await api.remove(`/reviews/${review._id}`); setSummary(current => ({ ...current, reviews: current.reviews.filter(item => item._id !== review._id), totalReviews: Math.max(0, current.totalReviews - 1) })); setMessage({ type: 'success', text: 'Your review was deleted.' }) } catch (error) { setMessage({ type: 'error', text: error.message }) } }
	const initials = doctor.name.split(' ').filter(Boolean).slice(-2).map(part => part[0]).join('').toUpperCase()

	const isOwnReview = review => String(review.patient?._id) === String(user?._id)
	return <section className="page doctor-details-page"><div className="page-heading"><div><p className="eyebrow">DOCTOR PROFILE</p><h1>{doctor.name}</h1><p>{doctor.specialty} · {doctor.experience || 0} years of experience</p></div><button className="btn btn-primary" onClick={() => onNavigate('book appointment')}>Book appointment</button></div>{message.text && <div className={`review-alert ${message.type}`}>{message.text}</div>}<div className="doctor-profile-grid"><div className="card profile-card"><div className="avatar large-avatar">{initials || 'DR'}</div><h2>About {doctor.name}</h2><p>{doctor.bio || 'A trusted HealthBook care professional committed to thoughtful patient care.'}</p><h3>Education & credentials</h3><ul className="detail-list"><li>{doctor.qualification || 'Verified healthcare professional'}</li><li>{doctor.verified ? 'HealthBook verified' : 'HealthBook care team'}</li><li>{doctor.clinicAddress || 'Consultation available through HealthBook'}</li></ul></div><div className="card rating-overview"><p className="section-kicker">PATIENT EXPERIENCE</p><div className="rating-score"><strong>{summary.averageRating ? summary.averageRating.toFixed(1) : 'New'}</strong><div><div className="stars">{'★★★★★'.slice(0, Math.round(summary.averageRating || 0))}<span>{'★★★★★'.slice(Math.round(summary.averageRating || 0))}</span></div><small>{summary.totalReviews} patient reviews</small></div></div><div className="distribution">{summary.distribution.map(item => <div key={item.rating}><span>{item.rating} ★</span><i><b style={{ width: `${summary.totalReviews ? item.count / summary.totalReviews * 100 : 0}%` }} /></i><small>{item.count}</small></div>)}</div></div></div><div className="reviews-layout"><div><div className="section-title"><h2>Patient reviews</h2><span>{summary.totalReviews} total</span></div>{summary.reviews.length ? <div className="review-list">{summary.reviews.map(review => <article className="card review-card" key={review._id}><div className="review-top"><div className="review-avatar">{review.patient?.name?.slice(0, 1) || 'P'}</div><div><strong>{isOwnReview(review) ? 'You' : review.patient?.name || 'Patient'}</strong><small>{new Date(review.createdAt).toLocaleDateString()}</small></div><span className="review-stars">{'★'.repeat(review.rating)}<i>{'★'.repeat(5 - review.rating)}</i></span></div><p>{review.comment || 'No written comment.'}</p>{isOwnReview(review) && <div className="review-actions"><button onClick={() => editReview(review)}>Edit</button><button onClick={() => deleteReview(review)}>Delete</button></div>}</article>)}</div> : <div className="card empty-reviews">No reviews yet. Be the first to share your experience.</div>}</div><form className="card review-form" onSubmit={submitReview}><p className="section-kicker">YOUR EXPERIENCE</p><h2>{editing ? 'Edit your review' : 'Leave a review'}</h2>{appointments.length || editing ? <>{!editing && <label>Completed appointment<select value={form.appointment} onChange={event => setForm({ ...form, appointment: event.target.value })} required><option value="">Select an appointment</option>{appointments.map(appointment => <option key={appointment._id} value={appointment._id}>{new Date(appointment.date).toLocaleDateString()} · {appointment.type}</option>)}</select></label>}<label>Rating<div className="star-picker">{[1, 2, 3, 4, 5].map(value => <button type="button" className={value <= form.rating ? 'selected' : ''} onClick={() => setForm({ ...form, rating: value })} key={value}>★</button>)}</div></label><label>Review<textarea rows="4" value={form.comment} onChange={event => setForm({ ...form, comment: event.target.value })} placeholder="Tell other patients about your experience" maxLength="1000" /></label><button className="btn btn-primary" type="submit">{editing ? 'Update review' : 'Submit review'}</button>{editing && <button type="button" className="cancel-review" onClick={() => { setEditing(null); setForm({ appointment: '', rating: 5, comment: '' }) }}>Cancel</button>}</> : <p className="review-note">Reviews are available after you complete an appointment with this doctor.</p>}</form></div></section>
}
