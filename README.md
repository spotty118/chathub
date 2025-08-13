<p align="center">
    <img src="./src/assets/icon.png" width="150">
</p>

<h1 align="center">ChatHub</h1>

<div align="center">

### Install

<a href="https://chrome.google.com/webstore/detail/chathub-all-in-one-chatbo/iaakpnchhognanibcahlpcplchdfmgma?utm_source=github"><img src="https://user-images.githubusercontent.com/64502893/231991498-8df6dd63-727c-41d0-916f-c90c15127de3.png" width="200" alt="Get ChatHub for Chromium"></a>

</div>

## 📷 Screenshot

![Screenshot](screenshots/extension.png?raw=true)

## 🤝 Sponsors

<a href="https://getstream.io/chat/sdk/react/?utm_source=github&utm_medium=referral&utm_content=&utm_campaign=wong2">
  <img src="screenshots/stream-logo.jpg" width="200" />
</a>

## ✨ Features

- 🤖 Use different chatbots in one app, currently supporting ChatGPT, new Bing Chat, Google Bard, Claude, and open-source models including LLama2, Vicuna, ChatGLM etc
- 💬 Chat with multiple chatbots at the same time, making it easy to compare their answers
- 🚀 Support ChatGPT API and GPT-4 Browsing
- 🔍 Shortcut to quickly activate the app anywhere in the browser
- 🎨 Markdown and code highlight support
- 📚 Prompt Library for custom prompts and community prompts
- 💾 Conversation history saved locally
- 📥 Export and Import all your data
- 🔗 Share conversation to markdown
- 🌙 Dark mode
- 🌐 Web access

## 🤖 Supported Bots

- ChatGPT (via Webapp/API/Azure/Poe)
- Bing Chat
- Google Bard
- Claude 2 (via Webapp/API/Poe)
- LLaMA 2
- ChatGLM
- Pi by Inflection
- Vicuna
- WizardLM
- iFlytek Spark
- Tongyi Qianwen
- Baichuan
- ...

## 🔨 Build from Source

- Clone the source code
- `corepack enable`
- `yarn install`
- `yarn build`
- In Chrome/Edge go to the Extensions page (chrome://extensions or edge://extensions)
- Enable Developer Mode
- Drag the `dist` folder anywhere on the page to import it (do not delete the folder afterward)

## Local OpenAI-compatible Proxy (Cline/Roocode/Kilocode)

ChatHub can expose a local OpenAI-compatible HTTP API so VS Code extensions like Cline, Roocode, and Kilocode can connect to your configured providers via the browser extension.

What you get:
- HTTP endpoints on http://127.0.0.1:4891
  - GET /v1/models
  - POST /v1/chat/completions (supports streaming via SSE)
  - POST /v1/embeddings
- Requests are routed through ChatHub, reusing your configured providers and sessions.

Setup
1) Build and load the extension
   - corepack enable
   - yarn install
   - yarn build
   - Load dist into Chrome/Edge as an unpacked extension

2) Install the Native Host (provides the local HTTP server)
   - cd native-host
   - chmod +x install.sh
   - ./install.sh __EXTENSION_ID__
     - Replace __EXTENSION_ID__ with your loaded extension’s ID from chrome://extensions
     - This installs:
       - /usr/local/bin/chathub-native-host (the server)
       - Native messaging manifest under the Chrome native hosts directory

3) Enable the proxy in the extension settings
   - Open ChatHub, go to Settings
   - Ensure your provider keys/sessions are configured (e.g. OpenAI)
   - The native bridge starts automatically; the local server listens on 4891 by default

Quick tests
- curl -s http://127.0.0.1:4891/v1/models
- curl -s -H "Authorization: Bearer test" -H "Content-Type: application/json" -d '{"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"hello"}]}' http://127.0.0.1:4891/v1/chat/completions
- Streaming:
  - curl -N -s -H "Authorization: Bearer test" -H "Content-Type: application/json" -d '{"model":"gpt-3.5-turbo","stream":true,"messages":[{"role":"user","content":"hi"}]}' http://127.0.0.1:4891/v1/chat/completions

VS Code client configuration
- Base URL: http://127.0.0.1:4891
- API Key: any placeholder (e.g., chathub-local). If you have an actual OpenAI key set in ChatHub settings, it will be used automatically.
- Cline/Roocode/Kilocode should work without additional changes.

Notes
- The extension requires “Native Messaging” permission.
- The local server currently supports OpenAI-compatible endpoints. More providers/routes will appear as you configure them inside ChatHub.
- For dev builds, extension ID changes; re-run the installer if the ID changes.
