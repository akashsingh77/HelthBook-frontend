const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

async function request(path, options = {}) {
	const token = localStorage.getItem('healthbook_token')
	const isFormData = options.body instanceof FormData
	const response = await fetch(`${baseUrl}${path}`, {
		...options,
		headers: {
			...(isFormData ? {} : { 'Content-Type': 'application/json' }),
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...options.headers,
		},
	})
	const data = await response.json().catch(() => null)
	if (!response.ok) throw new Error(data?.message || 'Request failed')
	return data
}

export const api = {
	get: path => request(path),
	post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
	upload: (path, body) => request(path, { method: 'POST', body }),
	patch: (path, body = {}) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
	remove: path => request(path, { method: 'DELETE' }),
}
