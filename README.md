
# Garuda – AI-Powered Threat & Business Continuity Platform

An AI-driven platform for real-time threat analysis, business continuity management (BCM), and executive-level decision support. Powered by Bun, FastAPI, Pinecone, Supabase, and Astro-based ETL pipelines.

## 🎯 Overview

Garuda is a comprehensive cybersecurity platform that combines advanced threat intelligence with business continuity management. It provides real-time threat analysis, automated risk assessment, and executive-level decision support through AI-powered insights.

## ✨ Key Features

### 🔍 Threat Intelligence
- **Real-time IOC Analysis**: Advanced threat indicator analysis with semantic search
- **Vector-based Search**: Powered by Pinecone for intelligent threat matching
- **Automated Enrichment**: AI-powered threat context and business impact assessment
- **Live Threat Feeds**: Real-time updates from multiple threat intelligence sources

### 🛡️ Business Continuity Management (BCM)
- **AI-Powered Impact Assessment**: Automated business impact scoring (High/Medium/Low)
- **Sector-Specific Analysis**: Tailored analysis for Finance, Healthcare, Manufacturing, etc.
- **Risk Distribution Visualization**: Interactive charts showing threat distribution
- **Executive Reporting**: Automated report generation for leadership teams

### 🤖 AI Assistant
- **Natural Language Queries**: Ask questions about threats in plain English
- **Contextual Responses**: AI-powered responses with relevant threat context
- **Real-time Analysis**: Instant threat assessment and recommendations

### 📊 Advanced Analytics
- **Real-time Dashboards**: Live threat metrics and business impact indicators
- **Interactive Visualizations**: D3.js powered charts and graphs
- **Custom Reports**: Generate detailed threat and BCM reports
- **Data Export**: Export data in multiple formats (PDF, JSON, CSV)

### 🔧 Technical Features
- **Modern Tech Stack**: Next.js 15, TypeScript, Tailwind CSS
- **3D Visualizations**: Three.js powered threat landscape visualization
- **Real-time Updates**: WebSocket connections for live data updates
- **Responsive Design**: Mobile-first responsive interface
- **Dark Theme**: Modern dark theme with excellent readability

## 🖼️ Screenshots

### Dashboard Overview
![Dashboard Overview](pictures_readme/Screenshot%202025-07-13%20173824.png)

### Threat Intelligence Analysis
![Threat Intelligence](pictures_readme/Screenshot%202025-07-13%20173158.png)

### BCM Analysis Dashboard
![BCM Analysis](pictures_readme/Screenshot%202025-07-13%20173136.png)

### AI Assistant Interface
![AI Assistant](pictures_readme/Screenshot%202025-07-13%20173108.png)

### Real-time Analytics
![Analytics](pictures_readme/Screenshot%202025-07-13%20173024.png)

### Threat Visualization
![Threat Visualization](pictures_readme/Screenshot%202025-07-13%20172926.png)

### Business Impact Assessment
![Business Impact](pictures_readme/Screenshot%202025-07-13%20172838.png)

### Executive Reports
![Executive Reports](pictures_readme/Screenshot%202025-07-13%20172731.png)

## 🎥 Demo Video

Watch our comprehensive demo showcasing all features:

[![Garuda Demo](pictures_readme/Screenshot%202025-07-13%20172635.png)](video_readme/Screen%20Recording%202025-07-13%20171137.mp4)

*Click the image above to watch the full demo video*

## 📁 Additional Resources

