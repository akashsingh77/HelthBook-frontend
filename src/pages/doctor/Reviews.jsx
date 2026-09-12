import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import '../patient/DoctorDetails.css'

export default function DoctorReviews() {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    Promise.all([api.get('/auth/me'), api.get('/doctors')]).then(async ([me, data]) => {
      const doctors = Array.isArray(data) ? data : data.doctors || []
      const profile = doctors.find(doctor => String(doctor.user?._id || doctor.user) === String(me.user._id))
      if (!profile) throw new Error('Doctor profile not found')
      setSummary(await api.get(`/reviews/doctor/${me.user._id}`))
    }).catch(requestError => setError(requestError.message))
  }, [])
  if (error) return <section className="page"><p className="form-error">{error}</p></section>
  if (!summary) return <section className="page"><p>Loading your ratings...</p></section>
  return <section className="page doctor-details-page"><div className="page-heading"><div><p className="eyebrow">PATIENT FEEDBACK</p><h1>Your ratings & reviews</h1><p>See how patients experience your care.</p></div></div><div className="doctor-profile-grid"><div className="card rating-overview"><p className="section-kicker">OVERALL RATING</p><div className="rating-score"><strong>{summary.averageRating ? summary.averageRating.toFixed(1) : 'New'}</strong><div><div className="stars">{'★★★★★'.slice(0, Math.round(summary.averageRating || 0))}<span>{'★★★★★'.slice(Math.round(summary.averageRating || 0))}</span></div><small>{summary.totalReviews} patient reviews</small></div></div><div className="distribution">{summary.distribution.map(item => <div key={item.rating}><span>{item.rating} ★</span><i><b style={{ width: `${summary.totalReviews ? item.count / summary.totalReviews * 100 : 0}%` }} /></i><small>{item.count}</small></div>)}</div></div><div className="card empty-reviews"><h2>Feedback matters</h2><p>Patient reviews help your care team understand what is working well and where to improve.</p></div></div><div className="request-section"><div className="section-title"><h2>Patient reviews</h2><span>{summary.totalReviews} total</span></div><div className="review-list">{summary.reviews.length ? summary.reviews.map(review => <article className="card review-card" key={review._id}><div className="review-top"><div className="review-avatar">{review.patient?.name?.slice(0, 1) || 'P'}</div><div><strong>{review.patient?.name || 'Patient'}</strong><small>{new Date(review.createdAt).toLocaleDateString()}</small></div><span className="review-stars">{'★'.repeat(review.rating)}<i>{'★'.repeat(5 - review.rating)}</i></span></div><p>{review.comment || 'No written comment.'}</p></article>) : <div className="card empty-reviews">No patient reviews yet.</div>}</div></div></section>
}