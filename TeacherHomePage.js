import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { supabase } from './supabase';
import AttendancePage from './AttendancePage';
import GradesPage from './GradesPage';

export default function TeacherHomePage({ username, onLogout }) {
  const [teacherData, setTeacherData] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    fetchTeacherData();
  }, []);

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

  return (
    <View style={styles.container}>
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