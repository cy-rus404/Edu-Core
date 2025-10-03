import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, Alert, FlatList } from 'react-native';
import { supabase, validateInput, handleError } from './supabase';

export default function SettingsPage({ onBack }) {
  const [students, setStudents] = useState([]);
  const [newPassword, setNewPassword] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [view, setView] = useState('menu'); // 'menu', 'classes', 'students', 'reset', 'academic', 'promotion', 'promotion-classes', 'promotion-students'
  const [academicYear, setAcademicYear] = useState('');
  const [promotionScore, setPromotionScore] = useState('');
  const [promotionStudents, setPromotionStudents] = useState([]);
  const [selectedForPromotion, setSelectedForPromotion] = useState({});
  const [promotionClass, setPromotionClass] = useState(null);

  const classes = [
    'Creche', 'Nursery', 'KG1', 'KG2', 'Class 1', 'Class 2', 'Class 3', 
    'Class 4', 'Class 5', 'Class 6', 'JHS 1', 'JHS 2', 'JHS 3'
  ];

  const nextClass = {
    'Creche': 'Nursery', 'Nursery': 'KG1', 'KG1': 'KG2', 'KG2': 'Class 1',
    'Class 1': 'Class 2', 'Class 2': 'Class 3', 'Class 3': 'Class 4',
    'Class 4': 'Class 5', 'Class 5': 'Class 6', 'Class 6': 'JHS 1',
    'JHS 1': 'JHS 2', 'JHS 2': 'JHS 3', 'JHS 3': 'Graduated'
  };

  const fetchStudentsByClass = async (className) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('class', className);
      
      if (error) {
        console.error('Error fetching students:', error);
      } else {
        setStudents(data || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleResetPasswordClick = () => {
    setView('classes');
  };

  const handleAcademicYearClick = () => {
    setView('academic');
    loadAcademicSettings();
  };

  const handlePromotionClick = () => {
    setView('promotion-classes');
  };

  const handlePromotionClassSelect = (className) => {
    setPromotionClass(className);
    loadPromotionDataByClass(className);
    setView('promotion-students');
  };

  const loadAcademicSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('academic_settings')
        .select('*')
        .single();
      
      if (data) {
        setAcademicYear(data.current_year || '');
        setPromotionScore(data.promotion_score?.toString() || '');
      }
    } catch (error) {
      console.error('Error loading academic settings:', error);
    }
  };

  const loadPromotionDataByClass = async (className) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('class', className);
      
      if (data) {
        setPromotionStudents(data);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const saveAcademicSettings = async () => {
    if (!validateInput(academicYear)) {
      Alert.alert('Error', 'Please enter a valid academic year');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('academic_settings')
        .upsert({
          current_year: academicYear,
          promotion_score: parseFloat(promotionScore) || 0
        });
      
      if (error) {
        Alert.alert('Error', handleError(error, 'Failed to save settings'));
      } else {
        Alert.alert('Success', 'Academic settings saved!');
      }
    } catch (error) {
      Alert.alert('Error', handleError(error, 'Failed to save settings'));
    }
  };

  const promoteStudents = async () => {
    try {
      const studentsToPromote = Object.keys(selectedForPromotion)
        .filter(id => selectedForPromotion[id])
        .map(id => promotionStudents.find(s => s.id.toString() === id))
        .filter(student => student && nextClass[student.class]);

      for (const student of studentsToPromote) {
        await supabase
          .from('students')
          .update({ class: nextClass[student.class] })
          .eq('id', student.id);
      }

      Alert.alert('Success', `${studentsToPromote.length} students promoted!`);
      setSelectedForPromotion({});
      if (promotionClass) {
        loadPromotionDataByClass(promotionClass);
      }
    } catch (error) {
      Alert.alert('Error', handleError(error, 'Failed to promote students'));
    }
  };

  const autoPromoteByScore = async () => {
    if (!promotionScore) {
      Alert.alert('Error', 'Please set promotion score first');
      return;
    }

    try {
      const { data: grades } = await supabase
        .from('grades')
        .select('student_id, AVG(score) as avg_score')
        .group('student_id');

      const eligibleStudents = grades
        ?.filter(g => g.avg_score >= parseFloat(promotionScore))
        .map(g => g.student_id) || [];

      for (const studentId of eligibleStudents) {
        const student = promotionStudents.find(s => s.id === studentId);
        if (student && nextClass[student.class]) {
          await supabase
            .from('students')
            .update({ class: nextClass[student.class] })
            .eq('id', studentId);
        }
      }

      Alert.alert('Success', `${eligibleStudents.length} students auto-promoted!`);
      if (promotionClass) {
        loadPromotionDataByClass(promotionClass);
      }
    } catch (error) {
      Alert.alert('Error', handleError(error, 'Failed to auto-promote students'));
    }
  };

  const handleClassSelect = (className) => {
    setSelectedClass(className);
    fetchStudentsByClass(className);
    setView('students');
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setView('reset');
  };

  const resetPassword = async () => {
    if (!validateInput(newPassword, 'password')) {
      Alert.alert('Error', 'Please enter a valid password (min 6 characters)');
      return;
    }

    try {
      const { error } = await supabase
        .from('students')
        .update({ password: newPassword })
        .eq('id', selectedStudent.id);

      if (error) {
        Alert.alert('Error', handleError(error, 'Failed to reset password'));
      } else {
        Alert.alert('Success', `Password reset for ${selectedStudent.name}`);
        setNewPassword('');
        setView('menu');
        setSelectedStudent(null);
        setSelectedClass(null);
        setStudents([]);
      }
    } catch (error) {
      Alert.alert('Error', handleError(error, 'Failed to reset password'));
    }
  };

  const goBack = () => {
    if (view === 'reset') {
      setView('students');
      setSelectedStudent(null);
    } else if (view === 'students') {
      setView('classes');
      setSelectedClass(null);
      setStudents([]);
    } else if (view === 'promotion-students') {
      setView('promotion-classes');
      setPromotionClass(null);
      setPromotionStudents([]);
    } else if (view === 'classes' || view === 'academic' || view === 'promotion-classes') {
      setView('menu');
    } else {
      onBack();
    }
  };

  const renderClass = ({ item }) => (
    <TouchableOpacity style={styles.classItem} onPress={() => handleClassSelect(item)}>
      <Text style={styles.className}>{item}</Text>
    </TouchableOpacity>
  );

  const renderStudent = ({ item }) => (
    <TouchableOpacity style={styles.studentItem} onPress={() => handleStudentSelect(item)}>
      <Text style={styles.studentName}>{item.name}</Text>
      <Text style={styles.studentId}>ID: {item.student_id}</Text>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (view === 'menu') {
      return (
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleResetPasswordClick}>
            <Text style={styles.menuText}>Reset Student Password</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleAcademicYearClick}>
            <Text style={styles.menuText}>Academic Year Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handlePromotionClick}>
            <Text style={styles.menuText}>Student Promotion</Text>
          </TouchableOpacity>
        </View>
      );
    } else if (view === 'academic') {
      return (
        <View style={styles.resetContainer}>
          <Text style={styles.sectionTitle}>Academic Year Settings</Text>
          <TextInput
            style={styles.input}
            placeholder="Academic Year (e.g., 2023-2024)"
            value={academicYear}
            onChangeText={setAcademicYear}
          />
          <TextInput
            style={styles.input}
            placeholder="Promotion Score Threshold"
            value={promotionScore}
            onChangeText={setPromotionScore}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.resetButton} onPress={saveAcademicSettings}>
            <Text style={styles.resetButtonText}>Save Settings</Text>
          </TouchableOpacity>
        </View>
      );
    } else if (view === 'promotion-classes') {
      return (
        <FlatList
          data={classes.filter(c => c !== 'JHS 3')} // Exclude final class
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.classItem} onPress={() => handlePromotionClassSelect(item)}>
              <Text style={styles.className}>{item} → {nextClass[item]}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
          ListHeaderComponent={() => <Text style={styles.sectionTitle}>Select Class for Promotion</Text>}
        />
      );
    } else if (view === 'promotion-students') {
      return (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Promote Students from {promotionClass}</Text>
          <Text style={styles.promotionInfo}>Next Class: {nextClass[promotionClass]}</Text>
          <View style={styles.promotionButtons}>
            <TouchableOpacity style={styles.autoPromoteButton} onPress={autoPromoteByScore}>
              <Text style={styles.autoPromoteText}>Auto Promote by Score</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.manualPromoteButton} onPress={promoteStudents}>
              <Text style={styles.manualPromoteText}>Promote Selected</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={promotionStudents}
            renderItem={({ item }) => (
              <View style={styles.promotionItem}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{item.name}</Text>
                  <Text style={styles.studentId}>ID: {item.student_id}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.checkbox, selectedForPromotion[item.id] && styles.checkedBox]}
                  onPress={() => setSelectedForPromotion({
                    ...selectedForPromotion,
                    [item.id]: !selectedForPromotion[item.id]
                  })}
                >
                  <Text style={styles.checkmark}>{selectedForPromotion[item.id] ? '✓' : ''}</Text>
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(item) => item.id.toString()}
          />
        </View>
      );
    } else if (view === 'classes') {
      return (
        <FlatList
          data={classes}
          renderItem={renderClass}
          keyExtractor={(item) => item}
          ListHeaderComponent={() => <Text style={styles.sectionTitle}>Select Class</Text>}
        />
      );
    } else if (view === 'students') {
      return (
        <FlatList
          data={students}
          renderItem={renderStudent}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={() => <Text style={styles.sectionTitle}>Select Student from {selectedClass}</Text>}
        />
      );
    } else {
      return (
        <View style={styles.resetContainer}>
          <Text style={styles.sectionTitle}>Reset Password</Text>
          <Text style={styles.selectedText}>Student: {selectedStudent.name}</Text>
          <Text style={styles.selectedText}>Class: {selectedClass}</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <TouchableOpacity style={styles.resetButton} onPress={resetPassword}>
            <Text style={styles.resetButtonText}>Reset Password</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    fontSize: 18,
    color: '#4a90e2',
    marginRight: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  resetContainer: {
    padding: 20,
  },
  classItem: {
    padding: 15,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    marginBottom: 10,
    marginHorizontal: 20,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  menuContainer: {
    padding: 20,
  },
  menuItem: {
    padding: 20,
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    marginBottom: 15,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  promotionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  autoPromoteButton: {
    flex: 1,
    backgroundColor: '#4ECDC4',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
  },
  autoPromoteText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  manualPromoteButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    padding: 12,
    borderRadius: 8,
    marginLeft: 10,
  },
  manualPromoteText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  promotionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 10,
    marginHorizontal: 20,
  },
  studentInfo: {
    flex: 1,
  },
  studentClass: {
    fontSize: 14,
    color: '#666',
  },
  checkbox: {
    width: 30,
    height: 30,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  checkmark: {
    color: '#fff',
    fontWeight: 'bold',
  },
  promotionInfo: {
    fontSize: 16,
    color: '#4a90e2',
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    marginHorizontal: 20,
    marginTop: 10,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },

  studentItem: {
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 10,
    marginHorizontal: 20,
  },
  selectedStudent: {
    backgroundColor: '#e3f2fd',
    borderColor: '#4a90e2',
    borderWidth: 2,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  studentId: {
    fontSize: 14,
    color: '#666',
  },
  resetSection: {
    marginTop: 20,
  },
  selectedText: {
    fontSize: 16,
    color: '#4a90e2',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    marginTop: 10,
  },
  resetButton: {
    backgroundColor: '#ff6b6b',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});