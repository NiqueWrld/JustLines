# TikTok Integration Setup

This guide will help you set up TikTok integration for your JustLines app.

## Prerequisites

1. TikTok Developer Account
2. TikTok App Registration

## Step 1: Create TikTok Developer Account

1. Visit [TikTok Developers](https://developers.tiktok.com/)
2. Sign up for a developer account
3. Complete the verification process

## Step 2: Create a TikTok App

1. Go to your TikTok Developer Dashboard
2. Click "Create an App"
3. Fill in the required information:
   - App Name: JustLines
   - App Description: Create videos with inspirational quotes
   - App Category: Entertainment
4. Submit for review and wait for approval

## Step 3: Get API Credentials

Once your app is approved:

1. Go to your app's dashboard
2. Copy your **Client Key** and **Client Secret**
3. Set up your redirect URI (e.g., `http://localhost:5173/tiktok-callback`)

## Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env`
2. Fill in your TikTok credentials:

```env
VITE_TIKTOK_CLIENT_KEY=your_client_key_here
VITE_TIKTOK_CLIENT_SECRET=your_client_secret_here
VITE_TIKTOK_REDIRECT_URI=http://localhost:5173/tiktok-callback
```

## Step 5: Set Up Routing (Optional)

If you want to handle the TikTok callback properly, you can set up routing:

```bash
npm install react-router-dom
```

Then add the callback route to your app.

## Features

- **OAuth2 Authentication**: Secure login with TikTok
- **Direct Upload**: Upload videos directly to TikTok
- **Auto-generated Descriptions**: Automatically creates descriptions with hashtags
- **Privacy Controls**: Set video privacy levels

## Security Notes

- Never commit your API keys to version control
- Use environment variables for sensitive data
- The current implementation is for development/demo purposes
- For production, implement proper error handling and token refresh

## Troubleshooting

### Common Issues

1. **Authentication Failed**: Check your client key and redirect URI
2. **Upload Failed**: Ensure your app has video upload permissions
3. **CORS Errors**: TikTok API requires server-side implementation for production

### Production Considerations

For production use, you should:
- Implement server-side OAuth flow
- Add proper error handling
- Implement token refresh mechanism
- Add rate limiting
- Use HTTPS for redirect URIs

## API Limitations

- Video length: 15 seconds to 10 minutes
- File size: Up to 128MB
- Supported formats: MP4, MOV, WEBM
- Rate limits apply (check TikTok documentation)

## Support

For TikTok API issues, visit the [TikTok Developer Documentation](https://developers.tiktok.com/doc/).
