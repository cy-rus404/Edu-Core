import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, Modal } from 'react-native';
import { supabase } from './supabase';

export default function TimetablePage({ onBack, userRole, classId }) {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [lessonData, setLessonData] = useState({
    subject: '',
    teacher: '',
    time: '',
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = ['1st Period', '2nd Period', '3rd Period', '4th Period', '5th Period', '6th Period', '7th Period', '8th Period'];

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      const { data, error } = await supabase
        .from('timetable')
        .select('*')
        .eq('class_id', classId)
        .order('day', { ascending: true });
      
      if (error) {
        if (error.code === 'PGRST205') {
          console.log('Timetable table not found - showing empty timetable');
          // Create empty timetable structure
          const emptyTimetable = days.map(day => ({
            day,
            periods: periods.map(period => ({
              period,
              subject: '',
              teacher: '',
              time_frame: '',
              id: null
            }))
          }));
          setTimetable(emptyTimetable);
          setLoading(false);
          return;
        }
        console.error('Error fetching timetable:', error);
        return;
      }

      // Organize timetable by day and period
      const organizedTimetable = days.map(day => {
        const daySchedule = data?.filter(item => item.day === day) || [];
        return {
          day,
          periods: periods.map(period => {
            const periodData = daySchedule.find(item => item.period === period);
            return {
              period,
              subject: periodData?.subject || '',
              teacher: periodData?.teacher || '',
              time_frame: periodData?.time_frame || '',
              id: periodData?.id || null
            };
          })
        };
      });

      setTimetable(organizedTimetable);
    } catch (error) {
      console.error('Error fetching timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLesson = async (day, period) => {
    if (userRole !== 'teacher') return;
    
    setSelectedDay(day);
    setSelectedPeriod(period);
    
    try {
      // Get teacher data to pre-fill subject
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: teacherData, error } = await supabase
          .from('teachers')
          .select('name, subject')
          .eq('email', user.email)
          .single();
        
        if (!error && teacherData) {
          setLessonData({
            subject: teacherData.subject || '',
            teacher: teacherData.name || '',
            time: '',
          });
        } else {
          setLessonData({
            subject: '',
            teacher: '',
            time: '',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error);
      setLessonData({
        subject: '',
        teacher: '',
        time: '',
      });
    }
    
    setModalVisible(true);
  };

  const saveLesson = async () => {
    if (!lessonData.subject || !lessonData.teacher) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const existingLesson = timetable
        .find(d => d.day === selectedDay)
        ?.periods.find(p => p.period === selectedPeriod);

      if (existingLesson?.id) {
        // Update existing lesson
        const { error } = await supabase
          .from('timetable')
          .update({
            subject: lessonData.subject,
            teacher: lessonData.teacher,
            time_frame: lessonData.time,
          })
          .eq('id', existingLesson.id);
        
        if (error) {
          Alert.alert('Error', error.message);
          return;
        }
      } else {
        // Create new lesson
        const { error } = await supabase
          .from('timetable')
          .insert([{
            class_id: classId,
            day: selectedDay,
            period: selectedPeriod,
            subject: lessonData.subject,
            teacher: lessonData.teacher,
            time_frame: lessonData.time,
          }]);
        
        if (error) {
          Alert.alert('Error', error.message);
          return;
        }
      }

      setModalVisible(false);
      fetchTimetable();
      Alert.alert('Success', 'Timetable updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update timetable');
    }
  };

  const renderDayItem = ({ item }) => (
    <View style={styles.dayContainer}>
      <Text style={styles.dayTitle}>{item.day}</Text>
      {item.periods.map(period => (
        <TouchableOpacity 
          key={period.period}
          style={styles.periodItem}
          onPress={() => userRole === 'teacher' && handleAddLesson(item.day, period.period)}
          disabled={userRole !== 'teacher'}
        >
          <View style={styles.periodHeader}>
            <Text style={styles.periodTitle}>{period.period}</Text>
            {userRole === 'teacher' && (
              <Text style={styles.editText}>Edit</Text>
            )}
          </View>
          
          {period.subject ? (
            <View style={styles.lessonInfo}>
              <Text style={styles.subjectText}>{period.subject}</Text>
              <Text style={styles.teacherText}>Teacher: {period.teacher}</Text>
              {period.time_frame && <Text style={styles.timeFrameText}>Time: {period.time_frame}</Text>}
            </View>
          ) : (
            <Text style={styles.emptyPeriod}>
              {userRole === 'teacher' ? 'Tap to add lesson' : 'No lesson scheduled'}
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {userRole === 'teacher' ? 'Manage Timetable' : 'Class Timetable'}
        </Text>
      </View>
      
      <FlatList
        data={timetable}
        renderItem={renderDayItem}
        keyExtractor={(item) => item.day}
        style={styles.list}
        refreshing={loading}
        onRefresh={fetchTimetable}
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
              <Text style={styles.modalTitle}>
                {selectedDay} - {selectedPeriod}
              </Text>
              
              <TextInput
                style={styles.input}
                placeholder="Subject *"
                value={lessonData.subject}
                onChangeText={(text) => setLessonData({...lessonData, subject: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Teacher Name *"
                value={lessonData.teacher}
                onChangeText={(text) => setLessonData({...lessonData, teacher: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Time (e.g., 9:00 - 10:30) *"
                value={lessonData.time}
                onChangeText={(text) => setLessonData({...lessonData, time: text})}
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
                  onPress={saveLesson}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
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
  list: {
    flex: 1,
  },
  dayContainer: {
    marginBottom: 30,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  periodItem: {
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
  periodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  periodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  editText: {
    fontSize: 14,
    color: '#4a90e2',
  },
  lessonInfo: {
    paddingTop: 5,
  },
  subjectText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  teacherText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  timeFrameText: {
    fontSize: 14,
    color: '#666',
  },
  emptyPeriod: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
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