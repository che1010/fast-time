import { useState, useEffect, useCallback } from 'react'
import {
  doc, collection, setDoc, deleteDoc,
  onSnapshot, serverTimestamp, query, orderBy,
} from 'firebase/firestore'
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { db, auth } from '../firebase'

// Firestore layout:
//   users/{uid}                     — settings: { goalHours, fastStart }
//   users/{uid}/sessions/{id}       — { start, end, goalHours, goalMet, durationMs, createdAt }

export function useFastStore() {
  const [uid, setUid] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [authError, setAuthError] = useState(null)

  const [goalHours, setGoalHoursState] = useState(16)
  const [fastStart, setFastStart] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  // Sign in anonymously once
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid)
        setAuthReady(true)
        setAuthError(null)
      } else {
        try {
          await signInAnonymously(auth)
        } catch (err) {
          console.error('Anonymous sign-in failed:', err)
          setAuthError(err.code === 'auth/configuration-not-found'
            ? 'Anonymous Authentication is not enabled in Firebase. Go to Firebase Console → Authentication → Sign-in method → Anonymous → Enable.'
            : err.message
          )
        }
      }
    })
    return unsub
  }, [])

  // Listen to settings doc
  useEffect(() => {
    if (!uid) return
    const ref = doc(db, 'users', uid)
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setGoalHoursState(data.goalHours ?? 16)
        setFastStart(data.fastStart ?? null)
      }
      setLoading(false)
    })
    return unsub
  }, [uid])

  // Listen to sessions subcollection
  useEffect(() => {
    if (!uid) return
    const q = query(
      collection(db, 'users', uid, 'sessions'),
      orderBy('createdAt', 'desc'),
    )
    const unsub = onSnapshot(q, (snap) => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [uid])

  const setGoalHours = useCallback(async (hours) => {
    if (!uid) return
    await setDoc(doc(db, 'users', uid), { goalHours: hours }, { merge: true })
  }, [uid])

  const startFast = useCallback(async () => {
    if (!uid) return
    const start = new Date().toISOString()
    await setDoc(doc(db, 'users', uid), { fastStart: start }, { merge: true })
  }, [uid])

  const stopFast = useCallback(async () => {
    if (!uid || !fastStart) return
    const end = new Date().toISOString()
    const durationMs = new Date(end) - new Date(fastStart)
    const goalMs = goalHours * 3600 * 1000
    const sessionId = `${fastStart}-${end}`.replace(/[:.]/g, '-')

    await Promise.all([
      // Clear active fast
      setDoc(doc(db, 'users', uid), { fastStart: null }, { merge: true }),
      // Save session
      setDoc(doc(db, 'users', uid, 'sessions', sessionId), {
        start: fastStart,
        end,
        goalHours,
        goalMet: durationMs >= goalMs,
        durationMs,
        createdAt: serverTimestamp(),
      }),
    ])
  }, [uid, fastStart, goalHours])

  const deleteSession = useCallback(async (id) => {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'sessions', id))
  }, [uid])

  return {
    goalHours,
    fastStart,
    sessions,
    loading: !authReady || loading,
    authError,
    setGoalHours,
    startFast,
    stopFast,
    deleteSession,
  }
}
