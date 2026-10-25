# Google Keep Clone

A minimalist note-taking application inspired by Google Keep, built with React, TypeScript, and Supabase.

## Features

- ✨ Clean, minimalist UI inspired by Google Keep
- 🔐 Secure authentication with Supabase
- 📝 Create, edit, and delete notes
- 🖼️ Paste, upload, or drop photos into notes using private Supabase Storage
- 📌 Pin important notes
- 🎨 **NEW**: Choose from 10 background colors for notes
- 🔍 **NEW**: Real-time search across title and content
- ⌨️ **NEW**: Keyboard shortcuts for power users
- 📱 Fully responsive design (mobile, tablet, desktop)
- 🔄 Optimistic updates for instant feedback
- 🎯 Grid and list view modes

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: TanStack Query (React Query) v5
- **Backend**: Supabase (PostgreSQL + Auth)
- **Routing**: React Router DOM

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Database Setup

1. Create a new table in your Supabase project:

\`\`\`sql
CREATE TABLE notes (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
user_id UUID REFERENCES auth.users NOT NULL,
title TEXT,
content TEXT,
is_pinned BOOLEAN DEFAULT false,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),
bg_color TEXT DEFAULT 'white'
);

-- Enable Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notes
CREATE POLICY "Users can view own notes"
ON notes FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own notes
CREATE POLICY "Users can insert own notes"
ON notes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own notes
CREATE POLICY "Users can update own notes"
ON notes FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own notes
CREATE POLICY "Users can delete own notes"
ON notes FOR DELETE
USING (auth.uid() = user_id);
\`\`\`

### Installation

1. Clone the repository or navigate to the project directory

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Create a \`.env.local\` file in the root directory:
   \`\`\`env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   \`\`\`

   You can find these values in your Supabase project settings under API.

4. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

5. Open your browser and navigate to `http://localhost:5173`

### Photo storage setup

1. Open your Supabase project's **SQL Editor** and run
   [`supabase/migrations/20261025000000_note_images.sql`](supabase/migrations/20261025000000_note_images.sql).
   This creates the private `note-images` bucket, a 5 MB per-file limit, and policies
   that let signed-in users upload and view only files inside their own user folder.
   If you already use Supabase CLI migrations, apply it through your normal migration workflow.
2. The app uses your existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   Optionally set `VITE_SUPABASE_IMAGES_BUCKET=note-images`. To use another bucket,
   replace `note-images` in the SQL and set this variable to the same name.
3. Restart the development server after changing environment variables.

In a text note, click **Upload photo**, paste a copied photo or screenshot with
**Ctrl/⌘ + V**, or drag photo files into the writing area. JPEG, PNG, WebP, and GIF
files are supported, up to 5 MB each. Multiple files can be selected at once.
JPEG and PNG photos (including pasted screenshots) are converted to WebP in your
browser before uploading, at 85% quality with their original dimensions and
transparency. Existing WebP files are uploaded unchanged; GIF files stay in their
original format to preserve animations. If WebP encoding is unavailable, the app
shows an error before uploading. Very small images may grow when converted.
Wait for uploads to finish before leaving the note; photos save automatically,
including notes with no text or title. Select a photo and press Backspace/Delete
to remove it from the note.

Photos use Supabase's S3-compatible Storage through its browser SDK and the user's
authenticated session. No S3 access keys or service-role keys belong in the frontend.
Notes store object paths; signed image URLs are generated on opening the note and
refreshed while it stays open. Files remain private under the bucket's access policies.
See the [Supabase private bucket documentation](https://supabase.com/docs/guides/storage/buckets/fundamentals).

Removing a photo deletes its stored object after the updated note is saved. Moving
a note to Trash keeps its photos so they remain available if the note is restored;
permanently deleting a note or emptying Trash also removes its stored photos.

## Project Structure

\`\`\`
src/
├── components/
│ ├── layout/ # Header, navigation
│ ├── notes/ # Note-related components
│ └── ui/ # Reusable UI primitives
├── hooks/ # Custom React hooks
├── lib/ # Utility functions and config
├── pages/ # Page components
├── types/ # TypeScript type definitions
├── App.tsx # Main app component with routing
├── main.tsx # App entry point
└── index.css # Global styles
\`\`\`

## Usage

### Basic Operations

1. **Sign Up/Sign In**: Create an account or sign in with existing credentials
2. **Create Notes**: Click "Take a note..." to create a new note
3. **Edit Notes**: Click on any note to edit it
4. **Pin Notes**: Hover over a note and click the pin icon
5. **Delete Notes**: Hover over a note and click the trash icon
6. **Toggle View**: Click the grid/list icon in the header to switch views

### Search

- Type in the search bar to filter notes by title or content
- Click the X icon to clear search
- Empty result shows "No notes found" message

### Color Picker

- When creating or editing a note, select from 10 predefined colors
- Colors include: White, Red, Orange, Yellow, Green, Teal, Blue, Purple, Pink, Gray
- Selected color shows a checkmark

### Keyboard Shortcuts

| Shortcut         | Action                   |
| ---------------- | ------------------------ |
| `Ctrl/⌘ + K`     | Focus search bar         |
| `Ctrl/⌘ + N`     | Create new note          |
| `Ctrl/⌘ + /`     | Show keyboard shortcuts  |
| `Esc`            | Close modals and inputs  |
| `Ctrl/⌘ + Enter` | Save note (in edit mode) |

_Note: Use `⌘` (Command) on Mac or `Ctrl` on Windows/Linux_

## Building for Production

\`\`\`bash
npm run build
\`\`\`

The built files will be in the `dist` directory.

## License

MIT
