'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import { COASTAL_ROLES } from '@/lib/roles'

const AVATAR_COLORS = [
  '#0ea5e9', '#8b5cf6', '#10b981', '#ef4444',
  '#f59e0b', '#ec4899', '#6366f1', '#14b8a6',
  '#f97316', '#84cc16',
]

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const [name, setName] = useState(user?.name ?? '')
  const [role, setRole] = useState(user?.role ?? '')
  const [color, setColor] = useState(user?.avatar_color ?? AVATAR_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSaved, setPwSaved] = useState(false)

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(56,189,248,0.15)',
    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)',
  }

  async function saveProfile() {
    if (!user) return
    setSaving(true)
    await supabase.from('users').update({ name: name.trim(), role, avatar_color: color }).eq('id', user.id)
    setUser({ ...user, name: name.trim(), role, avatar_color: color })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function changePassword() {
    if (!user) return
    setPwError('')
    setPwSaving(true)

    const { data } = await supabase.from('users').select('password').eq('id', user.id).single()
    if (!data || data.password !== currentPassword) {
      setPwError('Current password is incorrect.')
      setPwSaving(false)
      return
    }

    await supabase.from('users').update({ password: newPassword }).eq('id', user.id)
    setCurrentPassword('')
    setNewPassword('')
    setPwSaving(false)
    setPwSaved(true)
    setTimeout(() => setPwSaved(false), 2000)
  }

  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-sm mt-1" style={{ color: 'rgba(56,189,248,0.4)' }}>Manage your profile</p>
      </div>

      {/* Avatar preview */}
      <div className="flex items-center gap-4 mb-8 p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(56,189,248,0.08)' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0" style={{ background: color }}>
          {initials || '?'}
        </div>
        <div>
          <p className="text-white font-semibold">{name || 'Your Name'}</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(56,189,248,0.4)' }}>{role}</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(56,189,248,0.3)' }}>{user?.email}</p>
        </div>
      </div>

      {/* Profile form */}
      <div className="rounded-2xl overflow-hidden mb-5" style={{ border: '1px solid rgba(56,189,248,0.1)' }}>
        <div className="px-6 py-4" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(56,189,248,0.08)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(56,189,248,0.5)' }}>Profile</p>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sky-300/80 text-xs font-semibold mb-2 tracking-wider uppercase">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={e => { e.target.style.border = '1px solid rgba(56,189,248,0.5)' }}
              onBlur={e => { e.target.style.border = '1px solid rgba(56,189,248,0.15)' }}
            />
          </div>

          <div>
            <label className="block text-sky-300/80 text-xs font-semibold mb-2 tracking-wider uppercase">Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{ ...inputStyle, color: '#7dd3fc' }}
            >
              {COASTAL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sky-300/80 text-xs font-semibold mb-3 tracking-wider uppercase">Avatar Color</label>
            <div className="flex gap-2 flex-wrap">
              {AVATAR_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full transition-all"
                  style={{ background: c, outline: color === c ? `3px solid ${c}` : 'none', outlineOffset: '2px', opacity: color === c ? 1 : 0.45 }}
                />
              ))}
            </div>
          </div>

          <button
            onClick={saveProfile}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: saved ? 'rgba(16,185,129,0.4)' : 'linear-gradient(135deg, #0891b2, #0ea5e9)', boxShadow: '0 4px 16px rgba(6,182,212,0.25)' }}
          >
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* Password form */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(56,189,248,0.1)' }}>
        <div className="px-6 py-4" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(56,189,248,0.08)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(56,189,248,0.5)' }}>Change Password</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sky-300/80 text-xs font-semibold mb-2 tracking-wider uppercase">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={e => { e.target.style.border = '1px solid rgba(56,189,248,0.5)' }}
              onBlur={e => { e.target.style.border = '1px solid rgba(56,189,248,0.15)' }}
            />
          </div>
          <div>
            <label className="block text-sky-300/80 text-xs font-semibold mb-2 tracking-wider uppercase">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={e => { e.target.style.border = '1px solid rgba(56,189,248,0.5)' }}
              onBlur={e => { e.target.style.border = '1px solid rgba(56,189,248,0.15)' }}
            />
          </div>

          {pwError && (
            <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <span className="text-red-400 text-sm">{pwError}</span>
            </div>
          )}

          <button
            onClick={changePassword}
            disabled={pwSaving || !currentPassword || !newPassword}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
            style={{ background: pwSaved ? 'rgba(16,185,129,0.4)' : 'linear-gradient(135deg, #0891b2, #0ea5e9)', boxShadow: '0 4px 16px rgba(6,182,212,0.25)' }}
          >
            {pwSaved ? 'Password Updated!' : pwSaving ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  )
}