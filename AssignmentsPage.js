import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, Modal } from 'react-native';
import { supabase } from './supabase';

export default function AssignmentsPage({ onBack, userRole, teacherData, studentData }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    title: '',
    description: '',
    due_date: '',
    subject: '',
    class_id: '',
  });

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      let query = supabase.from('assignments').select('*');
      
      if (userRole === 'teacher') {
        // Teachers see assignments they created
        query = query.eq('teacher_id', teacherData.id);
      } else if (userRole === 'student') {
        // Students see assignments for their class
        query = query.eq('class_id', studentData.class);
      }
      
      const { data, error } = await query.order('due_date', { ascending: true });
      
      if (error) {
        console.error('Error fetching assignments:', error);
        return;
      }

      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAssignment = () => {
    if (userRole !== 'teacher') return;
    
    setAssignmentData({
      title: '',
      description: '',
      due_date: '',
      subject: teacherData.subject || '',
      class_id: teacherData.assigned_class || '',
    });
    setModalVisible(true);
  };

  const saveAssignment = async () => {
    if (!assignmentData.title || !assignmentData.due_date || !assignmentData.class_id) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('assignments')
        .insert([{
          title: assignmentData.title,
          description: assignmentData.description,
          due_date: assignmentData.due_date,
          subject: assignmentData.subject,
          class_id: assignmentData.class_id,
          teacher_id: teacherData.id,
          teacher_name: teacherData.name,
          created_at: new Date(),
        }]);
      
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      setModalVisible(false);
      fetchAssignments();
      Alert.alert('Success', 'Assignment created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create assignment');
    }
  };

  const deleteAssignment = async (id) => {
    if (userRole !== 'teacher') return;
    
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id);
      
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      fetchAssignments();
      Alert.alert('Success', 'Assignment deleted successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete assignment');
    }
  };

  const isOverdue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    return due < today;
  };

  const renderAssignmentItem = ({ item }) => (
    <View style={styles.assignmentCard}>
      <View style={styles.assignmentHeader}>
        <Text style={styles.assignmentTitle}>{item.title}</Text>
        {userRole === 'teacher' && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              Alert.alert(
                'Delete Assignment',
                'Are you sure you want to delete this assignment?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Delete', 
                    onPress: () => deleteAssignment(item.id),
                    style: 'destructive'
                  }
                ]
              );
            }}
          >
            <Text style={styles.deleteButtonText}>×</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={styles.assignmentDescription}>{item.description}</Text>
      
      <View style={styles.assignmentFooter}>
        <View style={styles.assignmentDetails}>
          <Text style={styles.subjectText}>Subject: {item.subject}</Text>
          <Text style={styles.classText}>Class: {item.class_id}</Text>
          {userRole === 'student' && (
            <Text style={styles.teacherText}>Teacher: {item.teacher_name}</Text>
          )}
        </View>
        
        <View style={[
          styles.dueDateContainer,
          isOverdue(item.due_date) && styles.overdueDateContainer
        ]}>
          <Text style={styles.dueDateLabel}>Due:</Text>
          <Text style={[
            styles.dueDateText,
            isOverdue(item.due_date) && styles.overdueText
          ]}>
            {new Date(item.due_date).toLocaleDateString()}
          </Text>
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
        <Text style={styles.title}>
          {userRole === 'teacher' ? 'Manage Assignments' : 'My Assignments'}
        </Text>
      </View>
      
      {userRole === 'teacher' && (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddAssignment}
        >
          <Text style={styles.addButtonText}>+ New Assignment</Text>
        </TouchableOpacity>
      )}
      
      <FlatList
        data={assignments}
        renderItem={renderAssignmentItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        refreshing={loading}
        onRefresh={fetchAssignments}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No assignments found</Text>
        }
      />
      
      {userRole === 'teacher' && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>New Assignment</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Title *"
                value={assignmentData.title}
                onChangeText={(text) => setAssignmentData({...assignmentData, title: text})}
              />
              
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                multiline
                value={assignmentData.description}
                onChangeText={(text) => setAssignmentData({...assignmentData, description: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Due Date (YYYY-MM-DD) *"
                value={assignmentData.due_date}
                onChangeText={(text) => setAssignmentData({...assignmentData, due_date: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Subject *"
                value={assignmentData.subject}
                onChangeText={(text) => setAssignmentData({...assignmentData, subject: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Class *"
                value={assignmentData.class_id}
                onChangeText={(text) => setAssignmentData({...assignmentData, class_id: text})}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]} 
                  onPress={saveAssignment}
                >
                  <Text style={styles.saveButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  addButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  assignmentCard: {
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
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
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
  assignmentDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  assignmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  assignmentDetails: {
    flex: 1,
  },
  subjectText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  classText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  teacherText: {
    fontSize: 14,
    color: '#666',
  },
  dueDateContainer: {
    backgroundColor: '#e8f4ff',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  overdueDateContainer: {
    backgroundColor: '#ffebeb',
  },
  dueDateLabel: {
    fontSize: 12,
    color: '#666',
  },
  dueDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a90e2',
  },
  overdueText: {
    color: '#ff3b30',
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
  textArea: {
    height: 100,
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
});