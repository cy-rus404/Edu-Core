# 🎓 School Management System

A comprehensive cross-platform school management application built with React Native and Expo, featuring role-based access for administrators, teachers, and students.

## ✨ Features

### 👨‍💼 Admin Dashboard
- **Student Management**: Add, edit, and manage student records
- **Teacher Management**: Manage teacher profiles and assignments
- **Class Management**: Create and organize classes and subjects
- **Fee Management**: Track and manage student fees with Paystack integration
- **Reports**: Generate comprehensive reports and analytics
- **Announcements**: Broadcast important announcements to all users
- **Settings**: Configure system-wide settings and preferences

### 👨‍🏫 Teacher Portal
- **Attendance Tracking**: Mark and manage student attendance
- **Grade Management**: Record and update student grades
- **Assignment Management**: Create and distribute assignments
- **Timetable View**: Access teaching schedules and class timings
- **Student Communication**: Message students and parents
- **Class Reports**: Generate class-specific reports

### 👨‍🎓 Student Portal
- **Personal Dashboard**: View academic progress and updates
- **Attendance View**: Check attendance records and statistics
- **Grades & Results**: Access grades and academic performance
- **Fee Status**: View fee payments and outstanding balances
- **Assignments**: Access and submit assignments
- **Announcements**: Receive important school notifications
- **Timetable**: View class schedules and timings

## 🚀 Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL database with real-time features)
- **Authentication**: Supabase Auth with role-based access control
- **Payment Integration**: Paystack for fee payments
- **Cross-Platform**: iOS, Android, and Web support
- **State Management**: React Hooks and Context API
- **Styling**: React Native StyleSheet with responsive design

## 📱 Platform Support

- ✅ **iOS** - Native iOS app
- ✅ **Android** - Native Android app  
- ✅ **Web** - Progressive Web App (PWA)

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Supabase account

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Edu-Core
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

### 4. Database Setup
Run the SQL scripts in order:
```bash
# Core database setup
supabase-setup.sql
supabase-setup-updates.sql

# Feature-specific tables
fees-tables.sql
notifications-table.sql
settings-tables.sql

# Sample data (optional)
sample-data.sql
create-admin-user.sql
```

### 5. Start Development Server
```bash
# Start Expo development server
npm start

# Platform-specific commands
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web browser
```

## 🏗️ Project Structure

```
Edu-Core/
├── assets/                 # Images and static assets
├── components/            # Reusable UI components
├── screens/              # Main application screens
│   ├── AdminHomePage.js  # Admin dashboard
│   ├── TeacherHomePage.js # Teacher portal
│   ├── StudentHomePage.js # Student dashboard
│   └── LoginScreen.js    # Authentication
├── utils/
│   ├── supabase.js       # Database configuration
│   ├── responsive.js     # Responsive design utilities
│   └── GlobalStyles.js   # Shared styling
├── sql/                  # Database migration scripts
└── app.config.js         # Expo configuration
```

## 🔐 Authentication & Roles

The app implements role-based access control with three user types:

- **Admin**: Full system access and management capabilities
- **Teacher**: Classroom management and student interaction features  
- **Student**: Personal academic information and communication tools

## 💳 Payment Integration

Integrated with Paystack for secure fee payments:
- Real-time payment processing
- Payment history tracking
- Automated fee status updates
- Receipt generation

## 📊 Database Schema

The app uses Supabase with the following main tables:
- `users` - User authentication and profiles
- `students` - Student information and records
- `teachers` - Teacher profiles and assignments
- `classes` - Class and subject management
- `fees` - Fee tracking and payment records
- `attendance` - Attendance records
- `grades` - Academic performance data
- `announcements` - System-wide notifications

## 🚀 Deployment

### Web Deployment
```bash
# Build for web
npm run build:web

# Deploy to hosting service
# (Netlify, Vercel, GitHub Pages, etc.)
```

### Mobile App Deployment
```bash
# Build for app stores
expo build:android  # Google Play Store
expo build:ios      # Apple App Store

# Or use EAS Build (recommended)
eas build --platform all
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
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the SQL setup scripts for database configuration

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
  - User authentication and role management
  - Basic CRUD operations for all entities
  - Cross-platform support (iOS, Android, Web)
  - Payment integration with Paystack

---

**Built with ❤️ using React Native and Expo**
