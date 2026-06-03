import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  doc, collection, setDoc, deleteDoc,
  onSnapshot, serverTimestamp, query, orderBy,
} from 'firebase/firestore'
import { db } from '../firebase'

// Firestore layout:
//   users/{deviceId}                   — { goalHours, fastStart }
//   users/{deviceId}/sessions/{id}     — { start, end, goalHours, goalMet, durationMs, createdAt }

function getDeviceId() {
  const key = 'fast-time-device-id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

export function useFastStore() {
  const deviceId = useMemo(() => getDeviceId(), [])

  const [goalHours, setGoalHoursState] = useState(16)
  const [fastStart, setFastStart] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Listen to settings doc
  useEffect(() => {
    const ref = doc(db, 'users', deviceId)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data()
          setGoalHoursState(data.goalHours ?? 16)
          setFastStart(data.fastStart ?? null)
        }
        setLoading(false)
      },
      (err) => {
        console.error('Firestore settings listener error:', err)
        setError('Unable to connect to the database. Check your Firestore security rules.')
        setLoading(false)
      },
    )
    return unsub
  }, [deviceId])

  // Listen to sessions subcollection
  useEffect(() => {
    const q = query(
      collection(db, 'users', deviceId, 'sessions'),
      orderBy('createdAt', 'desc'),
    )
    const unsub = onSnapshot(q, (snap) => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, (err) => {
      console.error('Firestore sessions listener error:', err)
    })
    return unsub
  }, [deviceId])

  const setGoalHours = useCallback(async (hours) => {
    try {
      await setDoc(doc(db, 'users', deviceId), { goalHours: hours }, { merge: true })
    } catch (err) {
      console.error('Failed to save goal hours:', err)
      setError('Failed to save. Check your Firestore security rules.')
    }
  }, [deviceId])

  const startFast = useCallback(async () => {
    try {
      const start = new Date().toISOString()
      await setDoc(doc(db, 'users', deviceId), { fastStart: start }, { merge: true })
    } catch (err) {
      console.error('Failed to start fast:', err)
      setError('Failed to start fast. Check your Firestore security rules.')
    }
  }, [deviceId])

  const stopFast = useCallback(async () => {
    if (!fastStart) return
    try {
      const end = new Date().toISOString()
      const durationMs = new Date(end) - new Date(fastStart)
      const goalMs = goalHours * 3600 * 1000
      const sessionId = crypto.randomUUID()

      await Promise.all([
        setDoc(doc(db, 'users', deviceId), { fastStart: null }, { merge: true }),
        setDoc(doc(db, 'users', deviceId, 'sessions', sessionId), {
          start: fastStart,
          end,
          goalHours,
          goalMet: durationMs >= goalMs,
          durationMs,
          createdAt: serverTimestamp(),
        }),
      ])
    } catch (err) {
      console.error('Failed to stop fast:', err)
      setError('Failed to stop fast. Check your Firestore security rules.')
    }
  }, [deviceId, fastStart, goalHours])

  const deleteSession = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, 'users', deviceId, 'sessions', id))
    } catch (err) {
      console.error('Failed to delete session:', err)
      setError('Failed to delete session. Check your Firestore security rules.')
    }
  }, [deviceId])

  return {
    goalHours,
    fastStart,
    sessions,
    loading,
    error,
    setGoalHours,
    startFast,
    stopFast,
    deleteSession,
  }
}
