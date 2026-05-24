# Karela

An application that supports Scrum teams.

## Setup guide

### Overview

Before running the app, you need to complete 3 tasks:

1. Prepare the backend environment file.
2. Create and connect a Jira app if you want Jira features.
3. Run the backend and frontend.

The steps below are separated so you can follow them one by one.

### 1. Create the backend `.env` file

Open a terminal and go to the backend folder:

```bash
cd src/backend
```

Create `.env` from the example file:

```bash
cp .env.example .env
```

Now open [src/backend/.env](src/backend/.env) and fill in the value after each `=` on the correct line.

Pay attention to these variables:

- `LLM_PROVIDER`: choose `gemini` or `openai`.
- `GEMINI_API_KEYS`: fill this only when `LLM_PROVIDER=gemini`.
- `OPENAI_API_KEYS`: fill this only when `LLM_PROVIDER=openai`.
- `MINERU_TOKEN`: needed if you use MinerU-related features.

Where to get them:

- `GEMINI_API_KEYS`: get it from https://aistudio.google.com/. You can enter multiple keys separated by commas.
- `OPENAI_API_KEYS`: get it from https://platform.openai.com/. You can enter multiple keys separated by commas.
- `MINERU_TOKEN`: get it from http://mineru.net/.

Example:

```dotenv
LLM_PROVIDER=gemini
GEMINI_API_KEYS=key_1,key_2
MINERU_TOKEN=your_token_here
```

### 2. Configure the Jira app

Do this only if you want to use Jira features.

#### 2.1. Create the Jira app and get the Client ID / Secret

1. Open https://developer.atlassian.com/console/myapps.
2. Create a new Jira app.
3. Select the app you created.
4. Open **Settings**.
5. Copy the `client id` and `secret` into these fields in [src/backend/.env](src/backend/.env):

```dotenv
JIRA_CLIENT_ID=
JIRA_CLIENT_SECRET=
```

#### 2.2. Configure the OAuth callback and webhook URL

You need a **public domain** so Jira can reach your backend. For example, if your backend runs at `https://api.example.com`, then these URLs must use that domain.

Set the following values in [src/backend/.env](src/backend/.env) using your real backend domain:

```dotenv
JIRA_OAUTH_URL=https://your-backend-domain/api/v1/integrations/jira/oauth/callback
JIRA_WEBHOOK_URL=https://your-backend-domain/api/v1/integrations/jira/webhook
```

Then go back to https://developer.atlassian.com/console/myapps and do the following:

1. Select the app you created.
2. Open **Authorization**.
3. Click **Configure**.
4. Paste both URLs into the **Callback URLs** field.

### 3. Run the backend

You can choose **one** of the two options below.

#### Option 1: Docker only

This is the simplest way if you only need to run the app.

```bash
cd src/backend
docker compose up --build
```

#### Option 2: Run manually for more flexibility, including tests

This option is better if you want to debug or run tests.

1. Create a Python virtual environment.
2. Activate the virtual environment.
3. Install dependencies.
4. Start the supporting services required by the backend.
5. Start the backend with `python main.py`.

```bash
cd src/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
docker compose -f docker-compose-services.yml up -d
python main.py
```

**Note:** on Windows, this approach may run into Redis issues because the terminal cannot fork the same way as on Linux.

### 4. Run the frontend

#### Option 1: Docker

```bash
cd src/frontend
docker compose up --build
```

#### Option 2: Run manually

**You need Node.js installed.**

If you want to run the production build:

```bash
cd src/frontend
npm run build
npm run start
```

If you want to run the app while editing code:

```bash
npm run dev
```

### 5. Open the app

Open http://localhost:3000 in your browser to use the app.

# Karela

An application that supports Scrum teams.

## Step-by-step setup

### 1. Prepare the backend environment file

Go to `src/backend` and create `.env` from `.env.example`.

```bash
cd src/backend
cp .env.example .env
```

Then fill in the following values:

- `GEMINI_API_KEYS`: use this when `LLM_PROVIDER=gemini`. Get API keys from https://aistudio.google.com/. You can provide multiple keys, separated by commas.
- `OPENAI_API_KEYS`: use this when `LLM_PROVIDER=openai`. Get API keys from https://platform.openai.com/. You can provide multiple keys, separated by commas.
- `MINERU_TOKEN`: get the token from http://mineru.net/.

### 2. Configure the Jira app

Fill in the following values so the app can connect to Jira:

1. `JIRA_CLIENT_ID` and `JIRA_CLIENT_SECRET`
   - Open https://developer.atlassian.com/console/myapps and create a new Jira app.
   - Select the app you created, open settings, and copy the `client id` and `secret` into `.env`.

2. `JIRA_OAUTH_URL` and `JIRA_WEBHOOK_URL`
   - You need a public domain so Jira can reach the backend.
   - Replace `your-backend-domain` with the real backend domain.
   - Then go to https://developer.atlassian.com/console/myapps, select the app, open Authorization, click Configure, and add both URLs to the Callback URLs field.

### 3. Run the backend

You can choose one of the two options below.

#### Option 1: Docker only

Go to `src/backend` and run the `docker-compose.yml` file.

```bash
cd src/backend
docker compose up --build
```

#### Option 2: Run manually for more flexibility, including tests

1. Create and activate a Python virtual environment.
2. Install dependencies with `pip install -r requirements.txt`.
3. Start the backend services using `docker-compose-services.yml`.
4. Start the backend with `python main.py`.

```bash
cd src/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
docker compose -f docker-compose-services.yml up -d
python main.py
```

Note: on Windows, this approach may hit Redis-related issues because the terminal cannot fork the same way as on Linux.

### 4. Run the frontend

#### Option 1: Docker

Go to `src/frontend` and run the `docker-compose.yml` file.

```bash
cd src/frontend
docker compose up --build
```

#### Option 2: Run manually

You need Node.js installed. Go to `src/frontend` and run:

```bash
cd src/frontend
npm run build
npm run start
```

If you want to run the app while editing code, use:

```bash
npm run dev
```

### 5. Open the app

Open http://localhost:3000 in your browser to use the app.
