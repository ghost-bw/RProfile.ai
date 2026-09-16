# Render + Vercel deployment

This repository is configured for:

- Backend: Render Web Service using `backend/Dockerfile`
- Frontend: Vercel using the Vite build in `frontend/`
- Database: MongoDB Atlas (recommended for production)

## 1. Prepare MongoDB Atlas

Create a MongoDB Atlas cluster and database user. Add `0.0.0.0/0` to the Atlas network access list only if you understand the tradeoff; a restricted network policy is preferable for production. Copy the Atlas connection string for `MONGO_URI`.

## 2. Deploy the backend to Render

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. In Render, choose **New > Blueprint** and select the repository.
3. Render will detect `render.yaml` and create `resumepro-api`.
4. Set `MONGO_URI`, `FRONTEND_URL`, and the provider API/email variables in the Render service environment settings.
5. Deploy and verify:

```text
https://<your-render-service>.onrender.com/health
```

`FRONTEND_URL` may contain comma-separated origins, for example:

```text
https://<your-app>.vercel.app,https://<your-preview>.vercel.app
```

Use origins only, without a trailing path or `/api`.

Required backend variables:

```text
NODE_ENV=production
MONGO_URI=<MongoDB Atlas connection string>
JWT_SECRET=<long random secret; Render can generate this>
FRONTEND_URL=https://<your-app>.vercel.app
```

Configure these only when the corresponding feature is used:

```text
EMAIL_USER
EMAIL_PASS
GOOGLE_CLIENT_ID
PINECONE_API_KEY
PINECONE_INDEX
GROQ_API_KEY
RAPIDAPI_KEY
JUDGE0_API_URL
JUDGE0_API_KEY
ELEVENLABS_API_KEY
ELEVENLABS_VOICE_ID
ELEVENLABS_MODEL_ID
```

## 3. Deploy the frontend to Vercel

1. In Vercel, choose **Add New > Project** and import the same repository.
2. Set **Root Directory** to `frontend`.
3. Use these build settings:

```text
Framework preset: Vite
Install command: npm install
Build command: npm run build
Output directory: dist
```

4. Add this environment variable for Preview and Production:

```text
VITE_API_URL=https://<your-render-service>.onrender.com/api
```

5. Deploy the frontend.
6. Copy the final Vercel URL into Render's `FRONTEND_URL`, then redeploy the backend.

The `frontend/vercel.json` rewrite keeps React Router routes working after a page refresh.

## 4. Authentication and cookies

The backend uses an HttpOnly `auth_token` cookie. Axios is configured with `withCredentials: true`, and the backend enables credentialed CORS. In production the cookie is `Secure` and `SameSite=None`, which is required because Vercel and Render use different domains.

After deployment, test login, refresh a protected route, logout, and login again. Do not put `JWT_SECRET`, MongoDB credentials, or provider API keys in Vercel variables or frontend source; Vite variables are exposed to the browser.

## 5. Upload storage warning

Render's local filesystem is ephemeral. Uploaded resumes saved under `backend/uploads` can disappear after a deploy or restart. For production, move uploads to S3 or another durable object-storage service before relying on this deployment.