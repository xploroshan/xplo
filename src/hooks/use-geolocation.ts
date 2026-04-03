"use client"

import { useState, useEffect, useCallback } from "react"

interface GeolocationState {
  lat: number | null
  lng: number | null
  loading: boolean
  error: string | null
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    loading: true,
    error: null,
  })

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ lat: null, lng: null, loading: false, error: "Geolocation not supported" })
      return
    }

    setState((s) => ({ ...s, loading: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          loading: false,
          error: null,
        })
      },
      (err) => {
        setState({
          lat: null,
          lng: null,
          loading: false,
          error: err.message,
        })
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 300000, // cache for 5 min
      }
    )
  }, [])

  useEffect(() => {
    requestLocation()
  }, [requestLocation])

  return { ...state, requestLocation }
}
