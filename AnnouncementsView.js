import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { supabase } from './supabase';

export default function AnnouncementsView({ onBack, userRole, userId }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      // Get announcements for this user's role or all users
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
      const unread = data.filter(announcement => 
        !announcement.read_by.includes(userId)
      ).length;
      
      setUnreadCount(unread);
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (announcement) => {
    // If already read, do nothing
    if (announcement.read_by.includes(userId)) {
      return;
    }

    try {
      // Add user to read_by array
      const updatedReadBy = [...announcement.read_by, userId];
      
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
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking announcement as read:', error);
    }
  };

  const renderAnnouncementItem = ({ item }) => {
    const isRead = item.read_by.includes(userId);
    
    return (
      <TouchableOpacity 
        style={[styles.announcementCard, !isRead && styles.unreadCard]}
        onPress={() => markAsRead(item)}
      >
        <View style={styles.announcementHeader}>
          <Text style={styles.announcementTitle}>{item.title}</Text>
          {!isRead && <View style={styles.unreadIndicator} />}
        </View>
        
        <Text style={styles.announcementMessage}>{item.message}</Text>
        
        <View style={styles.announcementFooter}>
          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Announcements</Text>
        {unreadCount > 0 && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
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
  badgeContainer: {
    backgroundColor: '#ff3b30',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff3b30',
  },
  announcementMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
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
});