# Fundli - Interpersonal Lending Platform

A modern, beautiful, and fully responsive React-based frontend for an interpersonal lending platform that connects lenders and borrowers without banks or intermediaries.

## 🚀 Features

### Core Functionality
- **Authentication & KYC**: User registration, login, OTP verification, and KYC document upload
- **Borrower Flows**: Loan application, status tracking, and repayment scheduling
- **Lender Flows**: Create lending pools, browse loans, and manage investments
- **Dashboard**: Comprehensive dashboards for borrowers, lenders, and admins
- **Marketplace**: Browse and filter available loan opportunities
- **Referral Program**: Track referrals and earn rewards
- **Admin Panel**: User management, KYC approval, and loan oversight

### Technical Features
- **PWA Ready**: Installable, offline-capable with service worker
- **Responsive Design**: Mobile-first approach with TailwindCSS
- **Dark/Light Mode**: Theme switching with persistent preferences
- **Modern UI**: Beautiful animations with Framer Motion
- **Type Safe**: Built with modern React patterns and best practices

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: TailwindCSS with custom design system
- **Routing**: React Router v7
- **State Management**: React Context API
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **UI Components**: Headless UI
- **Charts**: Chart.js + React Chart.js 2 (ready for integration)
- **HTTP Client**: Axios (ready for API integration)

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Buttons, inputs, modals
│   ├── layout/         # Navbar, sidebar, layout
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard widgets
│   ├── loans/          # Loan-related components
│   └── marketplace/    # Marketplace components
├── pages/              # Full page components
│   ├── auth/           # Login, register, OTP, KYC
│   ├── dashboard/      # User dashboards
│   ├── loans/          # Loan management
│   ├── marketplace/    # Loan browsing
│   ├── referral/       # Referral system
│   ├── settings/       # User settings
│   └── admin/          # Admin functions
├── context/            # React Context providers
├── services/           # API service layer
├── hooks/              # Custom React hooks
├── utils/              # Helper functions
└── styles/             # TailwindCSS configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FUNDLI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## 🎨 Design System

### Color Palette
- **Primary**: Indigo/Blue tones for trust and finance
- **Secondary**: Emerald/Teal for growth and success
- **Accent**: Purple for premium features
- **Semantic**: Success (green), Warning (yellow), Error (red), Info (blue)

### Typography
- **Primary Font**: Inter (clean, modern)
- **Display Font**: Poppins (headings, emphasis)

### Components
- **Cards**: Soft shadows, rounded corners, modern fintech aesthetic
- **Buttons**: Consistent styling with hover effects and focus states
- **Forms**: Clean inputs with validation states
- **Animations**: Subtle transitions and micro-interactions

## 📱 Responsive Design

- **Mobile**: Stacked layout, single column
- **Tablet**: 2-column grid layout
- **Desktop**: Full dashboard with sidebar navigation

## 🔐 Authentication Flow

1. **Registration**: User signup with email verification
2. **OTP Verification**: 6-digit code verification
3. **KYC Upload**: Document verification for compliance
4. **Dashboard Access**: Role-based dashboard (borrower/lender/admin)

## 🏗️ Architecture

### State Management
- **Auth Context**: User authentication and KYC status
- **Theme Context**: Dark/light mode preferences
- **Local Storage**: Persistent user preferences

### Routing
- **Protected Routes**: Role-based access control
- **Nested Routes**: Organized by feature area
- **Dynamic Routing**: Parameterized routes for dynamic content

### Component Design
- **Atomic Design**: Reusable, composable components
- **Props Interface**: Clear component contracts
- **Error Boundaries**: Graceful error handling

## 🚧 Development Status

### ✅ Completed
- [x] Project setup and configuration
- [x] Authentication system (UI only)
- [x] KYC upload interface
- [x] Dashboard layouts for all user types
- [x] Marketplace browsing
- [x] Responsive design system
- [x] PWA configuration
- [x] Theme switching
- [x] Navigation and routing

### 🔄 In Progress
- [ ] API integration
- [ ] Chart.js implementation
- [ ] File upload to Cloudinary
- [ ] Push notifications

### 📋 Planned
- [ ] Advanced analytics
- [ ] Real-time updates
- [ ] Mobile app (React Native)
- [ ] Multi-language support

## 🔌 API Integration

The frontend is designed to integrate with a Node.js/Express backend. Key endpoints needed:

- **Authentication**: `/api/auth/*`
- **Users**: `/api/users/*`
- **Loans**: `/api/loans/*`
- **KYC**: `/api/kyc/*`
- **Marketplace**: `/api/marketplace/*`

## 🧪 Testing

```bash
# Run linting
npm run lint

# Run tests (when implemented)
npm test
```

## 📦 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Deploy dist/ folder
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🙏 Acknowledgments

- **Design Inspiration**: Modern fintech applications
- **Icons**: Lucide React
- **UI Components**: Headless UI
- **Styling**: TailwindCSS team
- **Animation**: Framer Motion

---

**Fundli** - Revolutionizing interpersonal lending through technology and trust.
