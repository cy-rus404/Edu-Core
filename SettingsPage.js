import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, ScrollView, Alert } from 'react-native';
import { supabase } from './supabase';
import { getResponsiveWidth, isVerySmallScreen } from './responsive';

export default function SettingsPage({ onBack }) {
  const [schoolInfo, setSchoolInfo] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: ''
  });
  const [academicYear, setAcademicYear] = useState({
    current_year: '',
    term_start: '',
    term_end: '',
    current_term: ''
  });
  const [classes, setClasses] = useState([]);
  const [newClass, setNewClass] = useState({ name: '', capacity: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load school info
      const { data: school } = await supabase
        .from('school_settings')
        .select('*')
        .single();
      
      if (school) setSchoolInfo(school);

      // Load academic year
      const { data: academic } = await supabase
        .from('academic_settings')
        .select('*')
        .single();
      
      if (academic) setAcademicYear(academic);

      // Load classes
      const { data: classData } = await supabase
        .from('class_settings')
        .select('*')
        .order('name');
      
      if (classData) setClasses(classData);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSchoolInfo = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('school_settings')
        .upsert(schoolInfo);
      
      if (error) throw error;
      Alert.alert('Success', 'School information saved!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save school information');
    } finally {
      setLoading(false);
    }
  };

  const saveAcademicYear = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('academic_settings')
        .upsert(academicYear);
      
      if (error) throw error;
      Alert.alert('Success', 'Academic year settings saved!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save academic settings');
    } finally {
      setLoading(false);
    }
  };

  const addClass = async () => {
    if (!newClass.name || !newClass.capacity) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('class_settings')
        .insert({
          name: newClass.name,
          capacity: parseInt(newClass.capacity)
        });
      
      if (error) throw error;
      setNewClass({ name: '', capacity: '' });
      loadSettings();
      Alert.alert('Success', 'Class added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add class');
    }
  };

  const removeClass = async (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to remove this class?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('class_settings')
                .delete()
                .eq('id', id);
              
              if (error) throw error;
              loadSettings();
              Alert.alert('Success', 'Class removed successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove class');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* School Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏫 School Information</Text>
          
          <TextInput
            style={styles.input}
            placeholder="School Name"
            value={schoolInfo.name}
            onChangeText={(text) => setSchoolInfo({...schoolInfo, name: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Address"
            value={schoolInfo.address}
            onChangeText={(text) => setSchoolInfo({...schoolInfo, address: text})}
            multiline
          />
          
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={schoolInfo.phone}
            onChangeText={(text) => setSchoolInfo({...schoolInfo, phone: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={schoolInfo.email}
            onChangeText={(text) => setSchoolInfo({...schoolInfo, email: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Website"
            value={schoolInfo.website}
            onChangeText={(text) => setSchoolInfo({...schoolInfo, website: text})}
          />
          
          <TouchableOpacity style={styles.saveButton} onPress={saveSchoolInfo} disabled={loading}>
            <Text style={styles.saveButtonText}>Save School Info</Text>
          </TouchableOpacity>
        </View>

        {/* Academic Year Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Academic Year Settings</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Current Academic Year (e.g., 2023-2024)"
            value={academicYear.current_year}
            onChangeText={(text) => setAcademicYear({...academicYear, current_year: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Term Start Date (YYYY-MM-DD)"
            value={academicYear.term_start}
            onChangeText={(text) => setAcademicYear({...academicYear, term_start: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Term End Date (YYYY-MM-DD)"
            value={academicYear.term_end}
            onChangeText={(text) => setAcademicYear({...academicYear, term_end: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Current Term (e.g., First Term)"
            value={academicYear.current_term}
            onChangeText={(text) => setAcademicYear({...academicYear, current_term: text})}
          />
          
          <TouchableOpacity style={styles.saveButton} onPress={saveAcademicYear} disabled={loading}>
            <Text style={styles.saveButtonText}>Save Academic Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Class Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎓 Class Management</Text>
          
          <View style={styles.addClassContainer}>
            <TextInput
              style={[styles.input, styles.classInput]}
              placeholder="Class Name"
              value={newClass.name}
              onChangeText={(text) => setNewClass({...newClass, name: text})}
            />
            
            <TextInput
              style={[styles.input, styles.capacityInput]}
              placeholder="Capacity"
              value={newClass.capacity}
              onChangeText={(text) => setNewClass({...newClass, capacity: text})}
              keyboardType="numeric"
            />
            
            <TouchableOpacity style={styles.addButton} onPress={addClass}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {classes.map((classItem) => (
            <View key={classItem.id} style={styles.classItem}>
              <View style={styles.classInfo}>
                <Text style={styles.className}>{classItem.name}</Text>
                <Text style={styles.classCapacity}>Capacity: {classItem.capacity}</Text>
              </View>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => removeClass(classItem.id)}
              >
                <Text style={styles.deleteButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
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
    marginBottom: 20,
  },
  backButton: {
    fontSize: 18,
    color: '#4a90e2',
    marginRight: 20,
  },
  title: {
    fontSize: isVerySmallScreen() ? 20 : 24,
    fontWeight: '600',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#4a90e2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addClassContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-end',
  },
  classInput: {
    flex: 2,
    marginRight: 10,
    marginBottom: 0,
  },
  capacityInput: {
    flex: 1,
    marginRight: 10,
    marginBottom: 0,
  },
  addButton: {
    backgroundColor: '#4ECDC4',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  classItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  classCapacity: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    padding: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});