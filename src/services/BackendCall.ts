import axios from 'axios'
const api = axios.create({
  baseURL: '/api',   // The base URL for the API
  timeout: 30000,    // Timeout after 30 seconds
});
interface BackendCallOptions {
    url: string;
    method?: string;
    data?: any;
    source?: any;
    isNavigate?: boolean;
    isShowErrorMessage?: boolean;
    contentType?: string;
    dataModel?: any;
    customHeaders?: Record<string, string>;  // Custom headers (optional)
}

export const backendCall = async ({
    url,
    method = 'POST',
    data,
    source,
    isNavigate = true,
    isShowErrorMessage = true,
    contentType = 'application/json',
    dataModel,
    customHeaders = {},  // Custom headers can override defaults
}: BackendCallOptions) => {
    // Set default headers
    let _headers: Record<string, string> = {
        'Content-Type': contentType,
        ...customHeaders,  // Merge any custom headers passed
    };

    // Remove Authorization header by default (no token added unless specified)
    // If you need to add a token, you can manually pass it via customHeaders.

    let _response: any = '';

    try {
        const response = await api({
            url,
            method,
            data,
            headers: _headers,
            cancelToken: source?.token,
        });

        _response = response.data;

        // If dataModel is provided, adapt the response data
        if (dataModel) {
            let adaptedData = dataModel.adapt(_response?.data);
            console.log('Data passed to model:', adaptedData);
            _response.data = adaptedData;
        }
    } catch (error: any) {
        const _responseData = error?.response?.data;
        if (isShowErrorMessage) {
            console.error('Error:', _responseData?.message || 'Unknown error');
        }
        _response = _responseData;

        if (error?.response?.status === 401 && isNavigate) {
            // handle unauthorized error (e.g., redirect to login)
            console.log('Redirecting due to 401');
            // window.location.replace("/"); 
            // localStorage.clear();
        }
    }

    return _response;
}
