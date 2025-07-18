import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { supabase } from './supabase';

export default function AnnouncementsPage({ onBack }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [announcementData, setAnnouncementData] = useState({
    title: '',
    message: '',
    recipients: 'all', // 'students', 'teachers', 'all', 'specific'
    specificTeacher: '',
    canReply: false
  });
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    fetchAnnouncements();
  }, []);
  
  useEffect(() => {
    if (announcementData.recipients === 'specific' || announcementData.recipients === 'teachers') {
      fetchTeachers();
    }
  }, [announcementData.recipients]);
  
  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name, teacher_id');
      
      if (error) {
        console.error('Error fetching teachers:', error);
      } else {
        setTeachers(data || []);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching announcements:', error);
      } else {
        setAnnouncements(data || []);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnnouncement = () => {
    setAnnouncementData({
      title: '',
      message: '',
      recipients: 'all',
      specificTeacher: '',
      canReply: false
    });
    setModalVisible(true);
  };

  const saveAnnouncement = async () => {
    if (!announcementData.title || !announcementData.message) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (announcementData.recipients === 'specific' && !announcementData.specificTeacher) {
      Alert.alert('Error', 'Please select a teacher');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('announcements')
        .insert([
          {
            title: announcementData.recipients === 'specific' ? 
              `${announcementData.title} (To: ${teachers.find(t => t.id === announcementData.specificTeacher)?.name || 'Teacher'})` : 
              announcementData.title,
            message: announcementData.message,
            recipients: announcementData.recipients === 'specific' ? 'teachers' : announcementData.recipients,
            sender: 'admin',
            read_by: []
          }
        ]);
      
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Announcement sent successfully');
        setModalVisible(false);
        fetchAnnouncements();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send announcement');
    }
  };

  const deleteAnnouncement = async (id) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);
      
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Announcement deleted successfully');
        fetchAnnouncements();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete announcement');
    }
  };

  const getRecipientsText = (recipients) => {
    switch (recipients) {
      case 'students':
        return 'Students';
      case 'teachers':
        return 'Teachers';
      case 'all':
        return 'All (Students & Teachers)';
      default:
        return '';
    }
  };

  const renderAnnouncementItem = ({ item }) => (
    <View style={styles.announcementCard}>
      <View style={styles.announcementHeader}>
        <Text style={styles.announcementTitle}>{item.title}</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            Alert.alert(
              'Delete Announcement',
              'Are you sure you want to delete this announcement?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete', 
                  onPress: () => deleteAnnouncement(item.id),
                  style: 'destructive'
                }
              ]
            );
          }}
        >
          <Text style={styles.deleteButtonText}>×</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.announcementMessage}>{item.message}</Text>
      
      <View style={styles.announcementFooter}>
        <Text style={styles.recipientsText}>To: {getRecipientsText(item.recipients)}</Text>
        <Text style={styles.dateText}>
          {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Announcements</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={handleAddAnnouncement}
      >
        <Text style={styles.addButtonText}>+ New Announcement</Text>
      </TouchableOpacity>
      
      <FlatList
        data={announcements}
        renderItem={renderAnnouncementItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.announcementsList}
        refreshing={loading}
        onRefresh={fetchAnnouncements}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No announcements yet</Text>
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
            <Text style={styles.modalTitle}>New Announcement</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Title"
              value={announcementData.title}
              onChangeText={(text) => setAnnouncementData({...announcementData, title: text})}
            />
            
            <TextInput
              style={[styles.input, styles.messageInput]}
              placeholder="Message"
              multiline
              value={announcementData.message}
              onChangeText={(text) => setAnnouncementData({...announcementData, message: text})}
            />
            
            <Text style={styles.inputLabel}>Send to:</Text>
            <View style={styles.recipientButtons}>
              <TouchableOpacity
                style={[
                  styles.recipientButton,
                  announcementData.recipients === 'all' && styles.selectedRecipientButton
                ]}
                onPress={() => setAnnouncementData({...announcementData, recipients: 'all'})}
              >
                <Text style={[
                  styles.recipientButtonText,
                  announcementData.recipients === 'all' && styles.selectedRecipientText
                ]}>
                  All
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.recipientButton,
                  announcementData.recipients === 'students' && styles.selectedRecipientButton
                ]}
                onPress={() => setAnnouncementData({...announcementData, recipients: 'students'})}
              >
                <Text style={[
                  styles.recipientButtonText,
                  announcementData.recipients === 'students' && styles.selectedRecipientText
                ]}>
                  Students
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.recipientButton,
                  announcementData.recipients === 'teachers' && styles.selectedRecipientButton
                ]}
                onPress={() => setAnnouncementData({...announcementData, recipients: 'teachers'})}
              >
                <Text style={[
                  styles.recipientButtonText,
                  announcementData.recipients === 'teachers' && styles.selectedRecipientText
                ]}>
                  Teachers
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.recipientButton,
                  announcementData.recipients === 'specific' && styles.selectedRecipientButton
                ]}
                onPress={() => setAnnouncementData({...announcementData, recipients: 'specific'})}
              >
                <Text style={[
                  styles.recipientButtonText,
                  announcementData.recipients === 'specific' && styles.selectedRecipientText
                ]}>
                  Specific Teacher
                </Text>
              </TouchableOpacity>
            </View>
            
            {announcementData.recipients === 'specific' && (
              <View style={styles.teacherSelector}>
                <Text style={styles.inputLabel}>Select Teacher:</Text>
                <ScrollView style={styles.teacherList} nestedScrollEnabled={true}>
                  {teachers.map(teacher => (
                    <TouchableOpacity
                      key={teacher.id}
                      style={[
                        styles.teacherItem,
                        announcementData.specificTeacher === teacher.id && styles.selectedTeacherItem
                      ]}
                      onPress={() => setAnnouncementData({...announcementData, specificTeacher: teacher.id})}
                    >
                      <Text style={styles.teacherName}>{teacher.name} (ID: {teacher.teacher_id})</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            {(announcementData.recipients === 'teachers' || announcementData.recipients === 'specific') && (
              <View style={styles.replyOption}>
                <Text style={styles.inputLabel}>Allow Reply:</Text>
                <View style={styles.replyButtons}>
                  <TouchableOpacity
                    style={[
                      styles.replyButton,
                      announcementData.canReply && styles.selectedReplyButton
                    ]}
                    onPress={() => setAnnouncementData({...announcementData, canReply: true})}
                  >
                    <Text style={[
                      styles.replyButtonText,
                      announcementData.canReply && styles.selectedReplyText
                    ]}>Yes</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.replyButton,
                      !announcementData.canReply && styles.selectedReplyButton
                    ]}
                    onPress={() => setAnnouncementData({...announcementData, canReply: false})}
                  >
                    <Text style={[
                      styles.replyButtonText,
                      !announcementData.canReply && styles.selectedReplyText
                    ]}>No</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.sendButton]} 
                onPress={saveAnnouncement}
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
  announcementsList: {
    flex: 1,
  },
  announcementCard: {
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
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  announcementTitle: {
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
  announcementMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  recipientsText: {
    fontSize: 14,
    color: '#666',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
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
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  recipientButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  recipientButton: {
    paddingVertical: 10,
    paddingHorizontal: 1,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  selectedRecipientButton: {
    backgroundColor: '#4a90e2',
    borderColor: '#3a80d2',
  },
  recipientButtonText: {
    color: '#333',
    fontWeight: '500',
    textAlign:'center'
  },
  selectedRecipientText: {
    color: '#fff',
  },
  teacherSelector: {
    marginBottom: 15,
  },
  teacherList: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginTop: 10,
  },
  teacherItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedTeacherItem: {
    backgroundColor: '#e6f2ff',
  },
  teacherName: {
    fontSize: 16,
    color: '#333',
  },
  replyOption: {
    marginBottom: 15,
  },
  replyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  replyButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 5,
    alignItems: 'center',
  },
  selectedReplyButton: {
    backgroundColor: '#4a90e2',
    borderColor: '#3a80d2',
  },
  replyButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  selectedReplyText: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 7,
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