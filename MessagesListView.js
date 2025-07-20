import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, Modal } from 'react-native';
import { supabase } from './supabase';
import ConversationView from './ConversationView';

export default function MessagesListView({ onBack, userRole, userData }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [currentConversation, setCurrentConversation] = useState(null);

  useEffect(() => {
    fetchConversations();
    fetchPotentialRecipients();
  }, []);

  const fetchConversations = async () => {
    try {
      // Get conversations where the user is either sender or recipient
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant1_id.eq.${userData.id},participant2_id.eq.${userData.id}`)
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching conversations:', error);
        return;
      }

      // Fetch the last message for each conversation
      const conversationsWithLastMessage = await Promise.all(data.map(async (conversation) => {
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
          return conversation;
        }

        return {
          ...conversation,
          lastMessage: messages[0] || null
        };
      }));

      setConversations(conversationsWithLastMessage || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPotentialRecipients = async () => {
    try {
      let data = [];
      
      if (userRole === 'student') {
        // Students can message teachers
        const { data: teachers, error } = await supabase
          .from('teachers')
          .select('id, name, teacher_id');
        
        if (error) {
          console.error('Error fetching teachers:', error);
          return;
        }
        
        data = teachers.map(teacher => ({
          ...teacher,
          role: 'teacher'
        }));
      } else if (userRole === 'teacher') {
        // Teachers can message students
        const { data: students, error } = await supabase
          .from('students')
          .select('id, name, student_id');
        
        if (error) {
          console.error('Error fetching students:', error);
          return;
        }
        
        data = students.map(student => ({
          ...student,
          role: 'student'
        }));
      }
      
      setRecipients(data || []);
    } catch (error) {
      console.error('Error fetching recipients:', error);
    }
  };

  const startNewConversation = () => {
    setSelectedRecipient(null);
    setMessageText('');
    setModalVisible(true);
  };

  const handleSelectRecipient = (recipient) => {
    setSelectedRecipient(recipient);
  };

  const sendNewMessage = async () => {
    if (!selectedRecipient || !messageText.trim()) {
      Alert.alert('Error', 'Please select a recipient and enter a message');
      return;
    }

    try {
      // Check if conversation already exists
      const { data: existingConversations, error: checkError } = await supabase
        .from('conversations')
        .select('*')
        .or(
          `and(participant1_id.eq.${userData.id},participant2_id.eq.${selectedRecipient.id}),` +
          `and(participant1_id.eq.${selectedRecipient.id},participant2_id.eq.${userData.id})`
        );
      
      if (checkError) {
        Alert.alert('Error', checkError.message);
        return;
      }

      let conversationId;
      
      if (existingConversations && existingConversations.length > 0) {
        // Use existing conversation
        conversationId = existingConversations[0].id;
      } else {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert([{
            participant1_id: userData.id,
            participant1_name: userData.name,
            participant1_role: userRole,
            participant2_id: selectedRecipient.id,
            participant2_name: selectedRecipient.name,
            participant2_role: selectedRecipient.role,
            created_at: new Date(),
            updated_at: new Date()
          }])
          .select();
        
        if (createError || !newConversation) {
          Alert.alert('Error', createError?.message || 'Failed to create conversation');
          return;
        }
        
        conversationId = newConversation[0].id;
      }

      // Send the message
      const { error: messageError } = await supabase
        .from('messages')
        .insert([{
          conversation_id: conversationId,
          sender_id: userData.id,
          sender_name: userData.name,
          sender_role: userRole,
          message: messageText,
          created_at: new Date()
        }]);
      
      if (messageError) {
        Alert.alert('Error', messageError.message);
        return;
      }

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date() })
        .eq('id', conversationId);

      setModalVisible(false);
      fetchConversations();
      Alert.alert('Success', 'Message sent successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const openConversation = (conversation) => {
    const isParticipant1 = conversation.participant1_id === userData.id;
    const recipientId = isParticipant1 ? conversation.participant2_id : conversation.participant1_id;
    const recipientName = isParticipant1 ? conversation.participant2_name : conversation.participant1_name;
    
    setCurrentConversation({
      id: conversation.id,
      recipientId,
      recipientName
    });
  };

  const handleBackFromConversation = () => {
    setCurrentConversation(null);
    fetchConversations(); // Refresh the list
  };

  if (currentConversation) {
    return (
      <ConversationView
        onBack={handleBackFromConversation}
        userRole={userRole}
        userData={userData}
        conversationId={currentConversation.id}
        recipientId={currentConversation.recipientId}
        recipientName={currentConversation.recipientName}
      />
    );
  }

  const renderConversationItem = ({ item }) => {
    const isParticipant1 = item.participant1_id === userData.id;
    const recipientName = isParticipant1 ? item.participant2_name : item.participant1_name;
    const recipientRole = isParticipant1 ? item.participant2_role : item.participant1_role;
    
    return (
      <TouchableOpacity 
        style={styles.conversationItem}
        onPress={() => openConversation(item)}
      >
        <View style={styles.conversationHeader}>
          <Text style={styles.recipientName}>{recipientName}</Text>
          <Text style={styles.recipientRole}>{recipientRole}</Text>
        </View>
        
        {item.lastMessage && (
          <View style={styles.lastMessageContainer}>
            <Text style={styles.lastMessageText} numberOfLines={1}>
              {item.lastMessage.sender_id === userData.id ? 'You: ' : ''}
              {item.lastMessage.message}
            </Text>
            <Text style={styles.lastMessageTime}>
              {new Date(item.lastMessage.created_at).toLocaleDateString()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderRecipientItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.recipientItem,
        selectedRecipient?.id === item.id && styles.selectedRecipientItem
      ]}
      onPress={() => handleSelectRecipient(item)}
    >
      <Text style={styles.recipientItemName}>{item.name}</Text>
      <Text style={styles.recipientItemId}>
        {item.role === 'teacher' ? 'Teacher ID: ' : 'Student ID: '}
        {item.role === 'teacher' ? item.teacher_id : item.student_id}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity 
          style={styles.newMessageButton}
          onPress={startNewConversation}
        >
          <Text style={styles.newMessageButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.conversationsList}
        refreshing={loading}
        onRefresh={fetchConversations}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No conversations yet</Text>
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
            <Text style={styles.modalTitle}>New Message</Text>
            
            <Text style={styles.modalLabel}>Select Recipient:</Text>
            <FlatList
              data={recipients}
              renderItem={renderRecipientItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.recipientsList}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No recipients available</Text>
              }
            />
            
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
                onPress={sendNewMessage}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    flex: 1,
  },
  newMessageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  newMessageButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 24,
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recipientName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  recipientRole: {
    fontSize: 13,
    color: '#4a90e2',
    textTransform: 'capitalize',
    backgroundColor: '#e6f2ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  lastMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessageText: {
    fontSize: 15,
    color: '#666',
    flex: 1,
  },
  lastMessageTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 10,
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
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    color: '#333',
  },
  modalLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  recipientsList: {
    maxHeight: 200,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  recipientItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedRecipientItem: {
    backgroundColor: '#e6f2ff',
  },
  recipientItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  recipientItemId: {
    fontSize: 14,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
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
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  sendButton: {
    backgroundColor: '#4a90e2',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});