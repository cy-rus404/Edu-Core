import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { supabase } from './supabase';
import AttendancePage from './AttendancePage';
import GradesPage from './GradesPage';
import AnnouncementsView from './AnnouncementsView';

export default function TeacherHomePage({ username, onLogout }) {
  const [teacherData, setTeacherData] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);

  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    fetchTeacherData();
    checkUnreadAnnouncements();
  }, []);
  
  useEffect(() => {
    if (unreadAnnouncements > 0) {
      setShowNotification(true);
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5000); // Hide after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [unreadAnnouncements]);

  const checkUnreadAnnouncements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .or('recipients.eq.teachers,recipients.eq.all');
      
      if (error) {
        console.error('Error fetching announcements:', error);
        return;
      }

      // Count announcements where user ID is not in read_by
      const unreadCount = data.filter(announcement => 
        !announcement.read_by.includes(user.id)
      ).length;
      
      setUnreadAnnouncements(unreadCount);
    } catch (error) {
      console.error('Error checking unread announcements:', error);
    }
  };

  const fetchTeacherData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('teachers')
          .select('*')
          .eq('email', user.email)
          .single();
        
        if (error) {
          console.error('Error fetching teacher data:', error);
        } else {
          setTeacherData(data);
        }
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error);
    }
  };

  const handleNavigation = (page) => {
    setCurrentPage(page);
  };

  const handleBack = () => {
    setCurrentPage('dashboard');
  };

  if (currentPage === 'Attendance' && teacherData) {
    return <AttendancePage onBack={handleBack} teacherClass={teacherData.assigned_class} />;
  }

  if (currentPage === 'Grades' && teacherData) {
    return <GradesPage 
      onBack={handleBack} 
      teacherClass={teacherData.assigned_class} 
      teacherSubject={teacherData.subject} 
    />;
  }

  if (currentPage === 'Announcements') {
    return <AnnouncementsView 
      onBack={handleBack}
      userRole="teachers"
      userId={teacherData?.id}
    />;
  }

  return (
    <View style={styles.container}>
      {showNotification && unreadAnnouncements > 0 && (
        <View style={styles.notification}>
          <Text style={styles.notificationText}>
            You have {unreadAnnouncements} unread {unreadAnnouncements === 1 ? 'message' : 'messages'}
          </Text>
        </View>
      )}
      
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome {username}!</Text>
        {teacherData && (
          <Text style={styles.classInfo}>
            Class: {teacherData.assigned_class || 'Not Assigned'}
          </Text>
        )}
      </View>
      
      <View style={styles.gridContainer}>
        <TouchableOpacity 
          style={styles.box} 
          onPress={() => handleNavigation('Attendance')}
        >
          <Text style={styles.boxText}>Attendance</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.box} 
          onPress={() => handleNavigation('Grades')}
        >
          <Text style={styles.boxText}>Grades</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.box} 
          onPress={() => handleNavigation('Assignments')}
        >
          <Text style={styles.boxText}>Assignments</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.box} 
          onPress={() => handleNavigation('Announcements')}
        >
          <View style={styles.boxContent}>
            <Text style={styles.boxText}>Announcements</Text>
            {unreadAnnouncements > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadAnnouncements}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.box} 
          onPress={() => handleNavigation('Settings')}
        >
          <Text style={styles.boxText}>Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.box, styles.logoutBox]} 
          onPress={onLogout}
        >
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
  notification: {
    backgroundColor: '#ff3b30',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  notificationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  header: {
    marginBottom: 40,
  },
  welcome: {
    fontSize: 28,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  classInfo: {
    fontSize: 18,
    color: '#4a90e2',
    fontWeight: '500',
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
  boxContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  boxText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#ff3b30',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutBox: {
    backgroundColor: '#ff4757',
  },
  logoutText: {
    color: '#fff',
  },
});