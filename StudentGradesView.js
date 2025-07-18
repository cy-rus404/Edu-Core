import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { supabase } from './supabase';

export default function StudentGradesView({ onBack, studentData }) {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('All');

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      const { data, error } = await supabase
        .from('grades')
        .select('*')
        .eq('student_id', studentData.student_id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching grades:', error);
        return;
      }

      setGrades(data || []);
      
      // Extract unique subjects
      if (data && data.length > 0) {
        const uniqueSubjects = [...new Set(data.map(grade => grade.subject))];
        setSubjects(['All', ...uniqueSubjects]);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A':
        return styles.gradeA;
      case 'B':
        return styles.gradeB;
      case 'C':
        return styles.gradeC;
      case 'D':
        return styles.gradeD;
      case 'E':
        return styles.gradeE;
      case 'F':
        return styles.gradeF;
      default:
        return styles.gradeNA;
    }
  };

  const filteredGrades = selectedSubject === 'All' 
    ? grades 
    : grades.filter(grade => grade.subject === selectedSubject);

  const renderGradeItem = ({ item }) => (
    <View style={styles.gradeItem}>
      <View style={styles.gradeHeader}>
        <Text style={styles.gradeSubject}>{item.subject}</Text>
        <View style={[styles.gradeLabel, getGradeColor(item.grade)]}>
          <Text style={styles.gradeLabelText}>{item.grade}</Text>
        </View>
      </View>
      
      <View style={styles.gradeDetails}>
        <Text style={styles.gradeScore}>Score: {item.score}/100</Text>
        <Text style={styles.gradeTerm}>{item.term} - {item.academic_year}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Grades</Text>
      </View>

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter by Subject:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectFilter}>
          {subjects.map(subject => (
            <TouchableOpacity
              key={subject}
              style={[
                styles.subjectButton,
                selectedSubject === subject && styles.selectedSubjectButton
              ]}
              onPress={() => setSelectedSubject(subject)}
            >
              <Text style={[
                styles.subjectButtonText,
                selectedSubject === subject && styles.selectedSubjectText
              ]}>
                {subject}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <FlatList
        data={filteredGrades}
        renderItem={renderGradeItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        refreshing={loading}
        onRefresh={fetchGrades}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No grades found</Text>
        }
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
    fontWeight: '600',
    color: '#333',
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  subjectFilter: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  subjectButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  selectedSubjectButton: {
    backgroundColor: '#4a90e2',
  },
  subjectButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  selectedSubjectText: {
    color: '#fff',
  },
  list: {
    flex: 1,
  },
  gradeItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  gradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  gradeSubject: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  gradeLabel: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeLabelText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  gradeA: {
    backgroundColor: '#4cd964',
  },
  gradeB: {
    backgroundColor: '#5ac8fa',
  },
  gradeC: {
    backgroundColor: '#ffcc00',
  },
  gradeD: {
    backgroundColor: '#ff9500',
  },
  gradeE: {
    backgroundColor: '#ff6b22',
  },
  gradeF: {
    backgroundColor: '#ff3b30',
  },
  gradeNA: {
    backgroundColor: '#8e8e93',
  },
  gradeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradeScore: {
    fontSize: 16,
    color: '#666',
  },
  gradeTerm: {
    fontSize: 14,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 40,
  },
});