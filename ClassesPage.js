import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { supabase } from './supabase';

export default function ClassesPage({ onBack }) {
  const [classData, setClassData] = useState([]);
  const [loading, setLoading] = useState(true);

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
        return;
      }

      // Get all teachers
      const { data: teachers, error: teachersError } = await supabase
        .from('teachers')
        .select('assigned_class');
      
      if (teachersError) {
        console.error('Error fetching teachers:', teachersError);
        return;
      }

      // Count students per class
      const studentCounts = {};
      classes.forEach(className => {
        studentCounts[className] = students.filter(student => student.class === className).length;
      });

      // Count teachers per class
      const teacherCounts = {};
      classes.forEach(className => {
        teacherCounts[className] = teachers.filter(teacher => teacher.assigned_class === className).length;
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
    } finally {
      setLoading(false);
    }
  };

  const renderClassItem = ({ item }) => (
    <View style={styles.classCard}>
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
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Classes</Text>
      </View>

      <FlatList
        data={classData}
        renderItem={renderClassItem}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={fetchClassData}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
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
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    fontSize: 18,
    color: '#4a90e2',
    position: 'absolute',
    top: 5,
    left: -185,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
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
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    width: '48%',
  },
  className: {
    fontSize: 18,
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
});