### Environment Files & Configuration
Download the required environment files and configuration from our Google Drive:
**[🔗 Google Drive - Environment Files & Configuration](https://drive.google.com/drive/folders/12ILoT2AI9WVFNuecB7V2ZxA0WDkIxHyl?usp=sharing)**

This includes:
- Environment configuration files
- API keys setup guide
- Database schemas
- Additional documentation
- Sample data files

---

## Prerequisites

Ensure the following are installed and configured:

- [**Bun**](https://bun.sh/) – JavaScript runtime (alternative to Node.js)
- **Python 3.11+**
- **Docker** and **Astro CLI** (optional – for running the ETL pipeline)
- Environment files from Google Drive:
  - Download `*.env.main*`, rename it to `.env`, and place it in the **project root**
  - Download `*.env.python-backend*` and place it in the **`python-backend/` folder**

---

## Frontend Setup (Bun)

To run the frontend:

### First-time setup:
```bash
bun install
```

### Start the development server:
```bash
bun run dev
```

> Default frontend URL: [http://localhost:3000](http://localhost:3000)

---

## Backend Setup (FastAPI + Python)

### 1. Navigate to the backend folder:
```bash
cd python-backend
```

### 2. Create a virtual environment (first time only):
```bash
python -m venv venv
```

### 3. Activate the virtual environment:

**macOS/Linux:**
```bash
source venv/bin/activate
```

**Windows:**
```bash
venv\Scripts\activate
```

### 4. Install dependencies:
```bash
pip install -r requirements.txt
```

### 5. Start the backend server:
```bash
uvicorn main:app --reload --port 8000
```

> You can change the port if needed.

> Default backend URL: [http://localhost:8000](http://localhost:8000)

---

## Optional: ETL Pipeline (Astro + Docker)

To run the ETL pipeline:

1. Make sure Docker is running.
2. Navigate to the `ETL/` folder.
3. Run the following command:
```bash
astro dev start
```

> Airflow will be available at: [http://localhost:8080](http://localhost:8080)

---

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │   FastAPI       │    │   External      │
│   Frontend      │◄──►│   Backend       │◄──►│   APIs          │
│   (Bun)         │    │   (Python)      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Pinecone      │    │   Supabase      │    │   GROQ AI       │
│   Vector DB     │    │   Database      │    │   Language      │
│                 │    │                 │    │   Model         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animation library
- **D3.js** - Data visualization
- **Three.js** - 3D graphics
- **Recharts** - Chart components

### Backend
- **FastAPI** - Modern Python web framework
- **Pinecone** - Vector database for semantic search
- **GROQ** - AI language model API
- **SQLite** - Local database
- **Uvicorn** - ASGI server

### DevOps & Tools
- **Bun** - JavaScript runtime
- **Docker** - Containerization
- **Astro** - ETL pipeline orchestration
- **Drizzle ORM** - Type-safe database queries

## 📊 Performance Features

- **Real-time Updates**: Data refreshes every 2 minutes
- **Vector Search**: Sub-second threat intelligence queries
- **AI-Powered Analysis**: Instant business impact assessment
- **Responsive Design**: Optimized for all device sizes
- **Progressive Loading**: Fast initial page loads

## 🔒 Security Features

- **Authentication**: Secure user authentication system
- **API Security**: Protected backend endpoints
- **Data Privacy**: Local processing of sensitive data
- **HTTPS Ready**: Production-ready security configuration

## 🚀 Getting Started

1. **Clone the repository**
2. **Download environment files** from the Google Drive link above
3. **Setup frontend** with `bun install && bun run dev`
4. **Setup backend** with Python virtual environment
5. **Configure API keys** in environment files
6. **Start both services** and access the dashboard

## 📈 Roadmap

- [ ] Advanced threat correlation
- [ ] Machine learning threat prediction
- [ ] Integration with SIEM systems
- [ ] Mobile application
- [ ] Advanced reporting features
- [ ] Multi-tenant support

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for more details.

## 📄 License

This project is licensed under the MIT License.

---

## Summary

| Component       | Command                | Location           | Default Port     |
|----------------|------------------------|--------------------|------------------|
| Frontend        | `bun run dev`          | Project root       | `3000`           |
| Backend         | `uvicorn main:app`     | `python-backend/`  | `8000`           |
| ETL (optional)  | `astro dev start`      | `ETL/`             | `8080`           |

---

## 📞 Support

For support and questions:
- Check the [BCM Integration Guide](BCM_INTEGRATION_GUIDE.md)
- Download additional resources from our [Google Drive](https://drive.google.com/drive/folders/12ILoT2AI9WVFNuecB7V2ZxA0WDkIxHyl?usp=sharing)
- Review the demo video for feature walkthrough

---

*Built with ❤️ using modern web technologies for enterprise-grade threat intelligence and business continuity management.*
