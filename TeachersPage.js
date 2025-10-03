import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView, Alert, Image, FlatList, SafeAreaView, Platform, KeyboardAvoidingView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase, validateInput, handleError } from './supabase';
import { getResponsiveWidth, isVerySmallScreen } from './responsive';

export default function TeachersPage({ onBack }) {
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [teacherData, setTeacherData] = useState({
    name: '',
    age: '',
    dob: '',
    subject: '',
    assignedClass: 'Creche',
    email: '',
    password: '',
    gender: 'male',
    image: null
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const classes = [
    'Creche', 'Nursery', 'KG1', 'KG2', 'Class 1', 'Class 2', 'Class 3', 
    'Class 4', 'Class 5', 'Class 6', 'JHS 1', 'JHS 2', 'JHS 3'
  ];

  useEffect(() => {
    fetchTeachers();
    createDefaultTeacher();
  }, []);

  const createDefaultTeacher = async () => {
    try {
      // Check if default teacher already exists
      const { data: existingTeacher } = await supabase
        .from('teachers')
        .select('email')
        .eq('email', 't@mail.com')
        .single();
      
      if (existingTeacher) {
        console.log('Default teacher already exists');
        return;
      }
      
      // Create auth user with secure defaults
      const defaultEmail = `teacher_${Date.now()}@school.edu`;
      const defaultPassword = Math.random().toString(36).slice(-12);
      
      const { error: authError } = await supabase.auth.signUp({
        email: defaultEmail,
        password: defaultPassword,
        options: {
          data: {
            role: 'teacher'
          }
        }
      });
      
      if (authError && !authError.message.includes('already registered')) {
        console.error('Auth error creating default teacher:', authError);
        return;
      }
      
      // Insert teacher data
      const { error } = await supabase
        .from('teachers')
        .insert([
          {
            name: 'Default Teacher',
            age: 30,
            subject: 'General',
            email: defaultEmail,
            gender: 'male',
            assigned_class: 'Creche',
            teacher_id: '2001',
            image: null
          }
        ]);
      
      if (error) {
        console.error('Error creating default teacher:', error);
      } else {
        console.log('Default teacher created successfully');
      }
    } catch (error) {
      console.error('Error in createDefaultTeacher:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*');
      
      if (error) {
        console.error('Error fetching teachers:', error);
      } else {
        setTeachers(data || []);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const handleAddTeacher = () => {
    setModalVisible(true);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setTeacherData({...teacherData, image: result.assets[0].uri});
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSaveTeacher = async () => {
    try {
      // Validate inputs
      if (!validateInput(teacherData.name)) {
        Alert.alert('Error', 'Please enter a valid name');
        return;
      }
      if (!validateInput(teacherData.email, 'email')) {
        Alert.alert('Error', 'Please enter a valid email');
        return;
      }
      if (!validateInput(teacherData.password, 'password')) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return;
      }
      if (!validateInput(teacherData.age, 'number')) {
        Alert.alert('Error', 'Please enter a valid age');
        return;
      }
      
      console.log('Starting teacher creation process...');
      
      // Check if email already exists
      const { data: existingTeacher, error: checkError } = await supabase
        .from('teachers')
        .select('email')
        .eq('email', teacherData.email)
        .single();
      
      if (existingTeacher) {
        Alert.alert('Error', 'A teacher with this email already exists. Please use a different email.');
        return;
      }
      
      const autoId = 2001 + teachers.length;
      console.log('Generated teacher ID:', autoId);
      
      // Create auth user
      console.log('Creating auth user...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: teacherData.email,
        password: teacherData.password,
        options: {
          data: {
            role: 'teacher'
          }
        }
      });
      
      if (authError) {
        console.error('Auth error:', authError);
        Alert.alert('Error', handleError(authError, 'Failed to create teacher account'));
        return;
      }
      
      console.log('Auth user created:', authData);

      // Insert teacher data
      console.log('Inserting teacher data...');
      const { data, error } = await supabase
        .from('teachers')
        .insert([
          {
            name: teacherData.name,
            age: parseInt(teacherData.age),
            subject: teacherData.subject,
            email: teacherData.email,
            gender: teacherData.gender,
            assigned_class: teacherData.assignedClass,
            teacher_id: autoId.toString(),
            image: teacherData.image
          }
        ])
        .select();
      
      if (error) {
        console.error('Database insert error:', error);
        Alert.alert('Error', handleError(error, 'Failed to save teacher data'));
      } else {
        console.log('Teacher inserted successfully:', data);
        Alert.alert('Success', 'Teacher added successfully!');
        setModalVisible(false);
        setTeacherData({
          name: '',
          age: '',
          dob: '',
          subject: '',
          assignedClass: 'Creche',
          email: '',
          password: '',
          gender: 'male',
          image: null
        });
        fetchTeachers();
      }
    } catch (error) {
      console.error('Unexpected error in handleSaveTeacher:', error);
      Alert.alert('Error', handleError(error, 'Failed to add teacher'));
    }
  };

  const handleTeacherPress = (teacher) => {
    setSelectedTeacher(teacher);
    setDetailsModalVisible(true);
  };

  const renderTeacher = ({ item }) => (
    <TouchableOpacity style={styles.teacherCard} onPress={() => handleTeacherPress(item)}>
      <View style={styles.teacherImageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.teacherImage} />
        ) : (
          <View style={styles.defaultAvatar}>
            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>
      <View style={styles.teacherInfo}>
        <Text style={styles.teacherName}>{item.name}</Text>
        <Text style={styles.teacherDetails}>ID: {item.teacher_id}</Text>
        <Text style={styles.teacherDetails}>Subject: {item.subject}</Text>
        <Text style={styles.teacherDetails}>Class: {item.assigned_class}</Text>
      </View>
      <TouchableOpacity 
        style={styles.deleteButtonCard}
        onPress={() => {
          Alert.alert(
            'Delete Teacher',
            `Are you sure you want to delete ${item.name}?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Delete', 
                onPress: async () => {
                  try {
                    const { error } = await supabase
                      .from('teachers')
                      .delete()
                      .eq('id', item.id);
                    
                    if (error) {
                      Alert.alert('Error', error.message);
                    } else {
                      Alert.alert('Success', 'Teacher deleted successfully');
                      fetchTeachers();
                    }
                  } catch (error) {
                    Alert.alert('Error', 'Failed to delete teacher');
                  }
                },
                style: 'destructive'
              }
            ]
          );
        }}
      >
        <Text style={styles.deleteButtonCardText}>🗑️</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButtonContainer} onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Teachers</Text>
      </View>

      <TextInput
        style={styles.searchBar}
        placeholder="Search teachers..."
        value={searchText}
        onChangeText={setSearchText}
      />

      <FlatList
        data={teachers.filter(teacher => 
          teacher.name.toLowerCase().includes(searchText.toLowerCase())
        )}
        renderItem={renderTeacher}
        keyExtractor={(item) => item.id}
        style={styles.teachersList}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.addButton} onPress={handleAddTeacher}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Teacher</Text>
            
            <ScrollView style={styles.formContainer}>
              <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                {teacherData.image ? (
                  <Image 
                    source={{ uri: teacherData.image }} 
                    style={styles.selectedImage}
                  />
                ) : (
                  <Text style={styles.imagePickerText}>📷 Add Photo</Text>
                )}
              </TouchableOpacity>
              
              <TextInput
                style={styles.input}
                placeholder="Teacher Name"
                value={teacherData.name}
                onChangeText={(text) => setTeacherData({...teacherData, name: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Age"
                keyboardType="number-pad"
                value={teacherData.age}
                onChangeText={(text) => setTeacherData({...teacherData, age: text.replace(/[^0-9]/g, '')})}
              />
              
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.datePickerText}>
                  {teacherData.dob || 'Select Date of Birth'}
                </Text>
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (date) {
                      setSelectedDate(date);
                      const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
                      setTeacherData({...teacherData, dob: formattedDate});
                    }
                  }}
                />
              )}
              
              <TextInput
                style={styles.input}
                placeholder="Subject"
                value={teacherData.subject}
                onChangeText={(text) => setTeacherData({...teacherData, subject: text})}
              />
              
              <View style={styles.classContainer}>
                <Text style={styles.classLabel}>Assign Class:</Text>
                <View style={styles.classGrid}>
                  {classes.map((className) => (
                    <TouchableOpacity
                      key={className}
                      style={[styles.classButton, teacherData.assignedClass === className && styles.selectedClass]}
                      onPress={() => setTeacherData({...teacherData, assignedClass: className})}
                    >
                      <Text style={[styles.classText, teacherData.assignedClass === className && styles.selectedClassText]}>
                        {className}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.autoIdContainer}>
                <Text style={styles.autoIdLabel}>Teacher ID: {2001 + teachers.length}</Text>
                <Text style={styles.autoIdNote}>(Auto-generated)</Text>
              </View>
              
              <View style={styles.genderContainer}>
                <Text style={styles.genderLabel}>Gender:</Text>
                <TouchableOpacity 
                  style={[styles.genderButton, teacherData.gender === 'male' && styles.selectedGender]}
                  onPress={() => setTeacherData({...teacherData, gender: 'male'})}
                >
                  <Text style={[styles.genderText, teacherData.gender === 'male' && styles.selectedGenderText]}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.genderButton, teacherData.gender === 'female' && styles.selectedGender]}
                  onPress={() => setTeacherData({...teacherData, gender: 'female'})}
                >
                  <Text style={[styles.genderText, teacherData.gender === 'female' && styles.selectedGenderText]}>Female</Text>
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={teacherData.email}
                onChangeText={(text) => setTeacherData({...teacherData, email: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                value={teacherData.password}
                onChangeText={(text) => setTeacherData({...teacherData, password: text})}
              />
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handleSaveTeacher}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Teacher Details</Text>
            
            {selectedTeacher && (
              <ScrollView style={styles.detailsContainer}>
                <View style={styles.detailImageContainer}>
                  {selectedTeacher.image ? (
                    <Image source={{ uri: selectedTeacher.image }} style={styles.detailImage} />
                  ) : (
                    <View style={styles.detailDefaultAvatar}>
                      <Text style={styles.detailAvatarText}>{selectedTeacher.name.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{selectedTeacher.name}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Teacher ID:</Text>
                  <Text style={styles.detailValue}>{selectedTeacher.teacher_id || 'N/A'}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Subject:</Text>
                  <Text style={styles.detailValue}>{selectedTeacher.subject}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Assigned Class:</Text>
                  <Text style={styles.detailValue}>{selectedTeacher.assigned_class}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Age:</Text>
                  <Text style={styles.detailValue}>{selectedTeacher.age}</Text>
                </View>
                

              </ScrollView>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={() => setDetailsModalVisible(false)}
              >
                <Text style={styles.saveButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  searchBar: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingVertical: isVerySmallScreen() ? 12 : 15,
    paddingHorizontal: 16,
    fontSize: isVerySmallScreen() ? 14 : 16,
    marginBottom: 20,
    marginHorizontal: 4,
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    backgroundColor: '#4a90e2',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
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
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  formContainer: {
    maxHeight: 400,
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
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  saveButton: {
    backgroundColor: '#4a90e2',
  },
  cancelButtonText: {
    color: '#333',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  imagePickerButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  imagePickerText: {
    color: '#666',
    fontSize: 14,
  },
  selectedImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  teachersList: {
    flex: 1,
    marginBottom: 100,
  },
  teacherCard: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  teacherImageContainer: {
    marginRight: 15,
  },
  teacherImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  defaultAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  genderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  genderLabel: {
    fontSize: 16,
    color: '#333',
    marginRight: 15,
  },
  genderButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 10,
  },
  selectedGender: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  genderText: {
    fontSize: 14,
    color: '#666',
  },
  selectedGenderText: {
    color: '#fff',
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  teacherDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  detailsContainer: {
    maxHeight: 400,
  },
  detailImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  detailImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  detailDefaultAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailAvatarText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    width: 100,
  },
  detailValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  autoIdContainer: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  autoIdLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  autoIdNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  classContainer: {
    marginBottom: 20,
  },
  classLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  classGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  classButton: {
    width: '30%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 8,
    alignItems: 'center',
  },
  selectedClass: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  classText: {
    fontSize: 12,
    color: '#666',
  },
  selectedClassText: {
    color: '#fff',
    fontWeight: '600',
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 16,
    marginBottom: 15,
    justifyContent: 'center',
    minHeight: 50,
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'left',
  },
  deleteButtonCard: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    backgroundColor: '#ff4757',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonCardText: {
    fontSize: 16,
  },
});