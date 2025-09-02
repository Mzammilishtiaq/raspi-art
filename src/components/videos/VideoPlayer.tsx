import { useEffect } from 'react'
import ReactPlayer from 'react-player'

import useAsync from '../../useAsync'
import * as api from '../../api'

export const VideoPlayer = () => {
  const { value: video, setValue: setVideo, loading, error, setError } = useAsync(api.getSelectedVideo, [])

  useEffect(() => {
    if (loading) {
      return
    }
    let isMounted = true
    const reload = async () => {
      try {
        const newVideo = await api.getSelectedVideo()
        if (isMounted) {
          setError(null)
          if (newVideo?.id !== video?.id) {
            setVideo(newVideo)
          }
        }
      } catch (e) {
        setError(e as Error)
      }
    }
    const interval = setInterval(reload, 500)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  })

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error.message}</div>
  }

  if (video == null) {
    return <div>No video selected</div>
  }

  return (
    <ReactPlayer
      url={`/${video.urlPath}`}
      playing
      loop
      muted
      width='100vw'
      height='100vh' />
  )
}

export default VideoPlayer