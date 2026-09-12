import { useEffect, useState } from 'react'
import { api } from '../services/api'
import './Profile.css'

const emptyProfile = { name: '', email: '', phone: '', gender: '', dateOfBirth: '', address: '', profileImage: '' }
const apiOrigin = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')

function imageUrl(path) {
  return path ? (path.startsWith('http') ? path : `${apiOrigin}${path}`) : ''
}

function initials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'HB'
}

export default function Profile() {
  const [profile, setProfile] = useState(emptyProfile)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordState, setPasswordState] = useState({ loading: false, type: '', text: '' })

  useEffect(() => {
    api.get('/auth/me')
      .then(data => setProfile({ ...emptyProfile, ...data.user, dateOfBirth: data.user.dateOfBirth ? data.user.dateOfBirth.slice(0, 10) : '' }))
      .catch(error => setMessage({ type: 'error', text: error.message }))
      .finally(() => setLoading(false))
  }, [])

  const updateField = event => setProfile(current => ({ ...current, [event.target.name]: event.target.value }))

  const saveProfile = async event => {
    event.preventDefault()
    setMessage({ type: '', text: '' })
    if (!profile.name.trim()) return setMessage({ type: 'error', text: 'Please enter your name.' })
    if (profile.dateOfBirth && new Date(profile.dateOfBirth) > new Date()) return setMessage({ type: 'error', text: 'Date of birth cannot be in the future.' })
    setSaving(true)
    try {
      const data = await api.patch('/auth/profile', { name: profile.name.trim(), phone: profile.phone.trim(), gender: profile.gender, dateOfBirth: profile.dateOfBirth || null, address: profile.address.trim() })
      setProfile(current => ({ ...current, ...data.user, dateOfBirth: data.user.dateOfBirth ? data.user.dateOfBirth.slice(0, 10) : '' }))
      setMessage({ type: 'success', text: 'Profile updated successfully.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally { setSaving(false) }
  }

  const uploadPhoto = async event => {
    const photo = event.target.files[0]
    if (!photo) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(photo.type)) return setMessage({ type: 'error', text: 'Choose a JPG, PNG, or WEBP image.' })
    if (photo.size > 5 * 1024 * 1024) return setMessage({ type: 'error', text: 'Profile photos must be smaller than 5 MB.' })
    setPhotoUploading(true)
    setMessage({ type: '', text: '' })
    try {
      const formData = new FormData()
      formData.append('photo', photo)
      const data = await api.upload('/auth/profile/photo', formData)
      setProfile(current => ({ ...current, profileImage: data.user.profileImage }))
      setMessage({ type: 'success', text: 'Profile photo updated.' })
    } catch (error) { setMessage({ type: 'error', text: error.message }) }
    finally { setPhotoUploading(false); event.target.value = '' }
  }

  const changePassword = async event => {
    event.preventDefault()
    setPasswordState({ loading: false, type: '', text: '' })
    if (password.newPassword.length < 6) return setPasswordState({ type: 'error', text: 'New password must be at least 6 characters.' })
    if (password.newPassword !== password.confirmPassword) return setPasswordState({ type: 'error', text: 'New passwords do not match.' })
    setPasswordState({ loading: true, type: '', text: '' })
    try {
      const data = await api.post('/auth/change-password', { currentPassword: password.currentPassword, newPassword: password.newPassword })
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordState({ type: 'success', text: data.message })
    } catch (error) { setPasswordState({ type: 'error', text: error.message }) }
    finally { setPasswordState(current => ({ ...current, loading: false })) }
  }

  if (loading) return <section className="page profile-page"><div className="profile-loading">Loading your profile...</div></section>

  return <section className="page profile-page">
    <div className="page-heading profile-heading"><div><p className="eyebrow">ACCOUNT</p><h1>My profile</h1><p>Keep your personal details current and your account secure.</p></div></div>
    {message.text && <div className={`profile-alert ${message.type}`} role="status">{message.text}</div>}
    <div className="profile-layout">
      <aside className="profile-summary">
        <div className="profile-avatar">{profile.profileImage ? <img src={imageUrl(profile.profileImage)} alt="Profile" /> : initials(profile.name)}</div>
        <h2>{profile.name || 'Your profile'}</h2><p>{profile.email}</p>
        <label className="photo-button">{photoUploading ? 'Uploading...' : 'Change photo'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPhoto} disabled={photoUploading} /></label>
        <small>JPG, PNG or WEBP. Max 5 MB.</small>
      </aside>
      <div className="profile-content">
        <form className="profile-card form-card" onSubmit={saveProfile}>
          <div className="card-heading"><div><p className="section-kicker">PERSONAL DETAILS</p><h2>Profile information</h2></div><span className="secure-mark">✓</span></div>
          <div className="profile-form-grid">
            <label>Full name<input name="name" value={profile.name} onChange={updateField} required /></label>
            <label>Email address<input value={profile.email} readOnly /></label>
            <label>Phone number<input name="phone" type="tel" value={profile.phone} onChange={updateField} placeholder="e.g. +1 555 000 0000" /></label>
            <label>Gender<select name="gender" value={profile.gender} onChange={updateField}><option value="">Select gender</option><option value="female">Female</option><option value="male">Male</option><option value="non-binary">Non-binary</option><option value="prefer-not-to-say">Prefer not to say</option></select></label>
            <label>Date of birth<input name="dateOfBirth" type="date" value={profile.dateOfBirth} onChange={updateField} max={new Date().toISOString().slice(0, 10)} /></label>
            <label className="full-field">Address<textarea name="address" value={profile.address} onChange={updateField} rows="3" placeholder="Enter your address" /></label>
          </div>
          <button className="btn primary save-button" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
        </form>
        <form className="profile-card form-card password-card" onSubmit={changePassword}>
          <div className="card-heading"><div><p className="section-kicker">ACCOUNT SECURITY</p><h2>Change password</h2></div><span className="lock-mark">⌑</span></div>
          <label>Current password<input type="password" value={password.currentPassword} onChange={event => setPassword({ ...password, currentPassword: event.target.value })} required /></label>
          <div className="profile-form-grid"><label>New password<input type="password" value={password.newPassword} onChange={event => setPassword({ ...password, newPassword: event.target.value })} minLength="6" required /></label><label>Confirm new password<input type="password" value={password.confirmPassword} onChange={event => setPassword({ ...password, confirmPassword: event.target.value })} minLength="6" required /></label></div>
          {passwordState.text && <p className={`form-message ${passwordState.type}`}>{passwordState.text}</p>}
          <button className="btn secondary save-button" type="submit" disabled={passwordState.loading}>{passwordState.loading ? 'Updating...' : 'Update password'}</button>
        </form>
      </div>
    </div>
  </section>
}
