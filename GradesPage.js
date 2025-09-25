import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal, TextInput } from 'react-native';
import { supabase } from './supabase';

export default function GradesPage({ onBack, teacherClass, teacherSubject }) {
  // If teacherSubject is not provided, get it from the database
  const [teacherInfo, setTeacherInfo] = useState({ subject: teacherSubject || '' });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showGradingPage, setShowGradingPage] = useState(false);
  const [gradeData, setGradeData] = useState({
    score: '',
    term: 'First Term',
    academicYear: '2023/2024'
  });
  const [studentGrades, setStudentGrades] = useState({});

  const terms = ['First Term', 'Second Term', 'Third Term'];
  
  useEffect(() => {
    fetchStudents();
    fetchAllGrades();
    if (!teacherSubject) {
      fetchTeacherInfo();
    }
  }, []);

  const fetchTeacherInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('teachers')
          .select('subject')
          .eq('email', user.email)
          .single();
        
        if (!error && data) {
          setTeacherInfo({ subject: data.subject });
        }
      }
    } catch (error) {
      console.error('Error fetching teacher info:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('class', teacherClass);
      
      if (error) {
        console.error('Error fetching students:', error);
      } else {
        setStudents(data || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllGrades = async () => {
    try {
      const { data, error } = await supabase
        .from('grades')
        .select('*')
        .eq('class', teacherClass);
      
      if (error) {
        // Handle missing grades table error
        if (error.code === 'PGRST205') {
          console.log('Grades table not found - this is normal if no grades have been created yet');
          setStudentGrades({});
          return;
        }
        console.error('Error fetching grades:', error);
        return;
      }
      
      // Group grades by student_id
      const gradesMap = {};
      data.forEach(grade => {
        if (!gradesMap[grade.student_id]) {
          gradesMap[grade.student_id] = [];
        }
        gradesMap[grade.student_id].push(grade);
      });
      
      setStudentGrades(gradesMap);
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  const getGradeFromScore = (score) => {
    const numScore = Number(score);
    if (numScore >= 75) return 'A';
    if (numScore >= 65) return 'B';
    if (numScore >= 55) return 'C';
    if (numScore >= 45) return 'D';
    if (numScore >= 35) return 'E';
    return 'F';
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setShowGradingPage(true);
    // Fetch grades for this specific student
    fetchStudentGrades(student.student_id);
  };

  const fetchStudentGrades = async (studentId) => {
    try {
      const { data, error } = await supabase
        .from('grades')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      
      if (error && error.code !== 'PGRST205') {
        console.error('Error fetching student grades:', error);
        return;
      }
      
      setStudentGrades({ [studentId]: data || [] });
    } catch (error) {
      console.error('Error fetching student grades:', error);
    }
  };

  const handleAddGrade = () => {
    setGradeData({
      score: '',
      term: 'First Term',
      academicYear: '2023/2024'
    });
    setModalVisible(true);
  };

  const saveGrade = async () => {
    if (!teacherInfo.subject || !gradeData.score) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const score = Number(gradeData.score);
    if (isNaN(score) || score < 0 || score > 100) {
      Alert.alert('Error', 'Score must be a number between 0 and 100');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('grades')
        .insert([
          {
            student_id: selectedStudent.student_id,
            student_name: selectedStudent.name,
            class: teacherClass,
            subject: teacherInfo.subject,
            score: score,
            grade: getGradeFromScore(score),
            term: gradeData.term,
            academic_year: gradeData.academicYear
          }
        ]);
      
      if (error) {
        if (error.code === 'PGRST205') {
          Alert.alert('Error', 'Grades table not found. Please contact administrator to set up the grades system.');
        } else {
          Alert.alert('Error', error.message);
        }
      } else {
        Alert.alert('Success', 'Grade added successfully');
        setModalVisible(false);
        fetchStudentGrades(selectedStudent.student_id);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add grade');
    }
  };

  const deleteGrade = async (gradeId) => {
    try {
      const { error } = await supabase
        .from('grades')
        .delete()
        .eq('id', gradeId);
      
      if (error) {
        if (error.code === 'PGRST205') {
          Alert.alert('Error', 'Grades table not found. Please contact administrator.');
        } else {
          Alert.alert('Error', error.message);
        }
      } else {
        Alert.alert('Success', 'Grade deleted successfully');
        fetchStudentGrades(selectedStudent.student_id);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete grade');
    }
  };

  const renderGradeItem = ({ item }) => (
    <View style={styles.gradeItem}>
      <View style={styles.gradeHeader}>
        <Text style={styles.gradeSubject}>{item.subject}</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            Alert.alert(
              'Delete Grade',
              'Are you sure you want to delete this grade?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete', 
                  onPress: () => deleteGrade(item.id),
                  style: 'destructive'
                }
              ]
            );
          }}
        >
          <Text style={styles.deleteButtonText}>×</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.gradeDetails}>
        <Text style={styles.gradeScore}>Score: {item.score}</Text>
        <Text style={[
          styles.gradeLabel, 
          item.grade === 'A' ? styles.gradeA : 
          item.grade === 'B' ? styles.gradeB :
          item.grade === 'C' ? styles.gradeC :
          item.grade === 'D' ? styles.gradeD :
          item.grade === 'E' ? styles.gradeE : styles.gradeF
        ]}>
          {item.grade}
        </Text>
      </View>
      <Text style={styles.gradeTerm}>{item.term} - {item.academic_year}</Text>
    </View>
  );

  const calculateFinalGrade = (grades) => {
    if (grades.length === 0) return { score: 0, grade: 'N/A' };
    
    const totalScore = grades.reduce((sum, grade) => sum + grade.score, 0);
    const averageScore = Math.round(totalScore / grades.length);
    const finalGrade = getGradeFromScore(averageScore);
    
    return { score: averageScore, grade: finalGrade };
  };

  const renderStudent = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.studentCard}
        onPress={() => handleStudentSelect(item)}
      >
        <View style={styles.studentHeader}>
          <View>
            <Text style={styles.studentName}>{item.name}</Text>
            <Text style={styles.studentId}>ID: {item.student_id}</Text>
          </View>
          <Text style={styles.tapHint}>Tap to grade →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGradingPage = () => {
    const studentGradesList = studentGrades[selectedStudent.student_id] || [];
    const finalGrade = calculateFinalGrade(studentGradesList);
    
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowGradingPage(false)}>
            <Text style={styles.backButton}>← Back to Students</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Grade Student</Text>
        </View>
        
        <View style={styles.studentInfoCard}>
          <Text style={styles.studentName}>{selectedStudent.name}</Text>
          <Text style={styles.studentId}>ID: {selectedStudent.student_id}</Text>
          <Text style={styles.classText}>Class: {teacherClass}</Text>
          <Text style={styles.subjectText}>Subject: {teacherInfo.subject}</Text>
        </View>
        
        <View style={styles.gradeActions}>
          <TouchableOpacity 
            style={styles.addGradeButton}
            onPress={handleAddGrade}
          >
            <Text style={styles.addGradeText}>Add New Grade</Text>
          </TouchableOpacity>
        </View>
        
        {studentGradesList.length > 0 && (
          <View style={styles.finalGradeContainer}>
            <Text style={styles.finalGradeLabel}>Final Grade:</Text>
            <View style={styles.finalGradeContent}>
              <Text style={styles.finalGradeScore}>Average: {finalGrade.score}%</Text>
              <Text style={[
                styles.finalGradeValue,
                finalGrade.grade === 'A' ? styles.gradeA : 
                finalGrade.grade === 'B' ? styles.gradeB :
                finalGrade.grade === 'C' ? styles.gradeC :
                finalGrade.grade === 'D' ? styles.gradeD :
                finalGrade.grade === 'E' ? styles.gradeE : 
                finalGrade.grade === 'N/A' ? styles.gradeNA : styles.gradeF
              ]}>
                {finalGrade.grade}
              </Text>
            </View>
          </View>
        )}
        
        <FlatList
          data={studentGradesList}
          renderItem={renderGradeItem}
          keyExtractor={(item, index) => `${item.student_id}-${index}`}
          style={styles.gradesList}
          ListEmptyComponent={
            <Text style={styles.noGradesText}>No grades recorded for this student</Text>
          }
        />
      </View>
    );
  };

  if (showGradingPage && selectedStudent) {
    return (
      <>
        {renderGradingPage()}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Add Grade for {selectedStudent?.name}
              </Text>
              
              <View style={styles.subjectContainer}>
                <Text style={styles.inputLabel}>Subject:</Text>
                <Text style={styles.subjectText}>{teacherInfo.subject}</Text>
              </View>
              
              <TextInput
                style={styles.input}
                placeholder="Score (0-100)"
                keyboardType="numeric"
                value={gradeData.score}
                onChangeText={(text) => setGradeData({...gradeData, score: text})}
              />
              
              <Text style={styles.inputLabel}>Term:</Text>
              <View style={styles.termButtons}>
                {terms.map(term => (
                  <TouchableOpacity
                    key={term}
                    style={[
                      styles.termButton,
                      gradeData.term === term && styles.selectedTermButton
                    ]}
                    onPress={() => setGradeData({...gradeData, term})}
                  >
                    <Text style={[
                      styles.termButtonText,
                      gradeData.term === term && styles.selectedTermText
                    ]}>
                      {term}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TextInput
                style={styles.input}
                placeholder="Academic Year (e.g. 2023/2024)"
                value={gradeData.academicYear}
                onChangeText={(text) => setGradeData({...gradeData, academicYear: text})}
              />
              
              {gradeData.score ? (
                <View style={styles.previewContainer}>
                  <Text style={styles.previewText}>
                    Grade: <Text style={[
                      styles.previewGrade,
                      getGradeFromScore(gradeData.score) === 'A' ? styles.gradeA : 
                      getGradeFromScore(gradeData.score) === 'B' ? styles.gradeB :
                      getGradeFromScore(gradeData.score) === 'C' ? styles.gradeC :
                      getGradeFromScore(gradeData.score) === 'D' ? styles.gradeD :
                      getGradeFromScore(gradeData.score) === 'E' ? styles.gradeE : styles.gradeF
                    ]}>
                      {getGradeFromScore(gradeData.score)}
                    </Text>
                  </Text>
                </View>
              ) : null}
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]} 
                  onPress={saveGrade}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Select Student to Grade</Text>
      </View>
      
      <View style={styles.classInfo}>
        <Text style={styles.classText}>Class: {teacherClass}</Text>
        <Text style={styles.subjectText}>Subject: {teacherInfo.subject}</Text>
      </View>
      
      <FlatList
        data={students}
        renderItem={renderStudent}
        keyExtractor={(item) => item.id.toString()}
        style={styles.studentList}
        refreshing={loading}
        onRefresh={fetchStudents}
      />
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
    fontWeight: '602',
    color: '#333',
  },
  classInfo: {
    marginBottom: 20,
  },
  classText: {
    fontSize: 16,
    fontWeight: '600',
  },
  studentList: {
    flex: 1,
  },
  studentCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
    width: '100%',
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 15,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  studentId: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  addGradeButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  addGradeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  noGradesText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 10,
  },
  gradeItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4a90e2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    width: '100%',
  },
  gradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  gradeSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  gradeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  gradeScore: {
    fontSize: 14,
    color: '#666',
  },
  gradeLabel: {
    fontSize: 18,
    fontWeight: '700',
    width: 30,
    height: 30,
    textAlign: 'center',
    textAlignVertical: 'center',
    borderRadius: 15,
    overflow: 'hidden',
  },
  gradeA: {
    color: '#fff',
    backgroundColor: '#4cd964',
  },
  gradeB: {
    color: '#fff',
    backgroundColor: '#5ac8fa',
  },
  gradeC: {
    color: '#fff',
    backgroundColor: '#ffcc00',
  },
  gradeD: {
    color: '#fff',
    backgroundColor: '#ff9500',
  },
  gradeE: {
    color: '#fff',
    backgroundColor: '#ff6b22',
  },
  gradeF: {
    color: '#fff',
    backgroundColor: '#ff3b30',
  },
  gradeNA: {
    color: '#fff',
    backgroundColor: '#8e8e93',
  },
  gradeTerm: {
    fontSize: 12,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '95%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  termButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  termButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  selectedTermButton: {
    backgroundColor: '#4a90e2',
    borderColor: '#3a80d2',
  },
  termButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  selectedTermText: {
    color: '#fff',
  },
  subjectContainer: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  subjectText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  previewContainer: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  previewText: {
    fontSize: 18,
    fontWeight: '600',
  },
  previewGrade: {
    fontSize: 24,
    fontWeight: '700',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  saveButton: {
    backgroundColor: '#4a90e2',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  finalGradeContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#5856d6',
  },
  finalGradeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  finalGradeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  finalGradeScore: {
    fontSize: 16,
    color: '#333',
  },
  finalGradeValue: {
    fontSize: 24,
    fontWeight: '700',
    width: 40,
    height: 40,
    textAlign: 'center',
    textAlignVertical: 'center',
    borderRadius: 20,
    overflow: 'hidden',
  },
  tapHint: {
    fontSize: 14,
    color: '#4a90e2',
    fontWeight: '500',
  },
  studentInfoCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  gradeActions: {
    marginBottom: 20,
  },
  gradesList: {
    flex: 1,
  },
});