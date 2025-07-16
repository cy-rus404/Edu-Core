import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { supabase } from './supabase';
import AnnouncementsView from './AnnouncementsView';
import MessagePage from './MessagePage';

export default function StudentHomePage({ username, onLogout }) {
  const [studentData, setStudentData] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);

  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    fetchStudentData();
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
    // We've removed the badge, so this function is no longer needed
    // but we keep it as a placeholder for future functionality
    setUnreadAnnouncements(0);
  };

  const fetchStudentData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('email', user.email)
          .single();
        
        if (error) {
          console.error('Error fetching student data:', error);
        } else {
          setStudentData(data);
        }
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const handleNavigation = (page) => {
    setCurrentPage(page);
  };

  const handleBack = () => {
    setCurrentPage('dashboard');
  };

  if (currentPage === 'Announcements') {
    return <AnnouncementsView 
      onBack={handleBack}
      userRole="students"
      userId={studentData?.id}
      onUpdateUnread={(count) => setUnreadAnnouncements(count)}
    />;
  }

  if (currentPage === 'Messages') {
    return <MessagePage 
      onBack={handleBack}
      studentData={studentData}
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
      
      <Text style={styles.welcome}>Welcome {username}!</Text>
      
      {studentData && (
        <View style={styles.profileContainer}>
          <View style={styles.imageContainer}>
            {studentData.image ? (
              <Image source={{ uri: studentData.image }} style={styles.profileImage} />
            ) : (
              <View style={styles.defaultAvatar}>
                <Text style={styles.avatarText}>{studentData.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.email}>{studentData.email}</Text>
          <Text style={styles.studentId}>ID: {studentData.student_id}</Text>
        </View>
      )}
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => handleNavigation('Announcements')}
        >
          <Text style={styles.buttonText}>Announcements</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => handleNavigation('Messages')}
        >
          <Text style={styles.buttonText}>Message Teachers</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
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
    alignItems: 'center',
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
  welcome: {
    fontSize: 28,
    fontWeight: '600',
    color: '#333',
    marginBottom: 40,
    textAlign: 'center',
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  imageContainer: {
    marginBottom: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  defaultAvatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 60,
    fontWeight: '600',
  },
  email: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  studentId: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  buttonsContainer: {
    width: '100%',
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#ff4757',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});