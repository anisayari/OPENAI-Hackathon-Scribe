# Scribe App - AI-Powered Script Editor with Voice & Fine-Tuning

A professional script editing application that combines real-time collaboration, AI voice assistance, and custom fine-tuning capabilities.

## 🚀 Features

- **Real-time Script Editing**: Collaborative document editing with Firebase sync
- **AI Voice Assistant**: OpenAI Realtime API integration for voice interactions
- **Custom Fine-Tuning**: Train custom GPT models on your writing style
- **Multi-format Support**: Import scripts from PDF, DOCX, TXT files
- **Professional UI**: Modern, responsive interface built with Next.js and Tailwind CSS

## 🛠 Tech Stack

- **Frontend**: Next.js 15.3, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Backend**: Next.js API Routes, Firebase Admin SDK
- **Database**: Firebase Firestore (real-time sync)
- **AI Integration**: 
  - OpenAI GPT-4 for chat
  - OpenAI Realtime API for voice
  - OpenAI Fine-tuning API for custom models
- **File Processing**: PDF.js, Mammoth.js for document parsing

## 📋 Prerequisites

- Node.js 18+ and npm
- OpenAI API key
- Firebase project with Firestore enabled
- Firebase service account credentials

## 🔧 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd scribe-app
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file with your credentials:
```env
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...your-key...\n-----END PRIVATE KEY-----"

# Firebase Client SDK Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# OpenAI API Configuration
OPENAI_API_KEY=your-openai-api-key
```

4. Set up Firebase:
   - Create a new Firebase project
   - Enable Firestore database
   - Download service account key and add credentials to `.env.local`
   - Copy web app configuration to the `NEXT_PUBLIC_FIREBASE_*` variables

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🎯 How It Works

### Script Editing
- Documents are stored in Firestore and synced in real-time
- Each script has a unique ID and updates are instantly reflected across all clients
- Rich text editing with markdown support

### Voice Assistant
- Click the microphone button to start voice interaction
- Uses OpenAI's Realtime API for natural conversation
- Can help with writing, editing, and brainstorming

### Fine-Tuning
1. **Prepare Training Data**: Select existing scripts or upload documents
2. **Create Training Job**: The app formats your content into training examples
3. **Monitor Progress**: Track the status of your fine-tuning jobs
4. **Use Custom Model**: Select your fine-tuned model for personalized AI assistance

### File Upload
- Supports PDF, DOCX, and TXT files
- Automatically extracts text content for fine-tuning
- Preserves formatting and structure

## 📁 Project Structure

```
scribe-app/
├── app/
│   ├── api/              # API routes
│   │   ├── fine-tuning/  # Fine-tuning endpoints
│   │   ├── session/      # Voice session management
│   │   └── parse-file/   # File parsing
│   ├── page.tsx          # Main editor page
│   └── layout.tsx        # Root layout
├── components/
│   ├── DocumentEditor.tsx    # Main editor component
│   ├── VoiceControl.tsx      # Voice interface
│   ├── FineTuningPanel.tsx   # Fine-tuning UI
│   └── FileUpload.tsx        # File upload handler
├── lib/
│   ├── firebase.ts           # Firebase client config
│   └── firebase-admin.ts     # Firebase admin config
└── public/                   # Static assets
```

## 🔐 Security

- API keys are stored in environment variables
- Firebase Admin SDK for server-side operations
- Client-side Firebase SDK with security rules
- OpenAI API calls are proxied through API routes

## ✅ Development Status

### Completed Features
- [x] Real-time collaborative document editing
- [x] Firebase Firestore integration
- [x] OpenAI voice assistant with Realtime API
- [x] Fine-tuning pipeline for custom models
- [x] File upload support (PDF, DOCX, TXT)
- [x] Rich text editor with formatting toolbar
- [x] **AI typing assistant that monitors writing in real-time**
- [x] **Context-aware selection menu with AI actions**
- [x] API endpoints for all AI features
- [x] Responsive UI design

### In Progress
- [ ] Testing AI selection actions (rewrite, expand, summarize)
- [ ] Testing fine-tuning with actual training data
- [ ] Optimizing real-time typing analysis performance

### TODO
- [ ] Add user authentication
- [ ] Implement script versioning
- [ ] Add export functionality (PDF, DOCX)
- [ ] Enhance voice commands with more actions
- [ ] Add collaborative cursors for multi-user editing
- [ ] Implement script templates library
- [ ] Add analytics dashboard
- [ ] Support for multiple languages in AI features
- [ ] Implement auto-save and version history
- [ ] Add offline mode support
- [ ] Create browser extension for cross-platform editing

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Firebase Permission Errors
- Check that your Firebase security rules allow read/write access
- Verify service account credentials are correct
- Ensure Firestore is enabled in your Firebase project

### OpenAI API Errors
- Verify your API key is valid and has sufficient credits
- Check that you're using a model that supports fine-tuning
- Ensure training data meets OpenAI's requirements (min 10 examples)

### Voice Features Not Working
- Check browser permissions for microphone access
- Ensure you're using a supported browser (Chrome, Edge, Safari)
- Verify OpenAI Realtime API access is enabled for your account

## 📧 Support

For issues and questions, please open an issue on GitHub.