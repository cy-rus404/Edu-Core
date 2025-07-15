import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { supabase } from './supabase';

export default function StudentHomePage({ username, onLogout }) {
  const [studentData, setStudentData] = useState(null);

  useEffect(() => {
    fetchStudentData();
  }, []);

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

  return (
    <View style={styles.container}>
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
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
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
  logoutButton: {
    backgroundColor: '#ff4757',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});