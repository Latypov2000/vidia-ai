# Vidia AI

AI-assisted automatic video editor. Upload a video, analyze its audio, remove long silent gaps, and export a first-pass cut.

## MVP status

This repository starts with a working upload-and-rough-cut foundation. The current editor detects silence with FFmpeg; semantic highlight detection, scene understanding, narrative assembly, and music selection are planned, not yet implemented.

## Run locally

Requirements: Docker and Docker Compose.

```bash
docker compose up --build
```

Open http://localhost:3000. The API is available at http://localhost:8000.

## Notes

- Uploaded files and exports are stored in the API container's `/data` directory. For production, attach persistent storage and configure authentication, upload limits, and retention policies.
- FFmpeg silence detection is a rough cut, not semantic AI editing.
