import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from './supabase';
import { getResponsiveWidth, isVerySmallScreen } from './responsive';

export default function FeesPage({ onBack }) {
  const [classData, setClassData] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [studentArrears, setStudentArrears] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentFeeDetails, setStudentFeeDetails] = useState([]);
  const [feeTemplates, setFeeTemplates] = useState([]);
  const [showSetFees, setShowSetFees] = useState(false);
  const [newFee, setNewFee] = useState({ description: '', amount: '', due_date: '' });
  const [loading, setLoading] = useState(true);

  const classes = [
    'Creche', 'Nursery', 'KG1', 'KG2', 'Class 1', 'Class 2', 'Class 3', 
    'Class 4', 'Class 5', 'Class 6', 'JHS 1', 'JHS 2', 'JHS 3'
  ];

  useEffect(() => {
    fetchClassArrears();
    fetchFeeTemplates();
  }, []);

  const fetchClassArrears = async () => {
    setLoading(true);
    try {
      const { data: students, error } = await supabase
        .from('students')
        .select('*');
      
      if (error) throw error;

      const { data: fees, error: feesError } = await supabase
        .from('student_fees')
        .select('*');

      const { data: templates, error: templatesError } = await supabase
        .from('fee_templates')
        .select('*')
        .eq('is_active', true);

      // Auto-generate fees for students based on templates
      if (templates && students) {
        await generateStudentFees(students, templates, fees || []);
      }

      // Refetch fees after generation
      const { data: updatedFees } = await supabase
        .from('student_fees')
        .select('*');

      // Group students by class and calculate fees
      const classArrears = classes.map(className => {
        const classStudents = (students || []).filter(student => student.class === className);
        const studentsWithFees = classStudents.map(student => {
          const studentFees = (updatedFees || []).filter(fee => fee.student_id === student.student_id);
          const totalPaid = studentFees.reduce((sum, fee) => sum + (fee.amount_paid || 0), 0);
          const totalDue = studentFees.reduce((sum, fee) => sum + (fee.amount_due || 0), 0);
          const arrears = Math.max(0, totalDue - totalPaid);
          
          return {
            ...student,
            arrears: arrears,
            totalDue: totalDue,
            totalPaid: totalPaid
          };
        });

        const studentsWithArrears = studentsWithFees.filter(student => student.arrears > 0);

        return {
          className,
          students: studentsWithArrears,
          allStudents: studentsWithFees,
          totalArrears: studentsWithArrears.reduce((sum, student) => sum + student.arrears, 0),
          count: studentsWithArrears.length,
          totalStudents: classStudents.length
        };
      });

      setClassData(classArrears);
    } catch (error) {
      console.error('Error fetching arrears:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateStudentFees = async (students, templates, existingFees) => {
    const feesToInsert = [];
    
    for (const student of students) {
      const classTemplates = templates.filter(template => template.class === student.class);
      
      for (const template of classTemplates) {
        const existingFee = existingFees.find(fee => 
          fee.student_id === student.student_id && 
          fee.description === template.description
        );
        
        if (!existingFee) {
          feesToInsert.push({
            student_id: student.student_id,
            student_name: student.name,
            class: student.class,
            description: template.description,
            amount_due: template.amount,
            amount_paid: 0,
            due_date: template.due_date,
            status: 'Pending'
          });
        }
      }
    }
    
    if (feesToInsert.length > 0) {
      await supabase.from('student_fees').insert(feesToInsert);
    }
  };

  const selectClass = (classInfo) => {
    setSelectedClass(classInfo.className);
    setStudentArrears(classInfo.allStudents || classInfo.students);
    setSelectedStudent(null);
  };

  const selectStudent = async (student) => {
    setSelectedStudent(student);
    
    try {
      const { data: fees, error } = await supabase
        .from('student_fees')
        .select('*')
        .eq('student_id', student.student_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const feesWithStatus = (fees || []).map(fee => {
        let status = 'Pending';
        if (fee.amount_paid >= fee.amount_due) {
          status = 'Paid';
        } else if (fee.amount_paid > 0) {
          status = 'Partial';
        }
        return { ...fee, status };
      });
      
      setStudentFeeDetails(feesWithStatus);
    } catch (error) {
      console.error('Error fetching student fees:', error);
    }
  };

  const fetchFeeTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('fee_templates')
        .select('*')
        .eq('is_active', true)
        .order('class');
      
      if (error) console.log('Fee templates not found');
      setFeeTemplates(data || []);
    } catch (error) {
      console.error('Error fetching fee templates:', error);
    }
  };

  const addFeeTemplate = async () => {
    if (!selectedClass || !newFee.description || !newFee.amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('fee_templates')
        .insert({
          class: selectedClass,
          description: newFee.description,
          amount: parseFloat(newFee.amount),
          due_date: newFee.due_date || null
        });
      
      if (error) throw error;
      
      setNewFee({ description: '', amount: '', due_date: '' });
      setShowSetFees(false);
      fetchFeeTemplates();
      Alert.alert('Success', 'Fee template added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add fee template');
    }
  };

  const deleteFeeTemplate = async (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this fee template?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('fee_templates')
                .delete()
                .eq('id', id);
              
              if (error) throw error;
              fetchFeeTemplates();
              Alert.alert('Success', 'Fee template deleted!');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete fee template');
            }
          }
        }
      ]
    );
  };

  const renderClassItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.classCard}
      onPress={() => selectClass(item)}
    >
      <Text style={styles.className}>{item.className}</Text>
      <View style={styles.arrearsInfo}>
        <Text style={styles.studentCount}>{item.totalStudents} total students</Text>
        <Text style={styles.studentCount}>{item.count} students with arrears</Text>
        <Text style={styles.totalArrears}>Total Arrears: GH₵{item.totalArrears.toFixed(2)}</Text>
      </View>
      <Text style={styles.tapHint}>Tap to view details</Text>
    </TouchableOpacity>
  );

  const renderStudentArrear = ({ item }) => (
    <View style={styles.studentCard}>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={styles.studentDetails}>ID: {item.student_id}</Text>
        <Text style={styles.studentDetails}>Email: {item.email}</Text>
      </View>
      <View style={styles.arrearsAmount}>
        <Text style={styles.arrearsLabel}>Arrears</Text>
        <Text style={styles.arrearsValue}>GH₵{item.arrears.toFixed(2)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={selectedStudent ? () => setSelectedStudent(null) : selectedClass ? () => setSelectedClass(null) : onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {selectedStudent ? `${selectedStudent.name} - Fee Details` : selectedClass ? `${selectedClass} - Fees` : 'Fees Management'}
        </Text>
        {selectedClass && !selectedStudent && (
          <TouchableOpacity 
            style={styles.setFeesButton}
            onPress={() => setShowSetFees(!showSetFees)}
          >
            <Text style={styles.setFeesButtonText}>Set Fees</Text>
          </TouchableOpacity>
        )}
      </View>

      {selectedStudent ? (
        <View style={styles.studentDetailsView}>
          <View style={styles.studentHeader}>
            <Text style={styles.studentHeaderName}>{selectedStudent.name}</Text>
            <Text style={styles.studentHeaderInfo}>ID: {selectedStudent.student_id} | Class: {selectedStudent.class}</Text>
            <Text style={styles.studentHeaderSummary}>
              Total Due: GH₵{(selectedStudent.totalDue || 0).toFixed(2)} | 
              Paid: GH₵{(selectedStudent.totalPaid || 0).toFixed(2)} | 
              Balance: GH₵{(selectedStudent.arrears || 0).toFixed(2)}
            </Text>
          </View>
          
          <Text style={styles.sectionTitle}>Fee Breakdown</Text>
          <FlatList
            data={studentFeeDetails}
            renderItem={({ item }) => (
              <View style={styles.feeDetailCard}>
                <View style={styles.feeDetailHeader}>
                  <Text style={styles.feeDetailDescription}>{item.description}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                </View>
                
                <View style={styles.feeDetailAmounts}>
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Amount Due:</Text>
                    <Text style={styles.amountValue}>GH₵{item.amount_due.toFixed(2)}</Text>
                  </View>
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Amount Paid:</Text>
                    <Text style={[styles.amountValue, { color: '#4ECDC4' }]}>GH₵{item.amount_paid.toFixed(2)}</Text>
                  </View>
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Balance:</Text>
                    <Text style={[styles.amountValue, { color: '#FF6B6B' }]}>GH₵{(item.amount_due - item.amount_paid).toFixed(2)}</Text>
                  </View>
                  {item.due_date && (
                    <View style={styles.amountRow}>
                      <Text style={styles.amountLabel}>Due Date:</Text>
                      <Text style={styles.dueDateText}>{new Date(item.due_date).toLocaleDateString()}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No fee records found for this student</Text>
            }
          />
        </View>
      ) : !selectedClass ? (
        <FlatList
          data={classData}
          renderItem={renderClassItem}
          keyExtractor={(item) => item.className}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={fetchClassArrears}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No students with arrears found</Text>
          }
        />
      ) : (
        <View style={styles.studentArrearsView}>
          {showSetFees && (
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              <View style={styles.setFeesCard}>
                <Text style={styles.setFeesTitle}>Set Fee for {selectedClass}</Text>
                
                <TextInput
                  style={styles.input}
                  placeholder="Fee Description (e.g., Tuition Fee)"
                  value={newFee.description}
                  onChangeText={(text) => setNewFee({...newFee, description: text})}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Amount (GH₵)"
                  value={newFee.amount}
                  onChangeText={(text) => setNewFee({...newFee, amount: text})}
                  keyboardType="numeric"
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Due Date (YYYY-MM-DD) - Optional"
                  value={newFee.due_date}
                  onChangeText={(text) => setNewFee({...newFee, due_date: text})}
                />
                
                <View style={styles.feeButtonsRow}>
                  <TouchableOpacity style={styles.addFeeButton} onPress={addFeeTemplate}>
                    <Text style={styles.addFeeButtonText}>Add Fee</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setShowSetFees(false)}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          )}

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Class Summary</Text>
            <Text style={styles.summaryText}>
              {studentArrears.length} students with total arrears of GH₵
              {studentArrears.reduce((sum, student) => sum + student.arrears, 0).toFixed(2)}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Fee Templates for {selectedClass}</Text>
          <FlatList
            data={feeTemplates.filter(fee => fee.class === selectedClass)}
            renderItem={({ item }) => (
              <View style={styles.feeTemplateCard}>
                <View style={styles.feeTemplateInfo}>
                  <Text style={styles.feeTemplateDescription}>{item.description}</Text>
                  <Text style={styles.feeTemplateAmount}>GH₵{item.amount}</Text>
                  {item.due_date && (
                    <Text style={styles.feeTemplateDue}>Due: {new Date(item.due_date).toLocaleDateString()}</Text>
                  )}
                </View>
                <TouchableOpacity 
                  style={styles.deleteFeeButton}
                  onPress={() => deleteFeeTemplate(item.id)}
                >
                  <Text style={styles.deleteFeeButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No fee templates set for this class</Text>
            }
          />
          
          <Text style={styles.sectionTitle}>All Students - Fee Status</Text>
          <FlatList
            data={studentArrears}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.studentCard}
                onPress={() => selectStudent(item)}
              >
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{item.name}</Text>
                  <Text style={styles.studentDetails}>ID: {item.student_id}</Text>
                  <Text style={styles.studentDetails}>Total Due: GH₵{(item.totalDue || 0).toFixed(2)}</Text>
                  <Text style={styles.studentDetails}>Total Paid: GH₵{(item.totalPaid || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.arrearsAmount}>
                  <Text style={styles.arrearsLabel}>
                    {item.arrears > 0 ? 'Owes' : 'Paid'}
                  </Text>
                  <Text style={[styles.arrearsValue, { color: item.arrears > 0 ? '#FF6B6B' : '#4ECDC4' }]}>
                    GH₵{item.arrears > 0 ? item.arrears.toFixed(2) : '0.00'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No students in this class</Text>
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: getResponsiveWidth(6),
    paddingTop: 10,
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
    fontSize: isVerySmallScreen() ? 18 : 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  classCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  className: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  arrearsInfo: {
    marginBottom: 10,
  },
  studentCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  totalArrears: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  tapHint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  studentArrearsView: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
  },
  studentCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  studentDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  arrearsAmount: {
    alignItems: 'center',
  },
  arrearsLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  arrearsValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 40,
  },
  setFeesButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  setFeesButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  setFeesCard: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  setFeesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  feeButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addFeeButton: {
    backgroundColor: '#4ECDC4',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  addFeeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FF6B6B',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  feeTemplateCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeTemplateInfo: {
    flex: 1,
  },
  feeTemplateDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  feeTemplateAmount: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  feeTemplateDue: {
    fontSize: 12,
    color: '#666',
  },
  deleteFeeButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteFeeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  studentDetailsView: {
    flex: 1,
  },
  studentHeader: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  studentHeaderName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  studentHeaderInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  studentHeaderSummary: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  feeDetailCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  feeDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  feeDetailDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  feeDetailAmounts: {
    gap: 8,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  dueDateText: {
    fontSize: 14,
    color: '#666',
  },
});

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'paid': return '#4ECDC4';
    case 'partial': return '#FFA726';
    case 'pending': return '#FF6B6B';
    default: return '#666';
  }
};