# octra terminal client

a terminal wallet reminiscent of dos-era tui interfaces — but built with modern asynchronous architecture

## what it does

- shows your octra wallet balance and tx history  
- lets you send one or many transactions  
- exports your private key or full wallet file  

## works on

- linux  
- mac  
- windows (some features like clipboard may not work)

## what you need

- python 3.8 or higher  
- internet connection  
- your wallet file (private key)

## how to install and run (step by step)

1. open terminal  

2. run these commands one by one:

```bash
git clone https://github.com/octra-labs/octra_pre_client.git
cd octra_pre_client
python3 -m venv venv
source venv/bin/activate # for windows use: venv\Scripts\activate
pip install -r requirements.txt
cp wallet.json.example wallet.json
```

3. open wallet.json and edit it (change placeholders to your wallet data):

```json
{
  "priv": "private-key-here",
  "addr": "octxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "rpc": "https://octra.network"
}
```

3. run

```bash
./run.sh       # on linux/mac
run.bat        # on windows
```

---
---
---
# Octra FastAPI Wallet API Setup Guide

**Important:** You should perform these setup steps on your own laptop or server before using or exposing the API. Do not run this on shared or untrusted machines, as your wallet keys and funds may be at risk.

This guide will help you set up and run the Octra wallet API server using FastAPI, and use the modern web UI dashboard, optionally exposing it to the internet using ngrok.

---

## 1. Prerequisites

- Python 3.8+
- `pip` (Python package manager)
- (Recommended) A virtual environment tool like `venv` or `virtualenv`
- [ngrok](https://ngrok.com/) (for tunneling, optional)

---

## 2. Clone or Download the Project

Navigate to your desired directory and clone/download the project files.

---

## 3. Set Up a Virtual Environment (Recommended)

```
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

---

## 4. Install Requirements

Make sure you are in the project directory (where `requirements.txt` is located):

```
pip install -r requirements.txt
```

This will install FastAPI, Uvicorn, and all other dependencies.

---

## 5. Run the FastAPI Server (with UI)

```
uvicorn api_server:app --reload
```

- The **web UI dashboard** is available at: [http://127.0.0.1:8000/ui/index.html](http://127.0.0.1:8000/ui/index.html)
- The **API endpoints** are available at the root, e.g. [http://127.0.0.1:8000/balance](http://127.0.0.1:8000/balance)
- The root URL [http://127.0.0.1:8000/](http://127.0.0.1:8000/) redirects to the UI for convenience.

---

## 6. Modern Web UI Features

- **Beautiful result display:**
  - Success, error, and info messages are shown as Bootstrap alerts.
  - JSON responses are shown in syntax-highlighted `<pre>` blocks (using highlight.js).
  - Sensitive/large data (like keys and wallet config) are shown in a modal, with a “Copy” button for easy copying.
  - All actions animate the display of results and errors, and show timing info.
- **Do not open `index.html` directly from your file system!** Always use the HTTP URL above.

---

## 7. Automating wallet.json Setup via API

Instead of manually editing `wallet.json`, you can now use the API to view and update your wallet configuration.

### View Current Wallet Config (without private key)

```
curl http://127.0.0.1:8000/wallet_config
```

### View Full Wallet Config (with private key)

```
curl http://127.0.0.1:8000/wallet_config/with_priv
```
**Warning:** This endpoint exposes your private key. Use only for admin/debug purposes.

### Update wallet.json via API

You can update any of the fields (`priv`, `addr`, `rpc`). Only the fields you provide will be updated; others will remain unchanged.

Example (update all fields):
```
curl -X POST "http://127.0.0.1:8000/wallet_config?priv=your_private_key&addr=octxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx&rpc=https://octra.network"
```

Example (update just the RPC URL):
```
curl -X POST "http://127.0.0.1:8000/wallet_config?rpc=https://octra.network"
```

After updating, the API will return the new config (with the private key masked).

---

## 8. Expose the API and UI to the Internet with ngrok (Optional)

If you want to access your API and UI from outside your local network (e.g., for mobile apps, remote testing, or sharing with others), you can use ngrok.

### a. Download and Install ngrok

- Go to [https://ngrok.com/download](https://ngrok.com/download) and download ngrok for your OS.
- Unzip and place the `ngrok` executable in your PATH or project directory.

### b. Start ngrok Tunnel

With your FastAPI server running (see step 5), open a new terminal and run:

```
ngrok http 8000
```

- This will create a public URL (e.g., `https://abcd1234.ngrok.io`) that tunnels to your local API and UI.
- The ngrok dashboard will show the forwarding URL. Example output:

```
Forwarding                    http://abcd1234.ngrok.io -> http://localhost:8000
Forwarding                    https://abcd1234.ngrok.io -> http://localhost:8000
```

- Now you (or anyone you share the URL with) can access your UI at:
  - `https://abcd1234.ngrok.io/ui/index.html` (web dashboard)
  - `https://abcd1234.ngrok.io/balance` (example API endpoint)

---

## 9. Example API Usage

- **Get balance:**
  - `GET /balance`
- **Send transaction:**
  - `POST /send?to=<address>&amount=<float>&msg=<optional_message>`
- **Multi send:**
  - `POST /multi_send?recipients=<address1>&recipients=<address2>&amounts=<amt1>&amounts=<amt2>`
- **Encrypt balance:**
  - `POST /encrypt_balance?amount=<float>`
- **Decrypt balance:**
  - `POST /decrypt_balance?amount=<float>`
- **Private transfer:**
  - `POST /private_transfer?to=<address>&amount=<float>`
- **Claim transfer:**
  - `POST /claim_transfer?transfer_id=<int>`
- **Export keys:**
  - `GET /export_keys`

You can use the web UI for interactive testing and to see all available endpoints and their parameters.

---

## 10. Security Note

**Do not expose your API or UI to the public internet without proper authentication and security!**
The `/export_keys` and `/wallet_config/with_priv` endpoints expose your private key. Only use ngrok for testing or in trusted environments.

---

## 11. Troubleshooting

- If you get a 404 at `/`, try `/ui/index.html` for the UI or `/balance` for the API.
- Make sure your `wallet.json` is properly configured and present.
- If you change the API or UI code, restart the server and refresh your browser.
- **Do not open `index.html` directly from your file system!** Always use the HTTP URL (e.g., `http://127.0.0.1:8000/ui/index.html`).

---

## 12. Stopping the Server

- To stop the FastAPI server: Press `CTRL+C` in the terminal running `uvicorn`.
- To stop ngrok: Press `CTRL+C` in the terminal running `ngrok`.

---

Happy building!
