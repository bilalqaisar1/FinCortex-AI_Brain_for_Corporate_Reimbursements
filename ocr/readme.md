# FinCortex App - Complete Deployment Guide

This guide walks you through deploying the FinCortex Full-stack Application on an Ubuntu/Linux server from scratch. It assumes you are deploying to the `/root` directory.

## 1. Prerequisites
Ensure your server has the basic necessary dependencies installed:
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv nginx -y
```

## 2. Clone the Project
Prepare the directory and clone the project from your repository.

```bash
cd /root
# Replace the URL with your actual Git repository URL
git clone <YOUR_GIT_REPOSITORY_URL> .
```
This guide assumes your code resides exactly at `/root/ai/FinCortex-AI_Brain_for_Corporate_Reimbursements`.

---

## 3. Setup the Backend API

1. **Navigate to the Backend directory:**
   ```bash
   cd /root/ai/FinCortex-AI_Brain_for_Corporate_Reimbursements/backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Verify Environment Variables:**
   Ensure the `.env` file is present in `/root/ai/FinCortex-AI_Brain_for_Corporate_Reimbursements/backend/.env` with production keys. Set `FRONTEND_URL` to your production URL/IP.

5. **Test it manually** (it should bind to 0.0.0.0:8000):
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
   *Press `Ctrl+C` to quit after verifying.*

---

## 4. Setup the MCP Server

1. **Navigate to the MCP Server directory:**
   ```bash
   cd /root/ai/FinCortex-AI_Brain_for_Corporate_Reimbursements/MCP-Serverr
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt 
   ```

4. **Verify Environment Variables:**
   Ensure the `.env` file is complete.

5. **Test it manually** (it should bind to 0.0.0.0:8001):
   ```bash
   python server.py
   ```
   *Press `Ctrl+C` to quit after verifying.*

---

## 5. Enable Systemd Services (To run backend & MCP perpetually)

Instead of using `cat << EOF` which can sometimes cause memory issues if not careful, we will use the `nano` editor to create these files.

1. **Create the Backend Service File:**
   ```bash
   nano /etc/systemd/system/fincortex-backend.service
   ```
   Paste the following block exactly, then save (`Ctrl+O`, `Enter`) and exit (`Ctrl+X`):
   ```ini
   [Unit]
   Description=FinCortex Backend FastAPI Server
   After=network.target

   [Service]
   User=root
   Group=root
   WorkingDirectory=/root/ai/FinCortex-AI_Brain_for_Corporate_Reimbursements/backend
   Environment="PATH=/root/ai/FinCortex-AI_Brain_for_Corporate_Reimbursements/backend/venv/bin"
   ExecStart=/root/ai/FinCortex-AI_Brain_for_Corporate_Reimbursements/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000

   Restart=always
   RestartSec=3

   [Install]
   WantedBy=multi-user.target
   ```

2. **Create the MCP Server Service File:**
   ```bash
   nano /etc/systemd/system/fincortex-mcp.service
   ```
   Paste the following block exactly, then save (`Ctrl+O`, `Enter`) and exit (`Ctrl+X`):
   ```ini
   [Unit]
   Description=FinCortex MCP FastAPI Server
   After=network.target

   [Service]
   User=root
   Group=root
   WorkingDirectory=/root/ai/FinCortex-AI_Brain_for_Corporate_Reimbursements/MCP-Serverr
   Environment="PATH=/root/ai/FinCortex-AI_Brain_for_Corporate_Reimbursements/MCP-Serverr/venv/bin"
   ExecStart=/root/ai/FinCortex-AI_Brain_for_Corporate_Reimbursements/MCP-Serverr/venv/bin/python server.py

   Restart=always
   RestartSec=3

   [Install]
   WantedBy=multi-user.target
   ```

3. **Reload systemd configurations and enable them to start on boot:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable fincortex-backend.service
   sudo systemctl enable fincortex-mcp.service
   ```

4. **Start the services:**
   ```bash
   sudo systemctl start fincortex-backend.service
   sudo systemctl start fincortex-mcp.service
   ```

5. **Check the status to ensure they are active (running):**
   ```bash
   sudo systemctl status fincortex-backend.service
   sudo systemctl status fincortex-mcp.service
   ```

---

## 6. Setup the Frontend (Next.js)

1. **Navigate to the fin-cortex frontend repository:**
   ```bash
   cd /root/ai/FinCortex-AI_Brain_for_Corporate_Reimbursements/fin-cortex
   ```

2. **Upgrade Node.js to v20 via apt (Required — server ships with v18 which is too old for the new deps):**
   ```bash
   # Add NodeSource repository for Node 20
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   node --version  # Should show v20.x.x
   npm --version
   ```

3. **Install Node modules:**
   ```bash
   npm install --legacy-peer-deps
   ```

4. **Configure Environment:**
   Update `.env` locally here to point to your server IP endpoints:
   ```bash
   nano .env
   ```
   Add/Update these lines:
   ```env
   NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:8000
   NEXT_PUBLIC_MCP_SERVER_URL=http://YOUR_SERVER_IP:8001
   ```

5. **Build the optimized production app:**
   **Note**: If this command gets "Killed" due to Out of Memory (OOM), you must create a swap file before running it again.
   ```bash
   npm run build
   ```

6. **Run the Next.js production server** (we recommend using `pm2` for continuous execution):
   ```bash
   sudo npm install -g pm2
   pm2 start npm --name "fincortex-frontend" -- start
   pm2 save
   pm2 startup
   ```
   This will run Next.js continuously on `localhost:3000`.

---

## 7. Setup Nginx (Reverse Proxy for Port 80 access)

Since the frontend runs on port 3000, and backend APIs on 8000/8001, you can use Nginx to map everything onto default port 80.

1. **Create the Nginx configuration file:**
   ```bash
   nano /etc/nginx/sites-available/fincortex
   ```
   Replace `YOUR_SERVER_IP_OR_DOMAIN` with your actual Linux server IP, paste this entire block, then save (`Ctrl+O`, `Enter`) and exit (`Ctrl+X`):
   ```nginx
   server {
       listen 80;
       server_name YOUR_SERVER_IP_OR_DOMAIN;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /api/ {
           proxy_pass http://localhost:8000/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       location /mcp/ {
           proxy_pass http://localhost:8001/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

2. **Enable the site (creating a symlink) and disable default:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/fincortex /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   ```

3. **Test Nginx config & restart:**
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Allow Firewall (Important)
If you have ufw enabled:
```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow 8000
sudo ufw allow 8001
```

## Done!

You can now visit your server via `http://YOUR_SERVER_IP/`. The application will behave reliably with auto-restart upon reboots via Systemd and PM2.
