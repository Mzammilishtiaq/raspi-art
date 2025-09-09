import { useState } from 'react'

import { Alert, Button, Divider, Group, Skeleton, Stack, Text, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'
import { IconExclamationCircle, IconPlus, IconVideo, IconVideoOff } from '@tabler/icons-react'

import * as api from '../../api'
import { Video } from '../../api'
import { VideoListItem } from './VideoListItem'
import useAsync from '../../useAsync'

import NowPlayingSection from './NowPlayingSection'
import AddVideoModal from './AddVideoModal'
import ConfirmDeleteModal from './ConfirmDeleteModal'
import EditVideoModal from './EditVideoModal'
import Classes from './style/video.module.css'
export const VideoSection = () => {
  const { value: info, setValue: setInfo, loading, error } = useAsync(api.getVideosInfo, [])

  const [modalVideo, setModalVideo] = useState<Video | null>(null)
  const [modalLoading, setModalLoading] = useState(false)

  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false)
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false)
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false)

  const showErrorAlert = (error: Error) => {
    notifications.show({
      id: 'error',
      withCloseButton: true,
      autoClose: 7000,
      title: 'Error',
      message: error.message,
      color: 'red'
    })
  }

  const showEditModal = (video: Video) => {
    setModalVideo(video)
    openEdit()
  }

  const showDeleteModal = (video: Video) => {
    setModalVideo(video)
    openDelete()
  }

  const addVideo = async (title: string, file: File) => {
    if (info == null) {
      return
    }

    setModalLoading(true)
    try {
      const video = await api.addVideo(title, file)
      setInfo({
        ...info,
        videos: [...info.videos, video],
      })
      notifications.show({
        id: 'video-added',
        withCloseButton: true,
        autoClose: 2000,
        title: 'Video Added',
        message: `Successfully uploaded ${title}`,
        color: 'green'
      })
    } catch (e) {
      showErrorAlert(e as Error)
    }

    closeAdd()
    setModalLoading(false)
  }

  const setSelectedVideo = async (video: Video | null) => {
    if (info == null) {
      return
    }
    const oldSelectedVideo = info.selectedVideo
    setInfo({
      ...info,
      selectedVideo: video
    })
    try {
      await api.updateSelectedVideo(video)
    } catch (e) {
      showErrorAlert(e as Error)
      setInfo({
        ...info,
        selectedVideo: oldSelectedVideo
      })
    }
  }

  const updateVideo = async (video: Video) => {
    if (info == null) {
      return
    }

    setModalLoading(true)
    try {
      await api.updateVideo(video)
      const newVideos = info.videos.map(v => v.id == video.id ? video : v)
      const newSelectedVideo = info.selectedVideo?.id == video.id ? video : info.selectedVideo
      setInfo({
        videos: newVideos,
        selectedVideo: newSelectedVideo
      })
    } catch (e) {
      showErrorAlert(e as Error)
    }

    closeEdit()
    setModalLoading(false)
  }

  const deleteModalVideo = async () => {
    if (info == null || modalVideo == null) {
      return
    }
    setModalLoading(true)
    try {
      const selectedVideo = await api.deleteVideo(modalVideo)
      const newVideos = info.videos.filter(v => v.id !== modalVideo.id)
      setInfo({
        videos: newVideos,
        selectedVideo
      })

    } catch (e) {
      showErrorAlert(e as Error)
    }

    closeDelete()
    setModalLoading(false)
  }

  const header =
    <Group justify='space-between'>
      <Group>
        <IconVideo size={25} />
        <Title ta='left' order={3}>Videos</Title>
      </Group>
      <Button
        variant='filled'
        leftSection={<IconPlus size={14} />}
        onClick={openAdd}>Add Video</Button>
    </Group>

  if (loading) {
    return (
      <Stack>
        {header}
        <Stack gap='sm'>
          <Skeleton height={18} width='70%' />
          <Skeleton height={12} width='30%' />
        </Stack>
        <Divider />
        <Stack>
          {[...Array(10).keys()].map(id => <Skeleton key={id} height={16} />)}
        </Stack>
      </Stack >
    )
  }

  if (error || info == null) {
    return (
      <Alert variant='light' color='red' title='Error loading videos' icon={<IconExclamationCircle />}>
        <Text c='grey' size='sm'>{error?.message}</Text>
      </Alert>
    )
  }

  return (
    <>
      <Stack mih={0} className={Classes.videoSection}>
        {header}
        {info.videos.length ?
          <>
            <NowPlayingSection video={info.selectedVideo} onStopClicked={() => setSelectedVideo(null)} />
            <Divider mb={0} pb={0} />
            <Stack gap={0}>
              {info.videos.map(video => <VideoListItem
                key={video.id}
                video={video}
                isPlaying={video.id == info.selectedVideo?.id}
                onSelected={() => setSelectedVideo(video)}
                onEditClicked={() => showEditModal(video)}
                onDeleteClicked={() => showDeleteModal(video)} />
              )}
            </Stack>
          </>
          :
          <Stack justify='center' align='center' className={Classes.noVideos} gap='xs'>
            <IconVideoOff size={50} color='#868e96' order={3} />
            <Title ta='center' order={6} c='dimmed' fw={400}>No Uploads</Title>
            <Text size='xs' c='dimmed'>Click Add Video above to upload</Text>
          </Stack>
        }
      </Stack >
      <AddVideoModal
        opened={addOpened}
        loading={modalLoading}
        close={closeAdd}
        onVideoAdded={addVideo} />
      {modalVideo &&
        <>
          <ConfirmDeleteModal
            video={modalVideo}
            opened={deleteOpened}
            loading={modalLoading}
            close={closeDelete}
            onConfirmDelete={deleteModalVideo} />

          <EditVideoModal
            key={modalVideo.id}
            video={modalVideo}
            opened={editOpened}
            loading={modalLoading}
            close={closeEdit}
            onEditSaved={updateVideo} />
        </>
      }
    </>
  )
}

export default VideoSection