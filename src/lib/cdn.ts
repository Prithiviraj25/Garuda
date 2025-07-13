import axios from "axios";

const baseUrl = process.env.NEXT_PUBLIC_CDN_URL;

if(!baseUrl){
    throw new Error("NEXT_PUBLIC_CDN_URL is not set");
}

const cdnInstance = axios.create({
    baseURL: baseUrl,
})

export const uploadFile = async (file: File) : Promise<{
    message: string;
    key: string;
    url: string;
}> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await cdnInstance.post("/upload", formData);
    return {
        message: response.data.message,
        key: response.data.key,
        url: `${baseUrl}/get/${response.data.key}`,
    };
}

export const getFile = async (key: string) : Promise<File> => {
    try {
        const response = await axios.get(`${baseUrl}/get/${key}`, {
          responseType: 'blob',
        });
        return response.data;
      } catch (err) {
        console.error(err)
        throw new Error('Failed to fetch file from CDN');
      }
}