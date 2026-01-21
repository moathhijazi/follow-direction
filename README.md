# 📱 Follow - User & Subscription Management System

<div align="center">

![React Native](https://img.shields.io/badge/React%20Native-0.72-blue.svg?style=for-the-badge&logo=react)
![Expo](https://img.shields.io/badge/Expo-49-blue.svg?style=for-the-badge&logo=expo)
![Supabase](https://img.shields.io/badge/Supabase-3.0-green.svg?style=for-the-badge&logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-blue.svg?style=for-the-badge&logo=tailwind-css)
![Push Notifications](https://img.shields.io/badge/Push%20Notifications-Enabled-success.svg?style=for-the-badge)

**A complete user and admin management system with real-time notifications**

[Features](#-features) • [Installation](#-installation) • [Architecture](#-architecture) • [Documentation](#-documentation) • [API Reference](#-api-reference)

</div>

---

## ✨ Features

### 👥 **Advanced User Management**

- **Secure login/logout** using Supabase Auth
- **Regular users** and **admins** with different permissions
- **Admin dashboard** with full/limited access controls
- **Create new accounts** by admins
- **Real-time user list** updates

### 🔐 **Multi-Level Permission System**

```typescript
interface UserRole {
  role: "user" | "admin";
  access: "limit" | "full"; // Limited or full permissions
}
```
