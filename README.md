# 🌲 Outdoor Adventures Platform – Angular Frontend

A modern and responsive **Angular** application serving as the frontend for the **Outdoor Adventures Platform**. This project provides seamless interfaces for managing camping, events, training, forums, marketplace, transportation, and users.

![Angular Frontend](https://via.placeholder.com/800x400?text=Outdoor+Adventures+Angular+Frontend)

---

## 📚 Table of Contents

- [🔧 Architecture Overview](#-architecture-overview)  
- [🧰 Technologies Used](#-technologies-used)  
- [✨ Features](#-features)  
- [⚙ Installation and Setup](#-installation-and-setup)  
- [📁 Project Structure](#-project-structure)  
- [🔄 State Management](#-state-management)  
- [🎨 UI Components](#-ui-components)  
- [🤝 Contributing](#-contributing)  
- [📄 License](#-license)  

---

## 🏗 Architecture Overview

This frontend application is built using a **modular architecture** with **lazy-loaded feature modules** and includes:

- **Components** – Reusable UI building blocks  
- **Services** – API communication and business logic  
- **Guards** – Role-based route protection  
- **Interceptors** – HTTP request/response handling  
- **State Management** – Centralized via NgRx Store  
- **Routing** – Organized using Angular Router with child routes  

---

## 💻 Technologies Used

- **Angular 16+** – Application framework  
- **TypeScript** – Strongly typed programming language  
- **NgRx** – State management (Redux-style)  
- **RxJS** – Reactive programming library  
- **Bootstrap 5 / ngx-bootstrap** – UI layout and components  
- **NgApexCharts** – Data visualization and charts  
- **Leaflet** – Interactive maps  
- **FullCalendar** – Calendar UI and scheduling  
- **Simplebar** – Custom scrollbars  
- **SweetAlert2** – Enhanced alert modals  
- **NgxDropzone** – File uploads  
- **CKEditor** – Rich text editing  
- **Angular Material** – Material Design components  
- **SCSS** – Modular and maintainable styling  

---

## ✨ Features

### 🌐 Cross-Application Features

- Role-based access control (RBAC)  
- Fully responsive design (mobile & desktop)  
- Light/Dark mode support  
- Multiple layout options  
- Real-time notifications  
- Dynamic and interactive dashboards  

### 🏕 Camping Management

- Browse camping centers  
- Detailed center info with media  
- Booking management  
- Equipment inventory tracking  
- Interactive location maps  
- User reviews and ratings  
- Sentiment analysis visualization  

### 📅 Event Management

- Discover and filter events  
- Event registration system  
- Calendar-based navigation  
- AI-powered content generation  
- Keyword extraction and insights  

### 🎓 Training Courses

- Course catalog browsing  
- Enroll in training programs  
- Track learning progress  
- Downloadable learning materials  

### 💬 Community Forum

- Discussion boards  
- Post creation with comments  
- Image and file sharing  
- Content moderation tools  
- Engagement metrics and trends  

### 🛒 Marketplace

- Product search and filtering  
- Shopping cart & checkout  
- Order tracking system  
- Customer reviews  
- PDF invoice generation and download  

### 🚗 Transport Management

- View available vehicles  
- Rental/reservation system  
- Booking and availability management  
- Vehicle reviews  

### 👤 User Management

- User profile and settings  
- Authentication (login/register)  
- Messaging system  
- Activity logs and history  
- Theme and layout customization  

---

## ⚙ Installation and Setup

### ✅ Prerequisites

- [Node.js](https://nodejs.org/) (v16+)  
- npm (v8+) or yarn (v1.22+)  
- Angular CLI (v16+)  

### 📥 Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/outdoor-adventures-frontend.git
   cd outdoor-adventures-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables**  
   Update the files under `src/environments/` with the appropriate API URLs and settings.

4. **Start the development server**
   ```bash
   ng serve
   ```
   Navigate to `http://localhost:4200/`

5. **Build for production**
   ```bash
   ng build --configuration production
   ```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── core/                 # Core services, guards, interceptors
│   ├── layouts/              # Layouts and structural components
│   ├── pages/                # Feature modules
│   │   ├── gestion-camping/       # Camping
│   │   ├── gestion-event/         # Events
│   │   ├── gestion-formation/     # Training
│   │   ├── gestion-forum/         # Forum
│   │   ├── gestion-marketplace/   # Marketplace
│   │   ├── gestion-transport/     # Transportation
│   │   └── gestion-user/
│   ├── shared/              # Reusable components, pipes, directives
│   └── store/               # NgRx state management
├── assets/                  # Static assets (images, icons, etc.)
├── environments/            # Environment-specific configurations
└── styles/                  # Global SCSS styles
```

---

## 🔄 State Management

Managed using **NgRx**, enabling predictable and testable state changes:

- **Actions** – Trigger events describing state changes  
- **Reducers** – Handle state transitions  
- **Selectors** – Access specific state slices  
- **Effects** – Handle side effects like HTTP calls  

---

## 🎨 UI Components

Combines the power of:

- Custom-built Angular components  
- **Bootstrap** & **ngx-bootstrap**  
- **Angular Material** for a modern look and feel  
- Third-party libraries for:
  - Charts (NgApexCharts)  
  - Calendars (FullCalendar)  
  - Maps (Leaflet)  



## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for full details.
