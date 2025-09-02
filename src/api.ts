import axios from 'axios'
const api = axios.create({
  baseURL: '/api',   // The base URL for the API
  timeout: 30000,    // Timeout after 30 seconds
});
export type Nullable<T> = { [K in keyof T]: T[K] | null };

export interface Network {
    id: number
    label: string
    ssid: string
    password: string
    uuid: string
}

export interface Video {
    id: number
    title: string
    urlPath: string
    filePath: string
}

export interface VideosInfo {
    videos: Video[]
    selectedVideo: Video | null
}

export interface MotorEvent {
    speed: number
    duration: number
}

export enum Status {
    UNKNOWN = 0,
    OK = 1,
    ERROR = 2
}

export interface MotorStatus {
    id: number,
    status: Status
}

export interface MotorSequence {
    id: number
    events: MotorEvent[]
}

export interface Calibration {
    min: number
    max: number
}

export interface DisplayConfigValue {
    ambientLight: number
    brightness: number
    contrast: number
}

export interface DisplaySettings {
    sleep: {
        duration: number,
        threshold: number
    }
    calibration: Calibration | null
    configValues: Nullable<DisplayConfigValue>[]
}

export const MAX_BRIGHTNESS = 100
export const MAX_CONTRAST = 100

export const getVideosInfo = async (): Promise<VideosInfo> => {
    const videos = await axios.get<Video[]>('/api/videos')
    const selectedVideo = await axios.get<Video>('/api/selected-video')
    return {
        videos: videos.data,
        selectedVideo: selectedVideo.data
    }
}

export const addVideo = async (title: string, file: File): Promise<Video> => {
    const formData = new FormData()
    formData.append('title', title)
    formData.append('file', file)
    const response = await axios.post<Video>('api/videos', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
    return response.data
}

export const updateVideo = async (video: Video) => {
    await axios.put(`api/videos/${video.id}`, { title: video.title })
}

/**
 * Deletes the given video and returns the new selected video ID.
 */
export const deleteVideo = async (video: Video): Promise<Video | null> => {
    const response = await axios.delete<Video | null>(`api/videos/${video.id}`)
    return response.data
}

export const getSelectedVideo = async (): Promise<Video | null> => {
    const response = await axios.get<Video | null>('api/selected-video')
    return response.data
}

export const updateSelectedVideo = async (video: Video | null): Promise<void> => {
    await axios.post('api/selected-video', { id: video?.id ?? null })
}

// <========get motors==========>
export const getMotors = async (): Promise<number[]> => {
  const response = await api.get<number[]>('/motors');
  console.log(response.data);
  return response.data;
};

export const getMotorSequences = async (): Promise<MotorSequence[]> => {
    const response = await axios.get<MotorSequence[]>('api/motor-sequences')
    return response.data
}

export const setMotorSequence = async (id: number, info: Partial<MotorSequence>) => {
    await axios.put(`api/motor-sequences/${id}`, info)
}

export const getMotorStatuses = async (): Promise<MotorStatus[]> => {
    const response = await axios.get<MotorStatus[]>('api/motor-statuses')
    return response.data
}

export const getDisplaySettings = async (): Promise<DisplaySettings> => {
    const response = await axios.get<DisplaySettings>('api/display-settings')
    return response.data
}

export const setDisplaySettings = async (settings: DisplaySettings) => {
    await axios.put('api/display-settings', settings)
}

export const getAmbientLight = async (): Promise<number | null> => {
    const response = await axios.get<number | null>('api/ambient-light')
    return response.data
}

export const getNetworks = async (): Promise<Network[]> => {
    const response = await axios.get<Network[]>('api/networks')
    return response.data
}

export const getConnectedNetworkUuid = async (): Promise<string | null> => {
    const response = await axios.get<string | null>('api/connected-network-uuid')
    return response.data
}

export const addNetwork = async (label: string, ssid: string, password: string): Promise<Network> => {
    const response = await axios.post<Network>('api/networks', {
        label,
        ssid,
        password
    })
    return response.data
}

export const updateNetwork = async (network: Network) => {
    await axios.put(`api/networks/${network.id}`, network)
}

export const deleteNetwork = async (network: Network): Promise<void> => {
    await axios.delete(`api/networks/${network.id}`)
}