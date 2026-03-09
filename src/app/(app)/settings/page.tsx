'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import { COASTAL_ROLES } from '@/lib/roles'

const AVATAR_COLORS = ['#0ea5e9','#8b5cf6','#10b981','#ef4444','#f59e0b','#ec4899','#6366f1','#14b8a6','#f97316','#84cc16']

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const [name, setName] = useState(user?.name ?? '')
  const [role, setRole] = useState(user?.role ?? '')
  const [color, setColor] = useState(user?.avatar_color ?? AVATAR_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSaved, setPwSaved] = useState(false)

  const inputStyle: React.CSSProperties = { width: '100%', padding: '11px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: 12, color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-outfit), sans-serif', boxSizing: 'border-box', transition: 'border-color 0.15s' }

  async function saveProfile() {
    if (!user) return
    setSaving(true)
    await supabase.from('users').update({ name: name.trim(), role, avatar_color: color }).eq('id', user.id)
    setUser({ ...user, name: name.trim(), role, avatar_color: color })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  async function changePassword() {
    if (!user) return
    setPwError(''); setPwSaving(true)
    const { data } = await supabase.from('users').select('password').eq('id', user.id).single()
    if (!data || data.password !== currentPw) { setPwError('Current password is incorrect.'); setPwSaving(false); return }
    await supabase.from('users').update({ password: newPw }).eq('id', user.id)
    setCurrentPw(''); setNewPw(''); setPwSaving(false); setPwSaved(true); setTimeout(() => setPwSaved(false), 2000)
  }

  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const sectionStyle: React.CSSProperties = { border: '1px solid var(--border-subtle)', borderRadius: 20, overflow: 'hidden', marginBottom: 20 }
  const sectionHeaderStyle: React.CSSProperties = { padding: '14px 24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)' }
  const sectionBodyStyle: React.CSSProperties = { padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 8 }

  return (
    <div style={{ padding: 40, maxWidth: 520 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Settings</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Manage your profile</p>
      </div>

      {/* Avatar preview */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 16, marginBottom: 24 }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: 'white', background: `linear-gradient(135deg, ${color}, ${color}99)`, boxShadow: `0 0 20px ${color}50`, flexShrink: 0 }}>
          {initials || '?'}
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{name || 'Your Name'}</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{role}</p>
          <p style={{ fontSize: 11, color: 'rgba(56,189,248,0.3)', marginTop: 1 }}>{user?.email}</p>
        </div>
      </div>

      {/* Profile */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>Profile</p>
        </div>
        <div style={sectionBodyStyle}>
          <div>
            <label style={labelStyle}>Name</label>
            <input value={name} onChange={e => setName(e.target.value)} style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'rgba(34,211,238,0.5)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(56,189,248,0.15)')}
            />
          </div>
          <div>
            <label style={labelStyle}>Role</label>
            <select value={role} onChange={e => setRole(e.target.value)} style={{ ...inputStyle, color: '#7dd3fc' }}>
              {COASTAL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Avatar Color</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {AVATAR_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{ width: 30, height: 30, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: color === c ? `3px solid ${c}` : 'none', outlineOffset: 2, opacity: color === c ? 1 : 0.4, transition: 'all 0.15s' }} />
              ))}
            </div>
          </div>
          <button onClick={saveProfile} disabled={saving} style={{ padding: '11px 24px', background: saved ? 'rgba(16,185,129,0.35)' : 'linear-gradient(135deg, #0891b2, #0ea5e9)', border: 'none', borderRadius: 12, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif', alignSelf: 'flex-start', transition: 'all 0.2s', opacity: saving ? 0.6 : 1 }}>
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* Password */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>Change Password</p>
        </div>
        <div style={sectionBodyStyle}>
          <div>
            <label style={labelStyle}>Current Password</label>
            <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'rgba(34,211,238,0.5)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(56,189,248,0.15)')}
            />
          </div>
          <div>
            <label style={labelStyle}>New Password</label>
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'rgba(34,211,238,0.5)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(56,189,248,0.15)')}
            />
          </div>
          {pwError && (
            <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10 }}>
              <span style={{ fontSize: 13, color: '#f87171' }}>{pwError}</span>
            </div>
          )}
          <button onClick={changePassword} disabled={pwSaving || !currentPw || !newPw} style={{ padding: '11px 24px', background: pwSaved ? 'rgba(16,185,129,0.35)' : 'linear-gradient(135deg, #0891b2, #0ea5e9)', border: 'none', borderRadius: 12, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif', alignSelf: 'flex-start', transition: 'all 0.2s', opacity: (pwSaving || !currentPw || !newPw) ? 0.4 : 1 }}>
            {pwSaved ? 'Updated!' : pwSaving ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  )
}