import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Animated } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import LoginScreen from './LoginScreen';
import SplashScreen from './SplashScreen';
import HomePage from './HomePage';
import AdminHomePage from './AdminHomePage';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [userRole, setUserRole] = useState('');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (user, role) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setUsername(user);
      setUserRole(role);
      setIsLoggedIn(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleLogout = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsLoggedIn(false);
      setUsername('');
      setUserRole('');
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
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
      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        {renderScreen()}
      </Animated.View>
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
