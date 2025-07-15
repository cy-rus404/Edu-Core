import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal, ScrollView } from 'react-native';
import { supabase } from './supabase';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AttendancePage({ onBack, teacherClass }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [attendance, setAttendance] = useState({});
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [attendanceReport, setAttendanceReport] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
    fetchAttendanceForDate(date);
  }, [date]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('class', teacherClass);
      
      if (error) {
        console.error('Error fetching students:', error);
      } else {
        setStudents(data || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceForDate = async (selectedDate) => {
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('class', teacherClass)
        .eq('date', dateString);
      
      if (error) {
        console.error('Error fetching attendance:', error);
        return;
      }
      
      // Convert to object with student_id as key
      const attendanceMap = {};
      data.forEach(record => {
        attendanceMap[record.student_id] = record.status;
      });
      
      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const markAttendance = async (studentId, status) => {
    try {
      const dateString = date.toISOString().split('T')[0];
      
      // Check if attendance record exists
      const { data: existingRecord, error: fetchError } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentId)
        .eq('date', dateString)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') { // Not found error
        Alert.alert('Error', fetchError.message);
        return;
      }
      
      let result;
      if (existingRecord) {
        // Update existing record
        result = await supabase
          .from('attendance')
          .update({ status })
          .eq('id', existingRecord.id);
      } else {
        // Create new record
        const student = students.find(s => s.student_id === studentId);
        result = await supabase
          .from('attendance')
          .insert([{
            student_id: studentId,
            student_name: student.name,
            class: teacherClass,
            date: dateString,
            status
          }]);
      }
      
      if (result.error) {
        Alert.alert('Error', result.error.message);
      } else {
        // Update local state
        setAttendance(prev => ({
          ...prev,
          [studentId]: status
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to mark attendance');
    }
  };

  const generateReport = async (studentId = null) => {
    try {
      let query = supabase
        .from('attendance')
        .select('*')
        .eq('class', teacherClass);
      
      if (studentId) {
        query = query.eq('student_id', studentId);
        const student = students.find(s => s.student_id === studentId);
        setSelectedStudent(student);
      } else {
        setSelectedStudent(null);
      }
      
      const { data, error } = await query;
      
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }
      
      // Group by date
      const reportData = data.reduce((acc, record) => {
        if (!acc[record.date]) {
          acc[record.date] = {
            date: record.date,
            present: 0,
            absent: 0,
            late: 0,
            students: []
          };
        }
        
        acc[record.date].students.push({
          id: record.student_id,
          name: record.student_name,
          status: record.status
        });
        
        if (record.status === 'present') {
          acc[record.date].present += 1;
        } else if (record.status === 'absent') {
          acc[record.date].absent += 1;
        } else if (record.status === 'late') {
          acc[record.date].late += 1;
        }
        
        return acc;
      }, {});
      
      // Convert to array and sort by date
      const sortedReport = Object.values(reportData).sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      
      setAttendanceReport(sortedReport);
      setReportModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate report');
    }
  };

  const [selectedStatus, setSelectedStatus] = useState({});

  const saveAttendance = async (studentId) => {
    if (!selectedStatus[studentId]) {
      Alert.alert('Error', 'Please select a status first');
      return;
    }
    
    await markAttendance(studentId, selectedStatus[studentId]);
    Alert.alert('Success', 'Attendance saved successfully');
  };

  const renderStudent = ({ item }) => {
    const status = attendance[item.student_id] || 'unmarked';
    const tempStatus = selectedStatus[item.student_id] || status;
    
    return (
      <View style={styles.studentRow}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.name}</Text>
          <Text style={styles.studentId}>ID: {item.student_id}</Text>
          <Text style={styles.statusText}>Status: 
            <Text style={{
              color: tempStatus === 'present' ? '#4cd964' : 
                     tempStatus === 'absent' ? '#ff3b30' : 
                     tempStatus === 'late' ? '#ff9500' : '#666'
            }}>
              {tempStatus.charAt(0).toUpperCase() + tempStatus.slice(1)}
            </Text>
          </Text>
        </View>
        
        <View style={styles.attendanceButtons}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              tempStatus === 'present' && styles.presentButton
            ]}
            onPress={() => setSelectedStatus({...selectedStatus, [item.student_id]: 'present'})}
          >
            <Text style={styles.buttonText}>Present</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.statusButton,
              tempStatus === 'absent' && styles.absentButton
            ]}
            onPress={() => setSelectedStatus({...selectedStatus, [item.student_id]: 'absent'})}
          >
            <Text style={styles.buttonText}>Absent</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.statusButton,
              tempStatus === 'late' && styles.lateButton
            ]}
            onPress={() => setSelectedStatus({...selectedStatus, [item.student_id]: 'late'})}
          >
            <Text style={styles.buttonText}>Late</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={() => saveAttendance(item.student_id)}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.reportButton}
            onPress={() => generateReport(item.student_id)}
          >
            <Text style={styles.reportButtonText}>Report</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderReportItem = ({ item }) => (
    <View style={styles.reportItem}>
      <Text style={styles.reportDate}>{item.date}</Text>
      
      {!selectedStudent ? (
        <View style={styles.reportSummary}>
          <Text style={styles.reportStat}>Present: {item.present}</Text>
          <Text style={styles.reportStat}>Absent: {item.absent}</Text>
          <Text style={styles.reportStat}>Late: {item.late}</Text>
        </View>
      ) : (
        <View style={styles.reportSummary}>
          <Text style={styles.reportStat}>
            Status: {
              item.students.find(s => s.id === selectedStudent.student_id)?.status || 'Unmarked'
            }
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Attendance</Text>
      </View>
      
      <View style={styles.dateContainer}>
        <Text style={styles.dateLabel}>Date: </Text>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>
            {date.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
        
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setDate(selectedDate);
              }
            }}
          />
        )}
      </View>
      
      <View style={styles.classInfo}>
        <Text style={styles.classText}>Class: {teacherClass}</Text>
        <TouchableOpacity 
          style={styles.generateReportButton}
          onPress={() => generateReport()}
        >
          <Text style={styles.generateReportText}>Generate Class Report</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={students}
        renderItem={renderStudent}
        keyExtractor={(item) => item.id.toString()}
        style={styles.studentList}
        refreshing={loading}
        onRefresh={fetchStudents}
      />
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={reportModalVisible}
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedStudent ? `Attendance Report: ${selectedStudent.name}` : 'Class Attendance Report'}
            </Text>
            
            <ScrollView style={styles.reportList}>
              {attendanceReport.length > 0 ? (
                attendanceReport.map(item => (
                  <View key={item.date} style={styles.reportItem}>
                    <Text style={styles.reportDate}>{item.date}</Text>
                    
                    {!selectedStudent ? (
                      <View style={styles.reportSummary}>
                        <Text style={styles.reportStat}>Present: {item.present}</Text>
                        <Text style={styles.reportStat}>Absent: {item.absent}</Text>
                        <Text style={styles.reportStat}>Late: {item.late}</Text>
                      </View>
                    ) : (
                      <View style={styles.reportSummary}>
                        <Text style={styles.reportStat}>
                          Status: {
                            item.students.find(s => s.id === selectedStudent.student_id)?.status || 'Unmarked'
                          }
                        </Text>
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No attendance records found</Text>
              )}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setReportModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
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
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  dateButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  classInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  classText: {
    fontSize: 16,
    fontWeight: '600',
  },
  generateReportButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  generateReportText: {
    color: '#fff',
    fontWeight: '600',
  },
  studentList: {
    flex: 1,
  },
  studentRow: {
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
  studentInfo: {
    marginBottom: 15,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  studentId: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    fontWeight: '500',
  },
  attendanceButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statusButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    width: '30%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  presentButton: {
    backgroundColor: '#4cd964',
    borderColor: '#3cb053',
  },
  absentButton: {
    backgroundColor: '#ff3b30',
    borderColor: '#d93229',
  },
  lateButton: {
    backgroundColor: '#ff9500',
    borderColor: '#d67e00',
  },
  buttonText: {
    color: '#333',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  reportButton: {
    backgroundColor: '#5856d6',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  reportButtonText: {
    color: '#fff',
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
  reportList: {
    maxHeight: 400,
  },
  reportItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  reportDate: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  reportSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reportStat: {
    fontSize: 14,
    color: '#333',
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  closeButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});