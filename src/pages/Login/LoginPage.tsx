import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { auth } from '@/services/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'

export function LoginPage() {
  const { login } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedEmail = email.trim().toLowerCase()
    const trimmedPassword = password.trim()

    if (!trimmedEmail || !trimmedPassword) {
      setError('Please enter both email and password.')
      return
    }

    setIsLoading(true)

    const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase()
    const adminPassword = (import.meta.env.VITE_ADMIN_PASSWORD || '').trim()

    // Strictly restrict access to verified administrators only
    if (trimmedEmail === adminEmail && trimmedPassword === adminPassword) {
      try {
        // Attempt Firebase Auth sign-in to establish request.auth token for Firestore rules
        await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword)
      } catch (authErr) {
        // Fallback to client-side admin session if Firebase Auth account is not yet provisioned
        console.warn('Firebase Auth sign-in bypassed or user not in Firebase Auth:', authErr)
      }
      login(adminEmail)
    } else {
      setError('Invalid email or password. Access is restricted to authorized administrators only.')
    }
    setIsLoading(false)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Left Side: Logo Box with teal background */}
        <div className="login-logo-container">
          <div className="login-logo-box">
            <img
              src="/logo.png"
              alt="Hornbill Festival Logo"
              className="login-logo"
              onError={(e) => {
                // Fallback SVG if image load fails
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                if (target.parentElement) {
                  target.parentElement.innerHTML = `
                    <div style="text-align: center; color: #1ba084; font-weight: 700; font-size: 20px;">
                      HORNBILL FESTIVAL<br/>
                      <span style="font-size: 14px; font-weight: 500; color: #666;">NAGALAND</span>
                    </div>
                  `
                }
              }}
            />
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="login-content">
          <h1 className="login-title">Admin Login</h1>
          <p className="login-subtitle">Welcome to Hornbill Festival Admin Panel</p>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="login-error">{error}</div>}

            {/* Email Address Group */}
            <div className="login-input-group">
              <label htmlFor="email" className="login-label">
                Email Address
              </label>
              <input
                id="email"
                type="text"
                className="login-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setError('')
                }}
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            {/* Password Group */}
            <div className="login-input-group">
              <label htmlFor="password" className="login-label">
                Password
              </label>
              <div className="login-password-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input login-password-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError('')
                  }}
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
