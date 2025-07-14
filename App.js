import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import React, { useState, useEffect } from 'react';
import LoginScreen from './LoginScreen';
import SplashScreen from './SplashScreen';
import HomePage from './HomePage';
import AdminHomePage from './AdminHomePage';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (user, role) => {
    setUsername(user);
    setUserRole(role);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setUserRole('');
  };

  const renderScreen = () => {
    if (showSplash) return <SplashScreen />;
    if (isLoggedIn) {
      if (userRole === 'admin') {
        return <AdminHomePage onLogout={handleLogout} />;
      }
      return <HomePage username={username} onLogout={handleLogout} />;
    }
    return <LoginScreen onLogin={handleLogin} />;
  };

  return (
    <View style={[styles.container, showSplash && styles.splashContainer]}>
      {renderScreen()}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashContainer: {
    backgroundColor: '#4a90e2',
  },
});
