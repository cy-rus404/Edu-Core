import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, Modal } from 'react-native';
import { supabase } from './supabase';

export default function MessagePage({ onBack, studentData }) {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name, teacher_id, subject');
      
      if (error) {
        console.error('Error fetching teachers:', error);
      } else {
        setTeachers(data || []);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedTeacher) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('announcements')
        .insert([
          {
            title: `Message from ${studentData.name} to ${selectedTeacher.name}`,
            message: messageText,
            recipients: 'teachers', // Use 'teachers' instead of 'specific'
            sender: 'student',
            read_by: []
          }
        ]);
      
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setModalVisible(false);
        setMessageText('');
        Alert.alert('Success', 'Message sent successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const renderTeacherItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.teacherCard}
      onPress={() => {
        setSelectedTeacher(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.teacherInfo}>
        <Text style={styles.teacherName}>{item.name}</Text>
        <Text style={styles.teacherSubject}>Subject: {item.subject}</Text>
        <Text style={styles.teacherId}>ID: {item.teacher_id}</Text>
      </View>
      <View style={styles.messageButton}>
        <Text style={styles.messageButtonText}>Message</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Message Teachers</Text>
      </View>
      
      <FlatList
        data={teachers}
        renderItem={renderTeacherItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.teachersList}
        refreshing={loading}
        onRefresh={fetchTeachers}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No teachers available</Text>
        }
      />
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Message to {selectedTeacher?.name}
            </Text>
            
            <TextInput
              style={[styles.input, styles.messageInput]}
              placeholder="Type your message here..."
              multiline
              value={messageText}
              onChangeText={setMessageText}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.sendButton]} 
                onPress={sendMessage}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
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
  teachersList: {
    flex: 1,
  },
  teacherCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  teacherSubject: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  teacherId: {
    fontSize: 14,
    color: '#999',
  },
  messageButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  messageButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 40,
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
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 15,
  },
  messageInput: {
    height: 120,
    textAlignVertical: 'top',
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
  sendButton: {
    backgroundColor: '#4a90e2',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});