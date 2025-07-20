import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal, TextInput } from 'react-native';
import { supabase } from './supabase';

export default function AnnouncementsView({ onBack, userRole, userId, onUpdateUnread }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      // Simple query that works with the current database structure
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .or(`recipients.eq.${userRole},recipients.eq.all`)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching announcements:', error);
        return;
      }

      // Count unread announcements
      const unread = data.filter(announcement => {
        const readBy = Array.isArray(announcement.read_by) ? announcement.read_by : [];
        return !readBy.includes(userId);
      }).length;
      
      setUnreadCount(unread);
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedAnnouncement) {
      Alert.alert('Error', 'Please enter a reply');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('announcements')
        .insert([
          {
            title: `Re: ${selectedAnnouncement.title}`,
            message: replyText,
            recipients: 'all', // Use 'all' instead of 'specific' for now
            sender: userRole === 'teachers' ? 'teacher' : 'student',
            read_by: []
          }
        ]);
      
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setReplyModalVisible(false);
        setReplyText('');
        Alert.alert('Success', 'Reply sent successfully');
        fetchAnnouncements();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send reply');
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
        Alert.alert('Success', 'Message deleted successfully');
        fetchAnnouncements();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete message');
    }
  };

  const markAsRead = async (announcement) => {
    // If already read, do nothing
    if (announcement.read_by && announcement.read_by.includes(userId)) {
      return;
    }
    
    // Ensure read_by is an array
    const currentReadBy = Array.isArray(announcement.read_by) ? announcement.read_by : [];

    try {
      // Add user to read_by array
      const updatedReadBy = [...currentReadBy, userId];
      
      const { error } = await supabase
        .from('announcements')
        .update({ read_by: updatedReadBy })
        .eq('id', announcement.id);
      
      if (error) {
        console.error('Error marking announcement as read:', error);
        return;
      }

      // Update local state
      setAnnouncements(prev => 
        prev.map(item => 
          item.id === announcement.id 
            ? { ...item, read_by: updatedReadBy } 
            : item
        )
      );

      // Update unread count
      const newUnreadCount = Math.max(0, unreadCount - 1);
      setUnreadCount(newUnreadCount);
      
      // Show notification that message was read
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      
      // Update parent component if callback provided
      if (onUpdateUnread) {
        onUpdateUnread(newUnreadCount);
      }
    } catch (error) {
      console.error('Error marking announcement as read:', error);
    }
  };

  const renderAnnouncementItem = ({ item }) => {
    const isRead = item.read_by?.includes(userId) || false;
    // Allow teachers to reply to admin messages
    const canReply = userRole === 'teachers' && item.sender === 'admin';
    
    return (
      <TouchableOpacity 
        style={[styles.announcementCard, !isRead && styles.unreadCard]}
        onPress={() => markAsRead(item)}
      >
        <View style={styles.announcementHeader}>
          <Text style={styles.announcementTitle}>{item.title}</Text>
          <View style={styles.headerButtons}>
            {item.title.startsWith('Re:') && <Text style={styles.replyTag}>Reply</Text>}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => {
                Alert.alert(
                  'Delete Message',
                  'Are you sure you want to delete this message?',
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
        </View>
        
        <Text style={styles.announcementMessage}>{item.message}</Text>
        
        <View style={styles.announcementFooter}>
          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}
          </Text>
          
          {canReply && (
            <TouchableOpacity 
              style={styles.replyButton}
              onPress={() => {
                setSelectedAnnouncement(item);
                setReplyModalVisible(true);
              }}
            >
              <Text style={styles.replyButtonText}>Reply</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {showNotification && (
        <View style={styles.messageNotification}>
          <Text style={styles.messageNotificationText}>Message marked as read</Text>
        </View>
      )}
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Announcements</Text>
      </View>
      
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
        visible={replyModalVisible}
        onRequestClose={() => setReplyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reply to Announcement</Text>
            
            <TextInput
              style={[styles.input, styles.messageInput]}
              placeholder="Type your reply here..."
              multiline
              value={replyText}
              onChangeText={setReplyText}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setReplyModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.sendButton]} 
                onPress={sendReply}
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
    paddingBottom: 20,
  },
  messageNotification: {
    backgroundColor: '#4cd964',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  messageNotificationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff3b30',
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  replyButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  replyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  replyTag: {
    backgroundColor: '#5856d6',
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginLeft: 8,
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