import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { supabase } from './supabase';

export default function StudentAttendanceView({ onBack, studentData }) {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    attendanceRate: 0
  });

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentData.student_id)
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Error fetching attendance:', error);
        return;
      }

      setAttendanceRecords(data || []);
      
      // Calculate summary
      if (data && data.length > 0) {
        const totalDays = data.length;
        const presentDays = data.filter(record => record.status === 'present').length;
        const absentDays = data.filter(record => record.status === 'absent').length;
        const attendanceRate = Math.round((presentDays / totalDays) * 100);
        
        setSummary({
          totalDays,
          presentDays,
          absentDays,
          attendanceRate
        });
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'present':
        return styles.presentStatus;
      case 'absent':
        return styles.absentStatus;
      case 'late':
        return styles.lateStatus;
      default:
        return {};
    }
  };

  const renderAttendanceItem = ({ item }) => (
    <View style={styles.attendanceItem}>
      <Text style={styles.dateText}>{item.date}</Text>
      <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
        <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Attendance</Text>
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Attendance Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total School Days:</Text>
          <Text style={styles.summaryValue}>{summary.totalDays}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Days Present:</Text>
          <Text style={styles.summaryValue}>{summary.presentDays}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Days Absent:</Text>
          <Text style={styles.summaryValue}>{summary.absentDays}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Attendance Rate:</Text>
          <Text style={[
            styles.summaryValue, 
            summary.attendanceRate >= 75 ? styles.goodRate : styles.badRate
          ]}>
            {summary.attendanceRate}%
          </Text>
        </View>
      </View>
      
      <Text style={styles.sectionTitle}>Attendance Records</Text>
      
      <FlatList
        data={attendanceRecords}
        renderItem={renderAttendanceItem}
        keyExtractor={(item) => `${item.student_id}-${item.date}`}
        style={styles.list}
        refreshing={loading}
        onRefresh={fetchAttendance}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No attendance records found</Text>
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
  summaryContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  goodRate: {
    color: '#4cd964',
  },
  badRate: {
    color: '#ff3b30',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  list: {
    flex: 1,
  },
  attendanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  presentStatus: {
    backgroundColor: '#4cd964',
  },
  absentStatus: {
    backgroundColor: '#ff3b30',
  },
  lateStatus: {
    backgroundColor: '#ff9500',
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 40,
  },
});