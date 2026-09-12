import { useEffect, useState } from 'react'
import { api } from '../../services/api'

export default function BookAppointment({ onNavigate }) {
  const [doctors, setDoctors] = useState([])
  const [form, setForm] = useState({
    doctor: '',
    date: '',
    type: 'In-Person',
    reason: ''
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingDoctors, setLoadingDoctors] = useState(true)

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true)

        console.log('Fetching doctors...')

        const data = await api.get('/doctors')

        console.log('Doctors API response:', data)

        const doctorList = Array.isArray(data)
          ? data
          : data.doctors || []

        const formattedDoctors = doctorList
          .map(doctor => ({
            id: doctor.user?._id || doctor.user || doctor._id,
            name: doctor.user?.name || doctor.name,
            specialty:
              doctor.specialization || 'General physician'
          }))
          .filter(doctor => doctor.id && doctor.name)

        console.log('Formatted doctors:', formattedDoctors)

        setDoctors(formattedDoctors)
      } catch (requestError) {
        console.error('Error fetching doctors:', requestError)
        setError(requestError.message)
        setDoctors([])
      } finally {
        setLoadingDoctors(false)
      }
    }

    fetchDoctors()
  }, [])

  const updateField = event => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    })
  }

  const submit = async event => {
    event.preventDefault()

    setSaving(true)
    setError('')
    setMessage('')

    try {
      await api.post('/appointments', form)

      setMessage('Appointment request sent successfully.')

      setForm({
        doctor: '',
        date: '',
        type: 'In-Person',
        reason: ''
      })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR CARE</p>
          <h1>Book an appointment</h1>
          <p>
            Choose a doctor and a time that works for you.
          </p>
        </div>

        <button
          className="btn"
          onClick={() => onNavigate('appointments')}
        >
          View appointments
        </button>
      </div>

      <form className="card form-card" onSubmit={submit}>
        <label>
          Doctor

          <select
            name="doctor"
            value={form.doctor}
            onChange={updateField}
            required
            disabled={loadingDoctors || !doctors.length}
          >
            <option value="">
              {loadingDoctors
                ? 'Loading doctors...'
                : doctors.length
                  ? 'Select a doctor'
                  : 'No doctors available'}
            </option>

            {doctors.map(doctor => (
              <option
                key={doctor.id}
                value={doctor.id}
              >
                {doctor.name} · {doctor.specialty}
              </option>
            ))}
          </select>
        </label>

        <label>
          Date and time

          <input
            name="date"
            type="datetime-local"
            value={form.date}
            onChange={updateField}
            required
          />
        </label>

        <label>
          Visit type

          <select
            name="type"
            value={form.type}
            onChange={updateField}
          >
            <option>In-Person</option>
            <option>Online</option>
          </select>
        </label>

        <label>
          Reason for visit

          <textarea
            name="reason"
            value={form.reason}
            onChange={updateField}
            placeholder="Tell the doctor what you need help with"
            rows="4"
          />
        </label>

        {error && (
          <p className="form-error">
            {error}
          </p>
        )}

        {message && (
          <p className="form-success">
            {message}
          </p>
        )}

        <button
          className="btn btn-primary"
          type="submit"
          disabled={saving}
        >
          {saving ? 'Booking...' : 'Book appointment'}
        </button>
      </form>
    </section>
  )
}