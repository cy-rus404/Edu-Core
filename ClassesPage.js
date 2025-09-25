import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView, ScrollView } from 'react-native';
import { supabase } from './supabase';
import { getResponsiveWidth, isVerySmallScreen } from './responsive';

export default function ClassesPage({ onBack }) {
  const [classData, setClassData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const classes = [
    'Creche', 'Nursery', 'KG1', 'KG2', 'Class 1', 'Class 2', 'Class 3', 
    'Class 4', 'Class 5', 'Class 6', 'JHS 1', 'JHS 2', 'JHS 3'
  ];

  useEffect(() => {
    fetchClassData();
  }, []);

  const fetchClassData = async () => {
    setLoading(true);
    try {
      // Get all students
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('class');
      
      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        setClassData([]);
        return;
      }

      // Get all teachers
      const { data: teachers, error: teachersError } = await supabase
        .from('teachers')
        .select('assigned_class');
      
      if (teachersError) {
        console.error('Error fetching teachers:', teachersError);
        // Continue with empty teachers array if error
      }

      // Count students per class
      const studentCounts = {};
      classes.forEach(className => {
        studentCounts[className] = (students || []).filter(student => student.class === className).length;
      });

      // Count teachers per class
      const teacherCounts = {};
      classes.forEach(className => {
        teacherCounts[className] = (teachers || []).filter(teacher => teacher.assigned_class === className).length;
      });

      // Combine data
      const data = classes.map(className => ({
        name: className,
        students: studentCounts[className] || 0,
        teachers: teacherCounts[className] || 0
      }));

      setClassData(data);
    } catch (error) {
      console.error('Error fetching class data:', error);
      setClassData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassStudents = async (className) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('class', className)
        .order('name');
      
      if (error) {
        console.error('Error fetching class students:', error);
      } else {
        setClassStudents(data || []);
        setSelectedClass(className);
      }
    } catch (error) {
      console.error('Error fetching class students:', error);
    }
  };

  const renderClassItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.classCard}
      onPress={() => fetchClassStudents(item.name)}
    >
      <Text style={styles.className}>{item.name}</Text>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.students}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.teachers}</Text>
          <Text style={styles.statLabel}>Teachers</Text>
        </View>
      </View>
      <Text style={styles.tapHint}>Tap to view students</Text>
    </TouchableOpacity>
  );

  const renderStudentItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.studentCard}
      onPress={() => setSelectedStudent(item)}
    >
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={styles.studentDetails}>ID: {item.student_id}</Text>
        <Text style={styles.studentDetails}>Age: {item.age}</Text>
        <Text style={styles.studentDetails}>Email: {item.email}</Text>
        <Text style={styles.tapHint}>Tap for full details</Text>
      </View>
    </TouchableOpacity>
  );

  const renderStudentDetails = () => {
    if (!selectedStudent) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Student data not available</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.studentDetailsView}>
        <View style={styles.detailsHeader}>
          <TouchableOpacity onPress={() => setSelectedStudent(null)}>
            <Text style={styles.backToStudents}>← Back to Students</Text>
          </TouchableOpacity>
          <Text style={styles.studentDetailsTitle}>Student Details</Text>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>👤 Student Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name:</Text>
            <Text style={styles.detailValue}>{selectedStudent.name || 'Not provided'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Student ID:</Text>
            <Text style={styles.detailValue}>{selectedStudent.student_id || 'Not provided'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Age:</Text>
            <Text style={styles.detailValue}>{selectedStudent.age || 'Not provided'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date of Birth:</Text>
            <Text style={styles.detailValue}>{selectedStudent.dob || 'Not provided'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Gender:</Text>
            <Text style={styles.detailValue}>{selectedStudent.gender || 'Not specified'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Class:</Text>
            <Text style={styles.detailValue}>{selectedStudent.class || 'Not provided'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{selectedStudent.email || 'Not provided'}</Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>👩 Mother's Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name:</Text>
            <Text style={styles.detailValue}>{selectedStudent.mother_name || 'Not provided'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Contact:</Text>
            <Text style={styles.detailValue}>{selectedStudent.mother_contact || 'Not provided'}</Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>👨 Father's Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name:</Text>
            <Text style={styles.detailValue}>{selectedStudent.father_name || 'Not provided'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Contact:</Text>
            <Text style={styles.detailValue}>{selectedStudent.father_contact || 'Not provided'}</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButtonContainer} onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Classes</Text>
      </View>

      {selectedStudent ? (
        renderStudentDetails()
      ) : selectedClass ? (
        <View style={styles.studentsView}>
          <View style={styles.studentsHeader}>
            <TouchableOpacity onPress={() => setSelectedClass(null)}>
              <Text style={styles.backToClasses}>← Back to Classes</Text>
            </TouchableOpacity>
            <Text style={styles.classTitle}>{selectedClass} Students</Text>
          </View>
          
          <FlatList
            data={classStudents}
            renderItem={renderStudentItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.studentsListContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No students enrolled in this class</Text>
            }
          />
        </View>
      ) : (
        <FlatList
          data={classData}
          renderItem={renderClassItem}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={fetchClassData}
          numColumns={isVerySmallScreen() ? 1 : 2}
          columnWrapperStyle={!isVerySmallScreen() ? styles.columnWrapper : null}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: getResponsiveWidth(6),
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  backButtonContainer: {
    position: 'absolute',
    left: 0,
    zIndex: 1,
  },
  backButton: {
    fontSize: 18,
    color: '#4a90e2',
  },
  title: {
    fontSize: isVerySmallScreen() ? 20 : 24,
    fontWeight: '600',
    color: '#333',
  },
  listContent: {
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  classCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: isVerySmallScreen() ? 12 : 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    width: isVerySmallScreen() ? '100%' : '48%',
  },
  className: {
    fontSize: isVerySmallScreen() ? 16 : 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4a90e2',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  tapHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  studentsView: {
    flex: 1,
  },
  studentsHeader: {
    marginBottom: 20,
  },
  backToClasses: {
    fontSize: 16,
    color: '#4a90e2',
    marginBottom: 10,
  },
  classTitle: {
    fontSize: isVerySmallScreen() ? 18 : 20,
    fontWeight: '600',
    color: '#333',
  },
  studentsListContent: {
    paddingBottom: 20,
  },
  studentCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  studentDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 40,
  },
  studentDetailsView: {
    flex: 1,
  },
  detailsHeader: {
    marginBottom: 20,
  },
  backToStudents: {
    fontSize: 16,
    color: '#4a90e2',
    marginBottom: 10,
  },
  studentDetailsTitle: {
    fontSize: isVerySmallScreen() ? 18 : 20,
    fontWeight: '600',
    color: '#333',
  },
  detailsCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 100,
    marginRight: 10,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});