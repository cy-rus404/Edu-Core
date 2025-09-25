import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView, Animated } from 'react-native';
import { supabase } from './supabase';
import { normalize, getResponsiveWidth, getResponsiveHeight, responsiveScreenFontSize, isSmallScreen, isVerySmallScreen } from './responsive';
import AnnouncementsView from './AnnouncementsView';
import MessagesListView from './MessagesListView';
import StudentAttendanceView from './StudentAttendanceView';
import StudentGradesView from './StudentGradesView';
import TimetablePage from './TimetablePage';
import AssignmentsPage from './AssignmentsPage';

export default function StudentHomePage({ username, onLogout }) {
  const [studentData, setStudentData] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef([...Array(7)].map(() => new Animated.Value(1))).current;

  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    fetchStudentData();
  }, []);
  
  useEffect(() => {
    if (studentData) {
      checkUnreadAnnouncements();
      checkUnreadMessages();
      
      // Set up polling for new announcements and messages
      const interval = setInterval(() => {
        checkUnreadAnnouncements();
        checkUnreadMessages();
      }, 10000); // Check every 10 seconds
      
      return () => {
        clearInterval(interval);
      };
    }
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [studentData]);

  const animatePress = (index) => {
    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
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
      if (user && studentData) {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .or('recipients.eq.students,recipients.eq.all')
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          const unread = data.filter(announcement => {
            const readBy = Array.isArray(announcement.read_by) ? announcement.read_by : [];
            return !readBy.includes(studentData.id);
          }).length;
          
          setUnreadAnnouncements(unread);
        }
      }
    } catch (error) {
      console.error('Error checking unread announcements:', error);
    }
  };

  const checkUnreadMessages = async () => {
    try {
      if (studentData) {
        // Get user's last read timestamp from students table
        const { data: userData, error: userError } = await supabase
          .from('students')
          .select('last_read_messages')
          .eq('id', studentData.id)
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
            !(msg.sender_id === studentData.id && msg.sender_name === studentData.name)
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
    try {
      console.log('Logout button pressed');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
      }
      console.log('Calling onLogout callback');
      if (onLogout && typeof onLogout === 'function') {
        onLogout();
      } else {
        console.error('onLogout is not a function:', onLogout);
      }
    } catch (error) {
      console.error('Error in handleLogout:', error);
      if (onLogout && typeof onLogout === 'function') {
        onLogout();
      }
    }
  };

  const handleNavigation = async (page) => {
    if (page === 'Messages') {
      // Mark messages as read by updating timestamp in database
      await supabase
        .from('students')
        .update({ last_read_messages: new Date().toISOString() })
        .eq('id', studentData.id);
      setUnreadMessages(0);
    }
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
    return <MessagesListView 
      onBack={() => {
        handleBack();
        checkUnreadMessages();
      }}
      userRole="student"
      userData={studentData}
    />;
  }

  if (currentPage === 'Attendance') {
    return <StudentAttendanceView onBack={handleBack} studentData={studentData} />;
  }

  if (currentPage === 'Grades') {
    return <StudentGradesView onBack={handleBack} studentData={studentData} />;
  }

  if (currentPage === 'Timetable') {
    return <TimetablePage onBack={handleBack} userRole="student" classId={studentData?.class} />;
  }

  if (currentPage === 'Assignments') {
    return <AssignmentsPage onBack={handleBack} userRole="student" studentData={studentData} />;
  }

  return (
    <SafeAreaView style={styles.container}>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {unreadAnnouncements > 0 && (
          <View style={styles.notification}>
            <Text style={styles.notificationText}>
              🔔 You have {unreadAnnouncements} new {unreadAnnouncements === 1 ? 'announcement' : 'announcements'}
            </Text>
          </View>
        )}
        
        <View style={styles.header}>
          <Text style={styles.welcome}>Welcome {username}!</Text>
          {studentData && (
            <Text style={styles.classInfo}>
              Class: {studentData.class || 'Not Assigned'}
            </Text>
          )}
        </View>
        
        <Animated.View style={[styles.gridContainer, { opacity: fadeAnim }]}>
          <Animated.View style={{ transform: [{ scale: scaleAnims[0] }] }}>
            <TouchableOpacity 
              style={[styles.box, { backgroundColor: '#FF6B6B' }]} 
              onPress={() => { animatePress(0); handleNavigation('Attendance'); }}
            >
              <Text style={styles.emoji}>📊</Text>
              <Text style={styles.boxText}>My Attendance</Text>
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View style={{ transform: [{ scale: scaleAnims[1] }] }}>
            <TouchableOpacity 
              style={[styles.box, { backgroundColor: '#4ECDC4' }]} 
              onPress={() => { animatePress(1); handleNavigation('Grades'); }}
            >
              <Text style={styles.emoji}>🏆</Text>
              <Text style={styles.boxText}>My Grades</Text>
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View style={{ transform: [{ scale: scaleAnims[2] }] }}>
            <TouchableOpacity 
              style={[styles.box, { backgroundColor: '#45B7D1' }]} 
              onPress={() => { animatePress(2); handleNavigation('Timetable'); }}
            >
              <Text style={styles.emoji}>📅</Text>
              <Text style={styles.boxText}>Timetable</Text>
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View style={{ transform: [{ scale: scaleAnims[3] }] }}>
            <TouchableOpacity 
              style={[styles.box, { backgroundColor: '#96CEB4' }]} 
              onPress={() => { animatePress(3); handleNavigation('Assignments'); }}
            >
              <Text style={styles.emoji}>📝</Text>
              <Text style={styles.boxText}>Assignments</Text>
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View style={{ transform: [{ scale: scaleAnims[4] }] }}>
            <TouchableOpacity 
              style={[styles.box, { backgroundColor: '#FFEAA7' }]} 
              onPress={() => { animatePress(4); handleNavigation('Announcements'); }}
            >
              <Text style={styles.emoji}>📢</Text>
              <Text style={styles.boxText}>Announcements</Text>
              {unreadAnnouncements > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadAnnouncements}</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View style={{ transform: [{ scale: scaleAnims[5] }] }}>
            <TouchableOpacity 
              style={[styles.box, { backgroundColor: '#DDA0DD' }]} 
              onPress={() => { animatePress(5); handleNavigation('Messages'); }}
            >
              <Text style={styles.emoji}>💬</Text>
              <Text style={styles.boxText}>Message Teachers</Text>
              {unreadMessages > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadMessages}</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View style={{ transform: [{ scale: scaleAnims[6] }] }}>
            <TouchableOpacity 
              style={[styles.box, styles.logoutBox]} 
              onPress={() => { animatePress(6); handleLogout(); }}
            >
              <Text style={styles.emoji}>👋</Text>
              <Text style={[styles.boxText, styles.logoutText]}>Log Out</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
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
    paddingHorizontal: getResponsiveWidth(4),
    paddingTop: getResponsiveHeight(2),
    paddingBottom: getResponsiveHeight(3),
    flexGrow: 1,
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
    color: '#667eea',
    marginBottom: 8,
  },
  classInfo: {
    fontSize: isVerySmallScreen() ? 16 : 18,
    color: '#667eea',
    fontWeight: '500',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: isSmallScreen() ? 'center' : 'space-between',
    alignContent: 'flex-start',
    alignItems: 'stretch',
    gap: normalize(8),
  },
  box: {
    width: isSmallScreen() ? getResponsiveWidth(88) : getResponsiveWidth(44),
    height: isVerySmallScreen() ? normalize(90) : normalize(120),
    backgroundColor: '#4a90e2',
    borderRadius: normalize(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: normalize(8),
    padding: normalize(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  emoji: {
    fontSize: isVerySmallScreen() ? 28 : 36,
    marginBottom: normalize(8),
  },
  boxText: {
    color: '#fff',
    fontSize: isVerySmallScreen() ? 16 : 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: isVerySmallScreen() ? 18 : 22,
    letterSpacing: 0.5,
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