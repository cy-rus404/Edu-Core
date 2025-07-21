import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from './supabase';

export default function ConversationView({ onBack, userRole, userData, conversationId, recipientId, recipientName }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchMessages();
    
    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, payload => {
        setMessages(current => [...current, payload.new]);
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);
      
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }
      
      // Update local state
      setMessages(messages.filter(msg => msg.id !== messageId));
    } catch (error) {
      Alert.alert('Error', 'Failed to delete message');
    }
  };

  const sendMessage = async () => {
    if (!replyText.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: conversationId,
          sender_id: userData.id,
          sender_name: userData.name,
          sender_role: userRole,
          message: replyText,
          created_at: new Date()
        }]);
      
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      setReplyText('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const renderMessageItem = ({ item }) => {
    const isCurrentUser = item.sender_id === userData.id;
    
    return (
      <TouchableOpacity 
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.sentMessage : styles.receivedMessage
        ]}
        onLongPress={() => {
          Alert.alert(
            'Delete Message',
            'Do you want to delete this message?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', onPress: () => deleteMessage(item.id), style: 'destructive' }
            ]
          );
        }}
      >
        <View style={[
          styles.messageBubble,
          isCurrentUser ? styles.sentBubble : styles.receivedBubble
        ]}>
          {!isCurrentUser && (
            <Text style={styles.senderName}>{item.sender_name}</Text>
          )}
          <Text style={styles.messageText}>{item.message}</Text>
          <Text style={styles.messageTime}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={10}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Conversation with {recipientName}</Text>
      </View>
      
      <View style={{flex: 1}}>
        <Text style={styles.deleteHint}>Long press any message to delete</Text>
        <FlatList
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.messagesList}
          inverted={false}
          refreshing={loading}
          onRefresh={fetchMessages}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
          }
        />
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={replyText}
          onChangeText={setReplyText}
          multiline
        />
        <TouchableOpacity 
          style={styles.sendButton}
          onPress={sendMessage}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    fontSize: 18,
    color: '#4a90e2',
    marginRight: 20,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messageContainer: {
    marginBottom: 15,
    flexDirection: 'row',
    width: '100%',
  },
  sentMessage: {
    justifyContent: 'flex-end',
  },
  receivedMessage: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  sentBubble: {
    backgroundColor: '#e3f2fd',
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: '#f5f5f5',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4a90e2',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 15,
    maxHeight: 120,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 40,
  },
  deleteHint: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 8,
  },
});