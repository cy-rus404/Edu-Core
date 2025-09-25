import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { supabase } from './supabase';
import { normalize, getResponsiveWidth, getResponsiveHeight, responsiveScreenFontSize, isSmallScreen, isVerySmallScreen } from './responsive';
import AttendancePage from './AttendancePage';
import GradesPage from './GradesPage';
import AnnouncementsView from './AnnouncementsView';
import TimetablePage from './TimetablePage';
import AssignmentsPage from './AssignmentsPage';
import MessagesListView from './MessagesListView';

export default function TeacherHomePage({ username, onLogout }) {
  const [teacherData, setTeacherData] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    fetchTeacherData();
    checkUnreadAnnouncements();
  }, []);
  
  useEffect(() => {
    if (teacherData) {
      checkUnreadMessages();
      
      // Set up polling for new messages
      const interval = setInterval(() => {
        checkUnreadMessages();
      }, 10000); // Check every 10 seconds
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [teacherData]);
  
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

  const checkUnreadMessages = async () => {
    try {
      if (teacherData) {
        // Get user's last read timestamp from teachers table
        const { data: userData, error: userError } = await supabase
          .from('teachers')
          .select('last_read_messages')
          .eq('id', teacherData.id)
          .single();
        
        const lastReadTime = userData?.last_read_messages || '2000-01-01T00:00:00.000Z';
        
        // Get messages from others after last read time
        const { data: messages, error } = await supabase
          .from('messages')
          .select('sender_id, sender_name, created_at')
          .gt('created_at', lastReadTime)
          .order('created_at', { ascending: false });
        
        if (messages) {
          const otherMessages = messages.filter(msg => 
            !(msg.sender_id === teacherData.id && msg.sender_name === teacherData.name)
          );
          setUnreadMessages(otherMessages.length);
        } else {
          setUnreadMessages(0);
        }
      }
    } catch (error) {
      console.error('Error checking unread messages:', error);
      setUnreadMessages(0);
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

  const handleNavigation = async (page) => {
    if (page === 'Messages') {
      // Mark messages as read by updating timestamp in database
      await supabase
        .from('teachers')
        .update({ last_read_messages: new Date().toISOString() })
        .eq('id', teacherData.id);
      setUnreadMessages(0);
    }
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
      onUpdateUnread={(count) => setUnreadAnnouncements(count)}
    />;
  }

  if (currentPage === 'Timetable') {
    return <TimetablePage 
      onBack={handleBack} 
      userRole="teacher" 
      classId={teacherData?.assigned_class} 
    />;
  }

  if (currentPage === 'Assignments') {
    return <AssignmentsPage 
      onBack={handleBack} 
      userRole="teacher" 
      teacherData={teacherData}
    />;
  }

  if (currentPage === 'Messages') {
    return <MessagesListView 
      onBack={() => {
        handleBack();
        checkUnreadMessages();
      }}
      userRole="teacher"
      userData={teacherData}
    />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
            <Text style={styles.boxText}>Announcements</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.box} 
            onPress={() => handleNavigation('Messages')}
          >
            <Text style={styles.boxText}>Messages</Text>
            {unreadMessages > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadMessages}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.box} 
            onPress={() => handleNavigation('Timetable')}
          >
            <Text style={styles.boxText}>Timetable</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.box, styles.logoutBox]} 
            onPress={onLogout}
          >
            <Text style={[styles.boxText, styles.logoutText]}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: getResponsiveWidth(6),
    paddingTop: getResponsiveHeight(2),
    paddingBottom: getResponsiveHeight(3),
  },
  notification: {
    backgroundColor: '#ff3b30',
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(16),
    borderRadius: normalize(8),
    marginBottom: getResponsiveHeight(2.5),
    width: '100%',
  },
  notificationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  header: {
    marginBottom: getResponsiveHeight(4),
  },
  welcome: {
    fontSize: isVerySmallScreen() ? 24 : 28,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  classInfo: {
    fontSize: isVerySmallScreen() ? 18 : 20,
    color: '#4a90e2',
    fontWeight: '500',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'flex-start',
  },
  box: {
    width: isSmallScreen() ? '100%' : '48%',
    height: isVerySmallScreen() ? 80 : 120,
    backgroundColor: '#4a90e2',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isVerySmallScreen() ? 12 : 20,
    paddingHorizontal: 12,
  },
  boxText: {
    color: '#fff',
    fontSize: isVerySmallScreen() ? 16 : 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  logoutBox: {
    backgroundColor: '#ff4757',
  },
  logoutText: {
    color: '#fff',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});