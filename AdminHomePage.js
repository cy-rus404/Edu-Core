import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import StudentsPage from './StudentsPage';
import TeachersPage from './TeachersPage';
import AnnouncementsPage from './AnnouncementsPage';
import ClassesPage from './ClassesPage';

export default function AdminHomePage({ onLogout }) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [unreadCount, setUnreadCount] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const { width } = Dimensions.get('window');
  
  useEffect(() => {
    checkUnreadAnnouncements();
  }, []);
  
  const checkUnreadAnnouncements = async () => {
    try {
      // Get all announcements that have been read by someone
      const { data, error } = await supabase
        .from('announcements')
        .select('*');
      
      if (error) {
        console.error('Error fetching announcements:', error);
        return;
      }
      
      // Count total number of announcements with at least one unread
      const totalUnread = data.filter(announcement => 
        announcement.read_by.length < 1 // Consider it unread if no one has read it
      ).length;
      
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error checking unread announcements:', error);
    }
  };

  const handleNavigation = (page) => {
    if (page === 'Students') {
      setCurrentPage('students');
    } else if (page === 'Teachers') {
      setCurrentPage('teachers');
    } else if (page === 'Classes') {
      setCurrentPage('classes');
    } else if (page === 'Announcements') {
      setCurrentPage('Announcements');
    } else {
      console.log(`Navigate to ${page}`);
    }
  };

  const handleBack = () => {
    setCurrentPage('dashboard');
  };

  if (currentPage === 'students') {
    return <StudentsPage onBack={handleBack} />;
  }

  if (currentPage === 'teachers') {
    return <TeachersPage onBack={handleBack} />;
  }

  if (currentPage === 'Announcements') {
    return <AnnouncementsPage onBack={handleBack} />;
  }

  if (currentPage === 'classes') {
    return <ClassesPage onBack={handleBack} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome Admin 👋</Text>
      
      <View style={styles.gridContainer}>
        <TouchableOpacity style={styles.box} onPress={() => handleNavigation('Students')}>
          <Text style={styles.boxText}>Students</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.box} onPress={() => handleNavigation('Teachers')}>
          <Text style={styles.boxText}>Teachers</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.box} onPress={() => handleNavigation('Classes')}>
          <Text style={styles.boxText}>Classes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.box} onPress={() => handleNavigation('Announcements')}>
          <Text style={styles.boxText}>Announcements</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.box} onPress={() => handleNavigation('Reports')}>
          <Text style={styles.boxText}>Reports</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.box} onPress={() => handleNavigation('Settings')}>
          <Text style={styles.boxText}>Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.box, styles.logoutBox]} onPress={onLogout}>
          <Text style={[styles.boxText, styles.logoutText]}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  welcome: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 40,
  },
  gridContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'flex-start',
  },
  box: {
    width: '48%',
    height: 120,
    backgroundColor: '#4a90e2',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  boxText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  logoutBox: {
    backgroundColor: '#ff4757',
  },
  logoutText: {
    color: '#fff',
  },
});