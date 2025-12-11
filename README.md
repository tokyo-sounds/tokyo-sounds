# Tokyo Sounds

A 3D interactive web app combining Google Maps Photorealistic 3D Tiles and Google Lyria to simulate paper plane flight over Tokyo. Powered by Next.js and R3F.

## Features

- **Repository Chatbot**: AI-powered chatbot specifically for the tokyo-sounds repository, using Vercel AI SDK 5, Gemini 2.5 Pro, and Google's cached content feature
- **3D Visualization**: Interactive 3D Tokyo cityscape using React Three Fiber
- **Generative Audio**: Real-time audio generation with Google Lyria

## Getting Started

First, install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Required: Google Generative AI API Key for Gemini
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here

# Optional but Recommended: GitHub Personal Access Token
# Without token: 60 requests/hour (unauthenticated)
# With token: 5,000 requests/hour (authenticated)
GITHUB_TOKEN=your_github_token_here
```

### Setting Up GitHub Personal Access Token

The GitHub token is **highly recommended** for the repository chatbot feature, as it significantly increases the API rate limit:

1. Go to [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Click **"Generate new token (classic)"**
3. Give it a descriptive name (e.g., "Tokyo Sounds Chatbot")
4. Set an expiration date (or no expiration for development)
5. Select the following scopes:
   - ✅ `public_repo` - Access public repositories (required for public repos)
   - ✅ `repo` - Full control of private repositories (only if tokyo-sounds is private)
6. Click **"Generate token"**
7. **Copy the token immediately** (you won't be able to see it again)
8. Add it to your `.env.local` file as `GITHUB_TOKEN=your_token_here`

**Why GitHub Token is Important:**
- Without token: Limited to 60 API requests per hour
- With token: 5,000 API requests per hour
- Essential for fetching large repositories with many files

### Setting Up Google Generative AI API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the API key
5. Add it to your `.env.local` file as `GOOGLE_GENERATIVE_AI_API_KEY=your_key_here`

### Running the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Repository Chatbot

The chatbot is specifically configured for the [tokyo-sounds repository](https://github.com/tokyo-sounds/tokyo-sounds). It automatically loads the repository cache when you visit `/chat` and allows you to ask questions about the codebase.

**Usage:**
1. Navigate to `/chat` in your browser
2. Wait for the repository cache to load (happens automatically)
3. Start asking questions about the codebase!

**Example questions:**
- "What is the main purpose of this repository?"
- "Explain the architecture"
- "How does the 3D rendering work?"
- "Show me the audio generation implementation"

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
