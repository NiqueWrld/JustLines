// TikTok API Service
// Note: This is a simplified implementation. In production, you'll need proper OAuth2 flow
// and handle TikTok's authentication requirements properly.

export interface TikTokUploadOptions {
  title: string;
  description: string;
  privacy_level: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY';
  disable_duet?: boolean;
  disable_comment?: boolean;
  disable_stitch?: boolean;
  brand_content_toggle?: boolean;
  brand_organic_toggle?: boolean;
}

export interface TikTokUploadResponse {
  data: {
    publish_id: string;
    upload_url: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface TikTokAuthConfig {
  clientKey: string;
  clientSecret: string;
  redirectUri: string;
  accessToken?: string;
}

class TikTokService {
  private config: TikTokAuthConfig;
  private baseUrl = 'https://open.tiktokapis.com/v2';

  constructor(config: TikTokAuthConfig) {
    this.config = config;
  }

  // Step 1: Get authorization URL for OAuth2 flow
  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      client_key: this.config.clientKey,
      scope: 'video.upload',
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      state: Math.random().toString(36).substring(7), // Random state for security
    });

    return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
  }

  // Step 2: Exchange authorization code for access token
  async exchangeCodeForToken(code: string): Promise<string> {
    const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: this.config.clientKey,
        client_secret: this.config.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Failed to exchange code for token: ${data.error_description || data.error}`);
    }

    this.config.accessToken = data.access_token;
    return data.access_token;
  }

  // Step 3: Initialize video upload and get upload URL
  async initializeVideoUpload(options: TikTokUploadOptions): Promise<TikTokUploadResponse> {
    if (!this.config.accessToken) {
      throw new Error('Access token is required. Please authenticate first.');
    }

    const response = await fetch(`${this.baseUrl}/post/publish/video/init/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_info: {
          title: options.title,
          description: options.description,
          privacy_level: options.privacy_level,
          disable_duet: options.disable_duet || false,
          disable_comment: options.disable_comment || false,
          disable_stitch: options.disable_stitch || false,
          brand_content_toggle: options.brand_content_toggle || false,
          brand_organic_toggle: options.brand_organic_toggle || false,
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: 0, // Will be set when uploading
        },
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Failed to initialize upload: ${data.error?.message || 'Unknown error'}`);
    }

    return data;
  }

  // Step 4: Upload video file to TikTok
  async uploadVideoFile(uploadUrl: string, videoBlob: Blob): Promise<void> {
    const formData = new FormData();
    formData.append('video', videoBlob, 'video.webm');

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload video: ${response.statusText}`);
    }
  }

  // Step 5: Publish the uploaded video
  async publishVideo(publishId: string): Promise<void> {
    if (!this.config.accessToken) {
      throw new Error('Access token is required. Please authenticate first.');
    }

    const response = await fetch(`${this.baseUrl}/post/publish/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        publish_id: publishId,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Failed to publish video: ${data.error?.message || 'Unknown error'}`);
    }
  }

  // Complete upload process (combines all steps)
  async uploadVideo(videoBlob: Blob, options: TikTokUploadOptions): Promise<void> {
    try {
      // Step 1: Initialize upload
      const initResponse = await this.initializeVideoUpload(options);
      
      if (initResponse.error) {
        throw new Error(initResponse.error.message);
      }

      // Step 2: Upload video file
      await this.uploadVideoFile(initResponse.data.upload_url, videoBlob);

      // Step 3: Publish video
      await this.publishVideo(initResponse.data.publish_id);

    } catch (error) {
      console.error('TikTok upload failed:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.config.accessToken;
  }

  // Set access token manually (for development/testing)
  setAccessToken(token: string): void {
    this.config.accessToken = token;
  }
}

// Export a singleton instance
// In production, you should get these from environment variables
const getRedirectUri = () => {
  // Use current origin for redirect URI
  const origin = window.location.origin
  return import.meta.env.VITE_TIKTOK_REDIRECT_URI || `${origin}/tiktok-callback`
}

const tiktokConfig: TikTokAuthConfig = {
  clientKey: import.meta.env.VITE_TIKTOK_CLIENT_KEY || '',
  clientSecret: import.meta.env.VITE_TIKTOK_CLIENT_SECRET || '',
  redirectUri: getRedirectUri(),
};

export const tiktokService = new TikTokService(tiktokConfig);
export default TikTokService;
