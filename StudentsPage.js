import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView, Alert, Image, FlatList } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

export default function StudentsPage({ onBack }) {
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentData, setStudentData] = useState({
    name: '',
    age: '',
    dob: '',
    parentsName: '',
    class: '',
    email: '',
    password: '',
    gender: 'male',
    studentId: '',
    image: null
  });

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
            parents_name: studentData.parentsName,
            class: studentData.class,
            email: studentData.email,
            gender: studentData.gender,
            student_id: studentData.studentId,
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
          parentsName: '',
          class: '',
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
    setDetailsModalVisible(true);
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
        <Text style={styles.studentDetails}>Class: {item.class}</Text>
        <Text style={styles.studentDetails}>Age: {item.age}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
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

      <FlatList
        data={students.filter(student => 
          student.name.toLowerCase().includes(searchText.toLowerCase())
        )}
        renderItem={renderStudent}
        keyExtractor={(item) => item.id}
        style={styles.studentsList}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.addButton} onPress={handleAddStudent}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
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
                keyboardType="numeric"
                value={studentData.age}
                onChangeText={(text) => setStudentData({...studentData, age: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Date of Birth (DD/MM/YYYY)"
                value={studentData.dob}
                onChangeText={(text) => setStudentData({...studentData, dob: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Parents Name"
                value={studentData.parentsName}
                onChangeText={(text) => setStudentData({...studentData, parentsName: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Class"
                value={studentData.class}
                onChangeText={(text) => setStudentData({...studentData, class: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Student ID"
                value={studentData.studentId}
                onChangeText={(text) => setStudentData({...studentData, studentId: text})}
              />
              
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
        </View>
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
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]} 
              onPress={() => setDetailsModalVisible(false)}
            >
              <Text style={styles.saveButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    top: 60,
    left: 24,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  searchBar: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 100,
    fontSize: 16,
    marginBottom: 20,
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
});