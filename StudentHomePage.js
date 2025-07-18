import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { supabase } from './supabase';
import AnnouncementsView from './AnnouncementsView';
import MessagePage from './MessagePage';
import StudentAttendanceView from './StudentAttendanceView';
import StudentGradesView from './StudentGradesView';
import TimetablePage from './TimetablePage';
import AssignmentsPage from './AssignmentsPage';

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
        {studentData && (
          <Text style={styles.classInfo}>
            Class: {studentData.class || 'Not Assigned'}
          </Text>
        )}
      </View>
      
      <View style={styles.gridContainer}>
        <TouchableOpacity 
          style={styles.box} 
          onPress={() => handleNavigation('Attendance')}
        >
          <Text style={styles.boxText}>My Attendance</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.box} 
          onPress={() => handleNavigation('Grades')}
        >
          <Text style={styles.boxText}>My Grades</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.box} 
          onPress={() => handleNavigation('Timetable')}
        >
          <Text style={styles.boxText}>Timetable</Text>
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
          <Text style={styles.boxText}>Message Teachers</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.box, styles.logoutBox]} 
          onPress={handleLogout}
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