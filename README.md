# JustLines - Quote Video Creator

Create beautiful videos with inspirational quotes using AI-powered topic analysis and background videos from Pexels.

## Features

- 🎯 **AI-Powered Topic Analysis**: Automatically categorizes quotes by topic
- 🎥 **Dynamic Video Selection**: Curated background videos from Pexels
- 📱 **TikTok Integration**: Upload videos directly to TikTok
- 🎨 **Beautiful UI**: Modern, animated interface with Tailwind CSS
- ⚡ **Fast Performance**: Built with React + TypeScript + Vite
- 🔄 **Real-time Preview**: See how your quote will look on the video

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd JustLines
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## API Setup

### Required APIs

1. **Pexels API** (for background videos)
   - Sign up at [Pexels](https://www.pexels.com/api/)
   - Get your API key
   - Add to `.env` as `VITE_PEXELS_API_KEY`

2. **TikTok API** (optional, for direct uploads)
   - Create a TikTok Developer account
   - Set up your app credentials
   - See [TikTok Setup Guide](./TIKTOK_SETUP.md) for detailed instructions

## How It Works

1. **Select a Quote**: Choose from inspirational quotes
2. **AI Analysis**: The app analyzes the quote's topic and mood
3. **Video Selection**: Browse curated background videos
4. **Create**: Generate a 30-second video with your quote overlay
5. **Share**: Download or upload directly to TikTok

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Build Tool**: Vite
- **Video Processing**: Canvas API + MediaRecorder
- **APIs**: Pexels, TikTok, Quote APIs

## Project Structure

```
src/
├── components/          # React components
├── services/           # API services
│   ├── quoteService.ts    # Quote fetching
│   ├── topicService.ts    # AI topic analysis
│   ├── videoService.ts    # Pexels video API
│   └── tiktokService.ts   # TikTok integration
├── App.tsx            # Main application
└── main.tsx           # Entry point
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
