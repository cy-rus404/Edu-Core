import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView, Alert, Image, FlatList, SafeAreaView, Platform, KeyboardAvoidingView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from './supabase';
import { getResponsiveWidth, isVerySmallScreen } from './responsive';

export default function StudentsPage({ onBack }) {
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentData, setStudentData] = useState({
    name: '',
    age: '',
    dob: '',
    motherName: '',
    motherContact: '',
    fatherName: '',
    fatherContact: '',
    class: 'Creche',
    email: '',
    password: '',
    gender: 'male',
    studentId: '',
    image: null
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const classes = [
    'Creche', 'Nursery', 'KG1', 'KG2', 'Class 1', 'Class 2', 'Class 3', 
    'Class 4', 'Class 5', 'Class 6', 'JHS 1', 'JHS 2', 'JHS 3'
  ];

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*');
      
      if (error) {
        console.error('Error fetching students:', error);
      } else {
        setStudents(data || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleAddStudent = () => {
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

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('Selected image URI:', result.assets[0].uri);
        setStudentData({...studentData, image: result.assets[0].uri});
      } else {
        console.log('Image selection was canceled or failed');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSaveStudent = async () => {
    try {
      // Generate auto ID starting from 1001
      const autoId = 1001 + students.length;
      
      // Create auth user
      const { error: authError } = await supabase.auth.signUp({
        email: studentData.email,
        password: studentData.password,
        options: {
          data: {
            role: 'student'
          }
        }
      });
      
      if (authError) {
        Alert.alert('Error', authError.message);
        return;
      }

      // Save student to database
      const { data, error } = await supabase
        .from('students')
        .insert([
          {
            name: studentData.name,
            age: parseInt(studentData.age),
            dob: studentData.dob,
            mother_name: studentData.motherName,
            mother_contact: studentData.motherContact,
            father_name: studentData.fatherName,
            father_contact: studentData.fatherContact,
            class: studentData.class,
            email: studentData.email,
            gender: studentData.gender,
            student_id: autoId.toString(),
            image: studentData.image
          }
        ])
        .select();
      
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Student added successfully!');
        setModalVisible(false);
        setStudentData({
          name: '',
          age: '',
          dob: '',
          motherName: '',
          motherContact: '',
          fatherName: '',
          fatherContact: '',
          class: 'Creche',
          email: '',
          password: '',
          gender: 'male',
          studentId: '',
          image: null
        });
        fetchStudents(); // Refresh the list
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add student');
    }
  };

  const handleStudentPress = (student) => {
    setSelectedStudent(student);
    setShowStudentDetails(true);
  };

  const handleDeleteStudent = async () => {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', selectedStudent.id);
      
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Student deleted successfully');
        setDetailsModalVisible(false);
        fetchStudents(); // Refresh the list
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete student');
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${selectedStudent.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: handleDeleteStudent, style: 'destructive' }
      ]
    );
  };

  const renderStudent = ({ item }) => (
    <TouchableOpacity style={styles.studentCard} onPress={() => handleStudentPress(item)}>
      <View style={styles.studentImageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.studentImage} />
        ) : (
          <View style={styles.defaultAvatar}>
            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={styles.studentDetails}>ID: {item.student_id}</Text>
        <Text style={styles.studentDetails}>Class: {item.class}</Text>
        <Text style={styles.tapHint}>Tap for full details</Text>
      </View>
      <TouchableOpacity 
        style={styles.deleteButtonCard}
        onPress={() => {
          Alert.alert(
            'Delete Student',
            `Are you sure you want to delete ${item.name}?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Delete', 
                onPress: async () => {
                  try {
                    const { error } = await supabase
                      .from('students')
                      .delete()
                      .eq('id', item.id);
                    
                    if (error) {
                      Alert.alert('Error', error.message);
                    } else {
                      Alert.alert('Success', 'Student deleted successfully');
                      fetchStudents();
                    }
                  } catch (error) {
                    Alert.alert('Error', 'Failed to delete student');
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

  const renderStudentDetails = () => (
    <ScrollView style={styles.studentDetailsView}>
      <View style={styles.detailsHeader}>
        <TouchableOpacity onPress={() => setShowStudentDetails(false)}>
          <Text style={styles.backToStudents}>← Back to Students</Text>
        </TouchableOpacity>
        <Text style={styles.studentDetailsTitle}>Student Details</Text>
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>👤 Student Information</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Name:</Text>
          <Text style={styles.detailValue}>{selectedStudent.name}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Student ID:</Text>
          <Text style={styles.detailValue}>{selectedStudent.student_id}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Age:</Text>
          <Text style={styles.detailValue}>{selectedStudent.age}</Text>
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
          <Text style={styles.detailValue}>{selectedStudent.class}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Email:</Text>
          <Text style={styles.detailValue}>{selectedStudent.email}</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButtonContainer} onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Students</Text>
      </View>

      <TextInput
        style={styles.searchBar}
        placeholder="Search students..."
        value={searchText}
        onChangeText={setSearchText}
      />

      {showStudentDetails && selectedStudent ? (
        renderStudentDetails()
      ) : (
        <FlatList
          data={students.filter(student => 
            student.name.toLowerCase().includes(searchText.toLowerCase())
          )}
          renderItem={renderStudent}
          keyExtractor={(item) => item.id}
          style={styles.studentsList}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity style={styles.addButton} onPress={handleAddStudent}>
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
            <Text style={styles.modalTitle}>Add Student</Text>
            
            <ScrollView style={styles.formContainer}>
              <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                {studentData.image ? (
                  <Image 
                    source={{ uri: studentData.image }} 
                    style={styles.selectedImage}
                    onError={(error) => console.log('Image load error:', error)}
                  />
                ) : (
                  <Text style={styles.imagePickerText}>📷 Add Photo</Text>
                )}
              </TouchableOpacity>
              
              <TextInput
                style={styles.input}
                placeholder="Student Name"
                value={studentData.name}
                onChangeText={(text) => setStudentData({...studentData, name: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Age"
                keyboardType="number-pad"
                value={studentData.age}
                onChangeText={(text) => setStudentData({...studentData, age: text.replace(/[^0-9]/g, '')})}
              />
              
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.datePickerText}>
                  {studentData.dob || 'Select Date of Birth'}
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
                      setStudentData({...studentData, dob: formattedDate});
                    }
                  }}
                />
              )}
              
              <TextInput
                style={styles.input}
                placeholder="Mother's Name"
                value={studentData.motherName}
                onChangeText={(text) => setStudentData({...studentData, motherName: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Mother's Contact"
                keyboardType="phone-pad"
                value={studentData.motherContact}
                onChangeText={(text) => setStudentData({...studentData, motherContact: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Father's Name"
                value={studentData.fatherName}
                onChangeText={(text) => setStudentData({...studentData, fatherName: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Father's Contact"
                keyboardType="phone-pad"
                value={studentData.fatherContact}
                onChangeText={(text) => setStudentData({...studentData, fatherContact: text})}
              />
              
              <View style={styles.classContainer}>
                <Text style={styles.classLabel}>Select Class:</Text>
                <View style={styles.classGrid}>
                  {classes.map((className) => (
                    <TouchableOpacity
                      key={className}
                      style={[styles.classButton, studentData.class === className && styles.selectedClass]}
                      onPress={() => setStudentData({...studentData, class: className})}
                    >
                      <Text style={[styles.classText, studentData.class === className && styles.selectedClassText]}>
                        {className}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.autoIdContainer}>
                <Text style={styles.autoIdLabel}>Student ID: {1001 + students.length}</Text>
                <Text style={styles.autoIdNote}>(Auto-generated)</Text>
              </View>
              
              <View style={styles.genderContainer}>
                <Text style={styles.genderLabel}>Gender:</Text>
                <TouchableOpacity 
                  style={[styles.genderButton, studentData.gender === 'male' && styles.selectedGender]}
                  onPress={() => setStudentData({...studentData, gender: 'male'})}
                >
                  <Text style={[styles.genderText, studentData.gender === 'male' && styles.selectedGenderText]}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.genderButton, studentData.gender === 'female' && styles.selectedGender]}
                  onPress={() => setStudentData({...studentData, gender: 'female'})}
                >
                  <Text style={[styles.genderText, studentData.gender === 'female' && styles.selectedGenderText]}>Female</Text>
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={studentData.email}
                onChangeText={(text) => setStudentData({...studentData, email: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                value={studentData.password}
                onChangeText={(text) => setStudentData({...studentData, password: text})}
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
                onPress={handleSaveStudent}
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
            <Text style={styles.modalTitle}>Student Details</Text>
            
            {selectedStudent && (
              <ScrollView style={styles.detailsContainer}>
                <View style={styles.detailImageContainer}>
                  {selectedStudent.image ? (
                    <Image source={{ uri: selectedStudent.image }} style={styles.detailImage} />
                  ) : (
                    <View style={styles.detailDefaultAvatar}>
                      <Text style={styles.detailAvatarText}>{selectedStudent.name.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{selectedStudent.name}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Student ID:</Text>
                  <Text style={styles.detailValue}>{selectedStudent.student_id || selectedStudent.studentId || 'N/A'}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Class:</Text>
                  <Text style={styles.detailValue}>{selectedStudent.class}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Age:</Text>
                  <Text style={styles.detailValue}>{selectedStudent.age}</Text>
                </View>
              </ScrollView>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteButton]} 
                onPress={confirmDelete}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
              
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
  deleteButton: {
    backgroundColor: '#ff4757',
  },
  deleteButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
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
  studentsList: {
    flex: 1,
    marginBottom: 100,
  },
  studentCard: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  studentImageContainer: {
    marginRight: 15,
  },
  studentImage: {
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
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  studentDetails: {
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
  tapHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
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